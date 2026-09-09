import os
import sys
import json
import time
import re
import math
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
FFPROBE_PATH = os.environ.get("FFPROBE_PATH") or shutil.which("ffprobe") or (
    FFMPEG_PATH.replace("ffmpeg.exe", "ffprobe.exe") if "ffmpeg.exe" in FFMPEG_PATH else "ffprobe"
)
PEXELS_KEY = os.environ.get("PEXELS_API_KEY") or "4vj6qTzLM9oc0gN7bdgr3vCO7jRDIBe0zJgknfq9geibx9hdQ16TVxpz"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

def run_cmd_silent(cmd, check=False):
    kwargs = {
        "stdout": subprocess.PIPE,
        "stderr": subprocess.PIPE
    }
    if os.name == "nt":
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0
        kwargs["startupinfo"] = startupinfo
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    if check:
        return subprocess.run(cmd, check=True, **kwargs)
    return subprocess.run(cmd, **kwargs)

def get_audio_duration(audio_path):
    if not audio_path or not os.path.exists(audio_path):
        return 0.0
    try:
        cmd = [
            FFPROBE_PATH,
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]
        res = run_cmd_silent(cmd)
        if res.returncode == 0:
            val = res.stdout.decode('utf-8', errors='ignore').strip()
            return float(val)
    except Exception as e:
        print(f"[WARN] Error midiendo duración de audio: {e}", flush=True)
    return 0.0

