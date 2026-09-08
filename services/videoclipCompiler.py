import os
import sys
import json
import time
import urllib.request
import urllib.parse
import subprocess

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

FFMPEG_PATH = r"C:\ARKAIOS\ShortGPT\ffmpeg-2026-08-17-git-426841da9d-full_build\bin\ffmpeg.exe"

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
    print(f"[{progress}%] {status} - {details}")

def download_image(prompt, filepath, width=1280, height=720):
    if os.path.exists(filepath) and os.path.getsize(filepath) > 10000:
        return True
    
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&seed={int(time.time()*1000)%1000000}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = resp.read()
                with open(filepath, "wb") as f:
                    f.write(data)
            if os.path.getsize(filepath) > 5000:
                return True
        except Exception as e:
            time.sleep(2)
    return False

def render_scene(ffmpeg_bin, img_path, clip_path, duration, zoom_dir="in", width=1920, height=1080):
    fps = 30
    total_frames = int(fps * duration)
    
    if zoom_dir == "in":
        zoom_expr = "min(pzoom+0.0005,1.15)"
    else:
        zoom_expr = "max(1.15-0.0005*on,1.0)"
    
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

def compile_videoclip(config_path):
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
        
    job_id = config.get("jobId", f"job_{int(time.time())}")
    job_dir = config.get("outputDir", os.path.join(os.getcwd(), "public", "renders", job_id))
    os.makedirs(job_dir, exist_ok=True)
    
    audio_path = config.get("audioPath", "")
    aspect_ratio = config.get("aspectRatio", "16:9")
    width, height = (1080, 1920) if aspect_ratio == "9:16" else (1920, 1080)
    img_w, img_h = (720, 1280) if aspect_ratio == "9:16" else (1280, 720)
    
    scenes = config.get("scenes", [])
    subtitles_text = config.get("subtitlesText", "")
    
    update_progress(job_dir, 5, "INITIALIZING", "Iniciando compilador de escenarios dinámicos...")
    
    # 1. Crear archivo de subtítulos
    sub_file = os.path.join(job_dir, "subtitles.ass")
    if subtitles_text.strip():
        with open(sub_file, "w", encoding="utf-8") as f:
            f.write(subtitles_text)
    
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
        
        percent = int(10 + (idx / total_scenes) * 60)
        update_progress(job_dir, percent, "GENERATING_SCENE", f"Creando Escena #{idx+1}: {prompt[:40]}...")
        
        download_image(prompt, img_path, width=img_w, height=img_h)
        success = render_scene(FFMPEG_PATH, img_path, clip_path, duration, zoom_dir, width, height)
        if success:
            clips.append(clip_path)
            
    # 3. Concatenar
    update_progress(job_dir, 75, "CONCATENATING", "Uniendo escenas cinematográficas...")
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
    update_progress(job_dir, 90, "FINALIZING", "Sincronizando audio maestro y subtítulos...")
    output_video = os.path.join(job_dir, "final_videoclip.mp4")
    
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
        update_progress(job_dir, 100, "COMPLETED", output_video)
        return output_video
    else:
        update_progress(job_dir, -1, "ERROR", res.stderr.decode('utf-8', errors='ignore')[:300])
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cfg = sys.argv[1]
        compile_videoclip(cfg)
    else:
        print("Uso: python videoclipCompiler.py <config.json>")
