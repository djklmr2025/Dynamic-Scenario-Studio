import os
import sys
import json
import time
import re
import shutil
import urllib.request
import urllib.parse
import subprocess

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

FFMPEG_PATH = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or r"C:\ARKAIOS\ShortGPT\ffmpeg-2026-08-17-git-426841da9d-full_build\bin\ffmpeg.exe"

def update_progress(job_dir, progress, status, details=""):
    progress_file = os.path.join(job_dir, "progress.json")
    data = {
        "progress": progress,
        "status": status,
        "details": details,
        "timestamp": time.time()
    }
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(data, f)
    print(f"[{progress}%] {status} - {details}", flush=True)

def parse_time(t_str):
    parts = t_str.strip().split(":")
    if len(parts) == 2:
        m, s = parts
        return int(m) * 60 + float(s)
    elif len(parts) == 3:
        h, m, s = parts
        return int(h) * 3600 + int(m) * 60 + float(s)
    return float(t_str)

def format_ass_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def parse_lrc_to_ass(raw_text, width=1920, height=1080):
    if "[Script Info]" in raw_text:
        return raw_text

    header = f"""[Script Info]
Title: Dynamic Scenario Studio - ARKAIOS
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: {width}
PlayResY: {height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TitleStyle,Trebuchet MS,46,&H00E0FFFF,&H000000FF,&H00101010,&H80000000,-1,0,0,0,100,100,1,0,1,3,2,2,40,40,95,1
Style: LyricStyle,Trebuchet MS,38,&H00FFFFFF,&H000000FF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,2.5,2,2,40,40,42,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    lines = raw_text.strip().splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        match_range = re.match(r"^\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]\s*(.*)$", line)
        if match_range:
            start_s = parse_time(match_range.group(1))
            end_s = parse_time(match_range.group(2))
            title = match_range.group(3).strip()
            
            i += 1
            lyric_lines = []
            while i < len(lines) and not re.match(r"^\[\d{1,2}:\d{2}", lines[i].strip()):
                if lines[i].strip():
                    lyric_lines.append(lines[i].strip())
                i += 1
                
            ass_start = format_ass_time(start_s)
            ass_end = format_ass_time(end_s)
            
            if title:
                events.append(f"Dialogue: 0,{ass_start},{ass_end},TitleStyle,,0,0,0,,{{\\fad(350,350)}}{title}")
            if lyric_lines:
                text_block = "\\N".join(lyric_lines)
                events.append(f"Dialogue: 1,{ass_start},{ass_end},LyricStyle,,0,0,0,,{{\\fad(350,350)}}{text_block}")
            continue

        match_single = re.match(r"^\[(\d{1,2}:\d{2})\]\s*(.*)$", line)
        if match_single:
            start_s = parse_time(match_single.group(1))
            end_s = start_s + 5.0
            content = match_single.group(2).strip()
            ass_start = format_ass_time(start_s)
            ass_end = format_ass_time(end_s)
            events.append(f"Dialogue: 0,{ass_start},{ass_end},LyricStyle,,0,0,0,,{{\\fad(300,300)}}{content}")
        i += 1

    return header + "\n".join(events) + "\n"

def download_image(prompt, filepath, width=1280, height=720):
    if os.path.exists(filepath) and os.path.getsize(filepath) > 10000:
        return True
    
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&seed={int(time.time()*1000)%1000000}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                with open(filepath, "wb") as f:
                    f.write(data)
            if os.path.getsize(filepath) > 5000:
                return True
        except Exception:
            time.sleep(1)
    return False

def render_scene(ffmpeg_bin, img_path, clip_path, duration, zoom_dir="in", width=1920, height=1080):
    fps = 30
    total_frames = int(fps * duration)
    
    if zoom_dir == "in":
        zoom_expr = "min(pzoom+0.00045,1.15)"
    else:
        zoom_expr = "max(1.15-0.00045*on,1.0)"
    
    vf = f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},zoompan=z='{zoom_expr}':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={width}x{height}:fps={fps},format=yuv420p"
    
    cmd = [
        ffmpeg_bin, "-y",
        "-loop", "1",
        "-i", img_path,
        "-t", str(duration),
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        clip_path
    ]
    
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return res.returncode == 0

def compile_videoclip(config_path, custom_output_dir=None):
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
        
    job_id = config.get("jobId", f"job_{int(time.time())}")
    
    if custom_output_dir:
        job_dir = custom_output_dir
    else:
        job_dir = config.get("outputDir", os.path.join(os.getcwd(), "public", "renders", job_id))
    os.makedirs(job_dir, exist_ok=True)
    
    audio_path = config.get("audioPath", "")
    aspect_ratio = config.get("aspectRatio", "16:9")
    width, height = (1080, 1920) if aspect_ratio == "9:16" else (1920, 1080)
    img_w, img_h = (720, 1280) if aspect_ratio == "9:16" else (1280, 720)
    
    scenes = config.get("scenes", [])
    subtitles_text = config.get("subtitlesText", "")
    output_filename = config.get("outputFilename", "final_videoclip.mp4")
    
    update_progress(job_dir, 5, "INITIALIZING", "Iniciando compilador cinematográfico...")
    
    # 1. Crear y formatear archivo de subtítulos ASS
    sub_file = os.path.join(job_dir, "subtitles.ass")
    if subtitles_text.strip():
        ass_content = parse_lrc_to_ass(subtitles_text, width=width, height=height)
        with open(sub_file, "w", encoding="utf-8") as f:
            f.write(ass_content)
    
    # 2. Generar y Renderizar cada Escena
    clips = []
    total_scenes = len(scenes)
    
    for idx, sc in enumerate(scenes):
        sc_id = sc.get("id", f"scn_{idx+1}")
        duration = float(sc.get("duration", 10.0))
        prompt = sc.get("prompt") or sc.get("description", "Cinematic landscape")
        zoom_dir = sc.get("zoom_dir", "in" if idx % 2 == 0 else "out")
        
        img_path = os.path.join(job_dir, f"{sc_id}.jpg")
        clip_path = os.path.join(job_dir, f"{sc_id}.mp4")
        
        percent = int(10 + (idx / total_scenes) * 65)
        update_progress(job_dir, percent, "GENERATING_SCENE", f"Escena #{idx+1}/{total_scenes} ({duration}s)...")
        
        # Check if local image provided
        local_img = sc.get("imageUrl")
        if local_img and os.path.exists(local_img):
            if os.path.abspath(local_img) != os.path.abspath(img_path):
                shutil.copyfile(local_img, img_path)
        else:
            download_image(prompt, img_path, width=img_w, height=img_h)
            
        success = render_scene(FFMPEG_PATH, img_path, clip_path, duration, zoom_dir, width, height)
        if success:
            clips.append(clip_path)
            
    # 3. Concatenar
    update_progress(job_dir, 78, "CONCATENATING", "Uniendo tomas cinematográficas...")
    concat_list = os.path.join(job_dir, "concat.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for c in clips:
            f.write(f"file '{c.replace('\\', '/')}'\n")
            
    merged_raw = os.path.join(job_dir, "merged_raw.mp4")
    cmd_concat = [
        FFMPEG_PATH, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        merged_raw
    ]
    subprocess.run(cmd_concat, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    
    # 4. Mux de Audio y Subtítulos
    update_progress(job_dir, 90, "FINALIZING", "Sincronizando audio maestro y quemando subtítulos...")
    output_video = os.path.join(job_dir, output_filename)
    
    cmd_final = [FFMPEG_PATH, "-y", "-i", merged_raw]
    has_audio = bool(audio_path and os.path.exists(audio_path))
    if has_audio:
        cmd_final.extend(["-i", audio_path])
        
    has_subs = os.path.exists(sub_file) and os.path.getsize(sub_file) > 50
    if has_subs:
        safe_ass = sub_file.replace("\\", "/").replace(":", "\\:")
        cmd_final.extend(["-vf", f"ass='{safe_ass}'"])
        
    if has_audio:
        cmd_final.extend(["-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "320k", "-shortest"])
        
    cmd_final.extend([
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "19",
        output_video
    ])
    
    res = subprocess.run(cmd_final, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode == 0:
        update_progress(job_dir, 100, "COMPLETED", f"Videoclip generado: {output_video}")
        return {
            "success": True,
            "outputVideo": output_video,
            "duration": total_scenes,
            "jobDir": job_dir
        }
    else:
        err_msg = res.stderr.decode('utf-8', errors='ignore')[-300:]
        update_progress(job_dir, -1, "ERROR", err_msg)
        return {
            "success": False,
            "error": err_msg
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cfg = sys.argv[1]
        out_d = sys.argv[2] if len(sys.argv) > 2 else None
        compile_videoclip(cfg, out_d)
    else:
        print("Uso: python videoclipCompiler.py <config.json> [output_dir]")