def update_progress(job_dir, progress, status, details=""):
    progress_file = os.path.join(job_dir, "progress.json")
    data = {
        "progress": progress,
        "status": status,
        "details": details,
        "timestamp": time.time()
    }
    try:
        with open(progress_file, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception as e:
        print(f"[WARN] Error guardando progreso: {e}", flush=True)
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
                events.append(f"Dialogue: 0,{ass_start},{ass_end},TitleStyle,,0,0,0,{{\\fad(350,350)}}{title}")
            if lyric_lines:
                text_block = "\\N".join(lyric_lines)
                events.append(f"Dialogue: 1,{ass_start},{ass_end},LyricStyle,,0,0,0,{{\\fad(350,350)}}{text_block}")
            continue

        match_single = re.match(r"^\[(\d{1,2}:\d{2})\]\s*(.*)$", line)
        if match_single:
            start_s = parse_time(match_single.group(1))
            end_s = start_s + 5.0
            content = match_single.group(2).strip()
            ass_start = format_ass_time(start_s)
            ass_end = format_ass_time(end_s)
            events.append(f"Dialogue: 0,{ass_start},{ass_end},LyricStyle,,0,0,0,{{\\fad(300,300)}}{content}")
        i += 1

    return header + "\n".join(events) + "\n"

def expand_theme_to_scenes(base_theme, total_duration, target_scene_duration=10.5):
    theme_lower = base_theme.lower()
    cleaned = re.sub(r'^(basate en la|haz un video de|video sobre|tema:|escena \d+:?)\s*', '', theme_lower, flags=re.IGNORECASE).strip()
    if not cleaned:
        cleaned = "cinematic coastal landscape"

    is_beach = any(w in cleaned for w in ["playa", "beach", "mar", "oceano", "ocean", "costa", "rio", "veracruz", "boca del rio", "arena", "waves"])
    is_night = any(w in cleaned for w in ["noche", "night", "nocturno", "neon", "oscur", "dark", "jazz"])
    is_city = any(w in cleaned for w in ["ciudad", "city", "urbano", "urban", "calle", "street", "edificio", "rascacielos"])
    is_car = any(w in cleaned for w in ["auto", "car", "carretera", "road", "conducir", "drive"])

    if is_beach:
        shot_keywords = [
            "drone aerial wide view beach ocean waves",
            "waves rolling on sandy beach shore sunny day",
            "tropical palm trees coastal breeze sunny beach",
            "coastal boardwalk ocean promenade sunny day",
            "golden hour sunset reflecting over ocean waters",
            "slow motion ocean tide turquoise water beach",
            "aerial flight along coastline and sand shore",
            "waves crashing on sea shore foam splash",
            "peaceful morning beach tide sunrise light",
            "boats on the coast calm tropical waters",
            "cinematic sunset dramatic sky over ocean beach",
            "coastal road scenic palm trees sunny view",
            "warm summer sun glittering on sea waves",
            "dusk sunset horizon orange sky ocean shoreline",
            "twilight calm waves shore lights reflecting",
            "nightfall coastal horizon peaceful ocean waves",
            "tropical sea horizon sunlight reflections",
            "emerald green ocean water rolling waves",
            "sandy dunes and coastal sea grass breeze",
            "cinematic wide panoramic view of ocean beach"
        ]
    elif is_night or is_city:
        shot_keywords = [
            "aerial drone view metropolis night lights",
            "neon signs reflections wet city streets night",
            "traffic light streaks downtown avenue night",
            "cinematic jazz club lounge warm interior atmosphere",
            "foggy night skyscrapers skyline lights",
            "vintage classic car driving empty wet avenue midnight",
            "bokeh city lights blurred background street night",
            "saxophone player silhouette warm stage spotlight",
            "subway train station night aesthetic urban",
            "coffee shop window rain drops night reflection",
            "panoramic rooftop view city skyline midnight blue",
            "street lamp glow dark quiet alleyway cinematic"
        ]
    elif is_car:
        shot_keywords = [
            "classic vintage car driving along coastal highway",
            "car windshield view rainy city night lights",
            "sports car speeding open desert highway sunset",
            "interior car dashboard evening neon city lights",
            "aerial drone chasing car winding mountain road",
            "rear view mirror scenic road golden hour sun",
            "car headlights illuminating dark country road",
            "convertible driving along palm tree boulevard"
        ]
    else:
        shot_keywords = [
            f"cinematic drone aerial view of {cleaned}",
            f"golden hour warm sunlight on {cleaned}",
            f"close up dramatic detail of {cleaned}",
            f"slow motion atmospheric footage of {cleaned}",
            f"wide angle panoramic shot of {cleaned}",
            f"sunset horizon glowing light with {cleaned}",
            f"smooth cinematic tracking camera movement {cleaned}",
            f"twilight dusk soft ambient lighting {cleaned}",
            f"crisp high definition 1080p footage of {cleaned}",
            f"dramatic depth of field bokeh with {cleaned}"
        ]

    num_scenes = max(1, int(math.ceil(total_duration / target_scene_duration)))
    dur_per_scene = round(total_duration / num_scenes, 2)

    generated = []
    for i in range(num_scenes):
        kw = shot_keywords[i % len(shot_keywords)]
        generated.append({
            "id": f"scn_{i+1:02d}",
            "duration": dur_per_scene,
            "query": kw,
            "motion": True
        })
    return generated

def search_pexels_video(query, pexels_key=PEXELS_KEY, index=0):
    q_clean = re.sub(r'^(basate en la|haz un video de|video sobre|tema:|escena \d+:?)\s*', '', query, flags=re.IGNORECASE).strip()
    
    candidates = []
    queries_to_try = [q_clean] if q_clean != query else []
    queries_to_try.append(query)
    
    # English keywords if Spanish beach terms detected
    if any(w in query.lower() for w in ["playa", "veracruz", "boca del rio", "mar", "costa"]):
        queries_to_try.append("beach ocean waves drone")
        queries_to_try.append("tropical coast sunset")

    for try_query in queries_to_try:
        if not try_query:
            continue
        try:
            encoded = urllib.parse.quote(try_query)
            url = f"https://api.pexels.com/videos/search?query={encoded}&per_page=20&orientation=landscape"
            req = urllib.request.Request(url, headers={
                "Authorization": pexels_key,
                "User-Agent": USER_AGENT
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                vlist = data.get("videos", [])
                if vlist:
                    candidates.extend(vlist)
                    break
        except Exception as e:
            print(f"[WARN BUSCANDO PEXELS] {try_query}: {e}", flush=True)

    if not candidates:
        try:
            url = "https://api.pexels.com/videos/search?query=cinematic+ocean+waves+coast&per_page=20&orientation=landscape"
            req = urllib.request.Request(url, headers={
                "Authorization": pexels_key,
                "User-Agent": USER_AGENT
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("videos", [])
        except Exception:
            pass

    if not candidates:
        return None

    # Pick candidate according to index to ensure variety across scenes
    v = candidates[index % len(candidates)]
    mp4_files = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4"]
    hd_1080 = [f for f in mp4_files if f.get("width") == 1920 and f.get("height") == 1080]
    if hd_1080:
        return hd_1080[0]["link"]
    hd_any = [f for f in mp4_files if f.get("quality") == "hd"]
    if hd_any:
        return hd_any[0]["link"]
    if mp4_files:
        return mp4_files[0]["link"]
    return None

def download_video_clip(url, filepath):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            with open(filepath, "wb") as f:
                f.write(r.read())
        return os.path.exists(filepath) and os.path.getsize(filepath) > 50000
    except Exception as e:
        print(f"[ERROR DESCARGANDO VIDEO] {e}", flush=True)
        return False

def normalize_video_clip(ffmpeg_bin, raw_path, out_path, target_duration, width=1920, height=1080):
    vf = f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},fps=30"
    cmd = [
        ffmpeg_bin, "-y",
        "-stream_loop", "-1",
        "-i", raw_path,
        "-t", str(target_duration),
        "-vf", vf,
        "-an",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        out_path
    ]
    res = run_cmd_silent(cmd)
    return res.returncode == 0 and os.path.exists(out_path)

def download_image(prompt, filepath, width=1280, height=720):
    if os.path.exists(filepath) and os.path.getsize(filepath) > 10000:
        return True
    
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&seed={int(time.time()*1000)%1000000}"
    headers = {"User-Agent": USER_AGENT}
    
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

def render_scene_image(ffmpeg_bin, img_path, clip_path, duration, zoom_dir="in", width=1920, height=1080):
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
        "-an",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        clip_path
    ]
    
    res = run_cmd_silent(cmd)
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
    
    raw_scenes = config.get("scenes", [])
    subtitles_text = config.get("subtitlesText", "")
    disable_subtitles = config.get("disableSubtitles", True)
    mode = config.get("mode", "full_motion")
    output_filename = config.get("outputFilename", "final_videoclip.mp4")
    
    update_progress(job_dir, 3, "INITIALIZING", "Iniciando compilador cinematográfico ARKAIOS...")
    
    # 0. Medir duración exacta del audio maestro con ffprobe
    audio_duration = get_audio_duration(audio_path)
    target_video_duration = audio_duration if audio_duration > 0 else 180.0
    print(f"[ARKAIOS COMPILER] Pista: {audio_path} | Duración: {target_video_duration:.2f}s", flush=True)

    # 1. Expandir o ajustar escenas inteligentemente
    current_scenes_duration = sum(float(sc.get("duration", 10.0)) for sc in raw_scenes)
    
    # Si el usuario mandó pocas escenas (<= 3) o la duración total no cubre la canción (ej: 1 sola línea de prompt general)
    if len(raw_scenes) <= 3 or current_scenes_duration < (target_video_duration * 0.75):
        base_theme = "cinematic coastal landscape"
        if raw_scenes:
            base_theme = raw_scenes[0].get("query") or raw_scenes[0].get("prompt") or base_theme
        scenes = expand_theme_to_scenes(base_theme, target_video_duration, target_scene_duration=10.5)
        print(f"[ARKAIOS COMPILER] Tema expandido a {len(scenes)} tomas para cubrir {target_video_duration:.2f}s", flush=True)
    else:
        scenes = raw_scenes
        # Si las escenas no cubren la duración del audio, escalar proporcionalmente
        if current_scenes_duration < target_video_duration:
            scale_factor = target_video_duration / current_scenes_duration
            for sc in scenes:
                sc["duration"] = round(float(sc.get("duration", 10.0)) * scale_factor, 2)

    total_scenes = len(scenes)
    if total_scenes == 0:
        update_progress(job_dir, -1, "ERROR", "No se proporcionaron escenas para renderizar.")
        return {"success": False, "error": "No scenes"}

    # 2. Crear subtítulos ASS (si aplica)
    sub_file = os.path.join(job_dir, "subtitles.ass")
    if not disable_subtitles and subtitles_text.strip():
        ass_content = parse_lrc_to_ass(subtitles_text, width=width, height=height)
        with open(sub_file, "w", encoding="utf-8") as f:
            f.write(ass_content)
    
    # 3. Renderizar cada Escena
    clips = []
    for idx, sc in enumerate(scenes):
        sc_id = sc.get("id", f"scn_{idx+1}")
        duration = float(sc.get("duration", 10.0))
        query = sc.get("query") or sc.get("prompt") or sc.get("description", "cinematic atmosphere")
        use_motion = sc.get("motion", True) if mode == "full_motion" else sc.get("motion", False)
        
        clip_path = os.path.join(job_dir, f"{sc_id}.mp4")
        raw_clip_path = os.path.join(job_dir, f"{sc_id}_raw.mp4")
        
        percent = int(5 + (idx / total_scenes) * 70)
        update_progress(job_dir, percent, "GENERATING_SCENE", f"Toma #{idx+1}/{total_scenes} ({duration:.1f}s): {query[:45]}...")
        
        scene_rendered = False
        
        # Modo Full Motion (Video Real HD de Pexels)
        if use_motion:
            if not os.path.exists(raw_clip_path) or os.path.getsize(raw_clip_path) < 50000:
                v_url = search_pexels_video(query, index=idx)
                if not v_url:
                    v_url = search_pexels_video("cinematic ocean landscape", index=idx)
                if v_url:
                    download_video_clip(v_url, raw_clip_path)
            
            if os.path.exists(raw_clip_path) and os.path.getsize(raw_clip_path) > 50000:
                # Normalizar con -stream_loop -1 para que la toma dure exactamente 'duration'
                scene_rendered = normalize_video_clip(FFMPEG_PATH, raw_clip_path, clip_path, duration, width, height)
        
        # Fallback a Ken Burns con Imagen si no hubo video o el usuario solicitó modo imagen
        if not scene_rendered:
            img_path = os.path.join(job_dir, f"{sc_id}.jpg")
            local_img = sc.get("imageUrl")
            if local_img and os.path.exists(local_img):
                if os.path.abspath(local_img) != os.path.abspath(img_path):
                    shutil.copyfile(local_img, img_path)
            else:
                download_image(query, img_path, width=img_w, height=img_h)
            zoom_dir = sc.get("zoom_dir", "in" if idx % 2 == 0 else "out")
            scene_rendered = render_scene_image(FFMPEG_PATH, img_path, clip_path, duration, zoom_dir, width, height)
            
        if scene_rendered and os.path.exists(clip_path):
            clips.append(clip_path)
        else:
            print(f"[WARN] Error renderizando escena {sc_id}", flush=True)
            
    if not clips:
        update_progress(job_dir, -1, "ERROR", "Ninguna escena cinematográfica pudo ser renderizada.")
        return {"success": False, "error": "No clips rendered"}
        
    # 4. Concatenar tomas cinematográficas
    update_progress(job_dir, 78, "CONCATENATING", "Uniendo tomas cinematográficas en Full HD...")
    concat_list = os.path.join(job_dir, "concat.txt")
    
    # Asegurar que el video concatenado dure >= audio_duration para que el mux corte perfecto con -shortest
    total_rendered_duration = sum(float(sc.get("duration", 10.0)) for sc in scenes[:len(clips)])
    reps = 1
    if target_video_duration > 0 and total_rendered_duration > 0 and total_rendered_duration < target_video_duration:
        reps = int(math.ceil(target_video_duration / total_rendered_duration))
        print(f"[ARKAIOS COMPILER] Ajustando ciclo de tomas x{reps} para cubrir 100% de la pista de audio", flush=True)

    with open(concat_list, "w", encoding="utf-8") as f:
        for _ in range(reps):
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
    run_cmd_silent(cmd_concat, check=True)
    
    # 5. Mux de Audio Maestro y Render Final
    update_progress(job_dir, 90, "FINALIZING", "Sincronizando pista de audio maestro y renderizando videoclip final...")
    output_video = os.path.join(job_dir, output_filename)
    
    cmd_final = [FFMPEG_PATH, "-y", "-i", merged_raw]
    has_audio = bool(audio_path and os.path.exists(audio_path))
    if has_audio:
        cmd_final.extend(["-i", audio_path])
        
    has_subs = (not disable_subtitles) and os.path.exists(sub_file) and os.path.getsize(sub_file) > 50
    if has_subs:
        safe_ass = sub_file.replace("\\", "/").replace(":", "\\:")
        cmd_final.extend(["-vf", f"ass='{safe_ass}'"])
        
    if has_audio:
        # -shortest asegura que el video se corte en el último milisegundo de la canción
        cmd_final.extend(["-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "320k", "-shortest"])
        
    cmd_final.extend([
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        output_video
    ])
    
    res = run_cmd_silent(cmd_final)
    if res.returncode == 0:
        update_progress(job_dir, 100, "COMPLETED", f"Videoclip oficial generado exitosamente: {output_video}")
        return {
            "success": True,
            "outputVideo": output_video,
            "duration": target_video_duration,
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
