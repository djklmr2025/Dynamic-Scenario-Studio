import os
import sys
import json
import urllib.request
import urllib.parse
import subprocess
import shutil

OUTPUT_DIR = r"C:\DJKLMR\Videos\JAZZ BEAT\La_Noche_Motion_Demo"
FINAL_DIR = r"C:\DJKLMR\Videos\JAZZ BEAT\La_Noche_Videoclip"
AUDIO_PATH = r"C:\DJKLMR\Videos\JAZZ BEAT\La Noche.mp3"
FFMPEG = r"C:\ARKAIOS\ShortGPT\ffmpeg-2026-08-17-git-426841da9d-full_build\bin\ffmpeg.exe"
PEXELS_KEY = "4vj6qTzLM9oc0gN7bdgr3vCO7jRDIBe0zJgknfq9geibx9hdQ16TVxpz"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(FINAL_DIR, exist_ok=True)

# Master audio duration: 381.205s
# Clips 1-6 already done (75.0s)
# Remaining duration: 306.205s divided across clips 7-32

NEW_SCENES = [
    {"id": "clip_07", "query": "double bass jazz player", "duration": 11.5, "desc": "Toma 7: Contrabajista en vivo pulsando cuerdas en la penumbra"},
    {"id": "clip_08", "query": "retro vinyl record player", "duration": 11.5, "desc": "Toma 8: Tocadiscos de vinilo girando con aguja y surcos"},
    {"id": "clip_09", "query": "smoke stage light jazz club", "duration": 11.5, "desc": "Toma 9: Humo suave flotando bajo focos cálidos de escenario"},
    {"id": "clip_10", "query": "rain drops on window night city", "duration": 11.5, "desc": "Toma 10: Gotas de lluvia en el ventanal con luces desenfocadas"},
    {"id": "clip_11", "query": "drummer jazz brushes snare", "duration": 11.5, "desc": "Toma 11: Baterista marcando el compás con escobillas"},
    {"id": "clip_12", "query": "whiskey glass ice bar night", "duration": 11.5, "desc": "Toma 12: Copa de licor y hielo con reflejos dorados"},
    {"id": "clip_13", "query": "vintage neon sign night rain", "duration": 11.5, "desc": "Toma 13: Letrero de neón parpadeante bajo la llovizna"},
    {"id": "clip_14", "query": "jazz singer microphone silhouette", "duration": 11.5, "desc": "Toma 14: Silueta melancólica junto al micrófono vintage"},
    {"id": "clip_15", "query": "night city bridge traffic water", "duration": 11.5, "desc": "Toma 15: Puente nocturno y estelas de tráfico sobre el agua"},
    {"id": "clip_16", "query": "saxophone fingers playing close up", "duration": 11.5, "desc": "Toma 16: Primer plano de llaves y dedos sobre el saxofón"},
    {"id": "clip_17", "query": "empty diner late night counter", "duration": 11.5, "desc": "Toma 17: Barra solitaria de cafetería nocturna a las 3 AM"},
    {"id": "clip_18", "query": "acoustic guitar fingers strings jazz", "duration": 11.5, "desc": "Toma 18: Manos pulsando notas de guitarra en el club"},
    {"id": "clip_19", "query": "puddle reflection night street lights", "duration": 11.5, "desc": "Toma 19: Charcos de agua reflejando los letreros de la ciudad"},
    {"id": "clip_20", "query": "vintage car driving night rain", "duration": 11.5, "desc": "Toma 20: Automóvil clásico deslizándose por la avenida mojada"},
    {"id": "clip_21", "query": "jazz club crowd silhouette drinks", "duration": 11.5, "desc": "Toma 21: Ambiente íntimo de clientes y copas entre las sombras"},
    {"id": "clip_22", "query": "trumpet player warm light stage", "duration": 11.5, "desc": "Toma 22: Trompeta con reflector ámbar en solo acústico"},
    {"id": "clip_23", "query": "wet city street sidewalk umbrella rain", "duration": 11.5, "desc": "Toma 23: Transeúnte solitario bajo la lluvia y los faroles"},
    {"id": "clip_24", "query": "piano keys hands playing jazz slow", "duration": 11.5, "desc": "Toma 24: Movimiento armónico sobre el teclado del piano"},
    {"id": "clip_25", "query": "night fog river city skyline", "duration": 11.5, "desc": "Toma 25: Rascacielos envueltos en bruma nocturna"},
    {"id": "clip_26", "query": "cocktail bar bartender drink night", "duration": 11.5, "desc": "Toma 26: Barman sirviendo copas en la penumbra"},
    {"id": "clip_27", "query": "jazz band stage performance live", "duration": 11.5, "desc": "Toma 27: Ensamble instrumental en pleno éxtasis nocturno"},
    {"id": "clip_28", "query": "street lamp mist night fog", "duration": 11.5, "desc": "Toma 28: Halo de luz dorada en la farola solitaria"},
    {"id": "clip_29", "query": "brass saxophone bell instrument light", "duration": 11.5, "desc": "Toma 29: Brillo del metal dorado con reflejos nocturnos"},
    {"id": "clip_30", "query": "empty city avenue night lights 3am", "duration": 11.5, "desc": "Toma 30: Calle silenciosa y húmeda en la hora más oscura"},
    {"id": "clip_31", "query": "dawn city skyline blue hour morning", "duration": 11.5, "desc": "Toma 31: El horizonte tiñéndose de azul profundo ante el alba"},
    {"id": "clip_32", "query": "morning twilight calm peaceful dawn", "duration": 18.705, "desc": "Toma 32: Primeros destellos del alba despidiendo la noche (Epílogo)"}
]

def search_pexels_video(query):
    encoded = urllib.parse.quote(query)
    url = f"https://api.pexels.com/videos/search?query={encoded}&per_page=6&orientation=landscape"
    req = urllib.request.Request(url, headers={
        "Authorization": PEXELS_KEY,
        "User-Agent": "Mozilla/5.0 ARKAIOS-Studio"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            videos = data.get("videos", [])
            for v in videos:
                mp4_files = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4"]
                hd_1080 = [f for f in mp4_files if f.get("width") == 1920 and f.get("height") == 1080]
                if hd_1080:
                    return hd_1080[0]["link"]
                hd_any = [f for f in mp4_files if f.get("quality") == "hd"]
                if hd_any:
                    return hd_any[0]["link"]
                if mp4_files:
                    return mp4_files[0]["link"]
    except Exception as e:
        print(f"[ERROR BUSCANDO] {query}: {e}", flush=True)
    return None

def main():
    print("==========================================================", flush=True)
    print("   ARKAIOS STUDIO - COMPILACIÓN COMPLETA FULL MOTION      ", flush=True)
    print("   La Noche (381.2s) - Video Real Cinemático 1080p        ", flush=True)
    print("==========================================================", flush=True)
    
    # Verify existing clips 1-6
    all_normalized = []
    for i in range(1, 7):
        norm_path = os.path.join(OUTPUT_DIR, f"clip_{i:02d}_norm.mp4")
        if os.path.exists(norm_path) and os.path.getsize(norm_path) > 100000:
            print(f"[REUTILIZANDO CLIP {i:02d}] {norm_path} ({os.path.getsize(norm_path)} bytes)", flush=True)
            all_normalized.append(norm_path)
        else:
            print(f"[ERROR] Clip previo no encontrado: {norm_path}", flush=True)
            sys.exit(1)
            
    # Process new scenes 7-32
    print(f"\nProcesando {len(NEW_SCENES)} nuevas tomas cinematográficas (7 a 32)...", flush=True)
    
    for idx, scn in enumerate(NEW_SCENES, start=7):
        clip_id = scn["id"]
        raw_video_path = os.path.join(OUTPUT_DIR, f"{clip_id}_raw.mp4")
        norm_video_path = os.path.join(OUTPUT_DIR, f"{clip_id}_norm.mp4")
        dur = scn["duration"]
        
        print(f"\n[{idx}/32] {scn['desc']}", flush=True)
        
        # Download if needed
        if not os.path.exists(raw_video_path) or os.path.getsize(raw_video_path) < 50000:
            print(f"-> Buscando clip HD para '{scn['query']}'...", flush=True)
            video_url = search_pexels_video(scn["query"])
            if not video_url:
                print(f"[FALLBACK] Usando consulta alternativa...", flush=True)
                video_url = search_pexels_video("jazz club night")
                
            print(f"-> Descargando video...", flush=True)
            req = urllib.request.Request(video_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                with open(raw_video_path, "wb") as f:
                    f.write(r.read())
            print(f"-> Descargado ({os.path.getsize(raw_video_path)} bytes)", flush=True)
        else:
            print(f"-> Ya en cache local ({os.path.getsize(raw_video_path)} bytes)", flush=True)
            
        # Normalize to 1080p @ 30fps
        if not os.path.exists(norm_video_path) or os.path.getsize(norm_video_path) < 50000:
            print(f"-> Normalizando a 1080p @ 30fps ({dur}s)...", flush=True)
            vf = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,format=yuv420p"
            cmd_norm = [
                FFMPEG, "-y",
                "-i", raw_video_path,
                "-t", str(dur),
                "-vf", vf,
                "-an",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "18",
                norm_video_path
            ]
            res = subprocess.run(cmd_norm, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode != 0:
                print(f"[ERROR NORMALIZANDO]: {res.stderr.decode('utf-8', errors='ignore')[-200:]}", flush=True)
                sys.exit(1)
            print(f"-> Normalizado ({os.path.getsize(norm_video_path)} bytes)", flush=True)
        else:
            print(f"-> Normalizado ya existente ({os.path.getsize(norm_video_path)} bytes)", flush=True)
            
        all_normalized.append(norm_video_path)
        
    print(f"\n[OK] Todas las {len(all_normalized)} tomas normalizadas listas.", flush=True)
    
    # Concatenate all 32 clips
    print("\n[UNIÓN] Concatenando 32 tomas de video cinematográfico...", flush=True)
    concat_list = os.path.join(OUTPUT_DIR, "full_concat_list.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for c in all_normalized:
            f.write(f"file '{c.replace('\\', '/')}'\n")
            
    merged_full_video = os.path.join(OUTPUT_DIR, "merged_full_video.mp4")
    cmd_concat = [
        FFMPEG, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        merged_full_video
    ]
    subprocess.run(cmd_concat, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    print(f"-> Video unido ({os.path.getsize(merged_full_video)} bytes)", flush=True)
    
    # Final Mux with master audio (Full 381.2s song, 320k AAC, ZERO subtitles)
    final_output = os.path.join(FINAL_DIR, "La_Noche_Videoclip_Oficial_Full_Motion.mp4")
    print(f"\n[FINAL MUX] Sincronizando audio máster completo (381.2s @ 320 kbps)...", flush=True)
    
    cmd_mux = [
        FFMPEG, "-y",
        "-i", merged_full_video,
        "-i", AUDIO_PATH,
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "320k",
        "-shortest",
        final_output
    ]
    subprocess.run(cmd_mux, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    
    print("\n" + "="*60, flush=True)
    print("¡VIDEOCLIP OFICIAL COMPLETO FULL MOTION FINALIZADO CON ÉXITO!", flush=True)
    print(f"Archivo final: {final_output}", flush=True)
    print(f"Tamaño: {os.path.getsize(final_output)} bytes", flush=True)
    print("Duración total: 381.2 segundos (~6 minutos 21 segundos)", flush=True)
    print("Resolución: 1920x1080 Full HD @ 30fps", flush=True)
    print("Subtítulos/Títulos: NINGUNO (Pantalla limpia)", flush=True)
    print("="*60, flush=True)

if __name__ == "__main__":
    main()
