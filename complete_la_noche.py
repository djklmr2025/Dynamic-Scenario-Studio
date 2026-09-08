import os
import json
import urllib.request

OUTPUT_DIR = r"C:\DJKLMR\Videos\JAZZ BEAT\La_Noche_Videoclip"
AUDIO_PATH = r"C:\DJKLMR\Videos\JAZZ BEAT\La Noche.mp3"

# List of robust candidate photos
candidate_photos = {
    6: [
        "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1552422535-c45813c61732?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1920&h=1080&fit=crop&q=90"
    ],
    7: [
        "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1501999635878-71cb5379c2d8?w=1920&h=1080&fit=crop&q=90"
    ],
    8: [
        "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1920&h=1080&fit=crop&q=90"
    ],
    9: [
        "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&h=1080&fit=crop&q=90"
    ],
    10: [
        "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1920&h=1080&fit=crop&q=90"
    ],
    11: [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1525994886773-080587e161c2?w=1920&h=1080&fit=crop&q=90"
    ],
    12: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&h=1080&fit=crop&q=90",
        "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1920&h=1080&fit=crop&q=90"
    ]
}

DESCRIPTIONS = {
    1: ("scn_01", 0.0, 30.0, "Prólogo: Noche lluviosa en la metrópolis con reflejos de neón y asfalto húmedo."),
    2: ("scn_02", 30.0, 32.0, "Escena 2: Club de Jazz en la noche con ambiente tenue y luces de escenario."),
    3: ("scn_03", 62.0, 32.0, "Escena 3: Saxofón en contraluz dorado con vibración nocturna."),
    4: ("scn_04", 94.0, 31.0, "Escena 4: Vaso de licor y hielo sobre la barra con destellos ámbar."),
    5: ("scn_05", 125.0, 33.0, "Escena 5: Silueta de automóvil clásico recorriendo la avenida mojada a medianoche."),
    6: ("scn_06", 158.0, 32.0, "Escena 6: Manos sobre las teclas del piano de cola en plena armonía."),
    7: ("scn_07", 190.0, 32.0, "Escena 7: Ventanal empañado con gotas de lluvia y bokeh de la ciudad nocturna."),
    8: ("scn_08", 222.0, 32.0, "Escena 8: Figura solitaria bajo la farola en la calle silenciosa."),
    9: ("scn_09", 254.0, 32.0, "Escena 9: Panorámica aérea de rascacielos sumergidos en la niebla azul medianoche."),
    10: ("scn_10", 286.0, 32.0, "Escena 10: Contrabajista y ensamble acústico bajo reflector tenue."),
    11: ("scn_11", 318.0, 32.0, "Escena 11: Cafetería nocturna con luces cálidas en la esquina solitaria."),
    12: ("scn_12", 350.0, 31.2, "Escena 12: Primeros destellos del alba en azul profundo despidiendo la noche.")
}

SUBTITLES = """[00:00 - 00:30] Prólogo Nocturno
La lluvia cae despacio sobre el asfalto frío,
la ciudad se apaga, pero el silencio empieza a hablar...
[00:30 - 01:02] Tema 1: Sombras de Neón
Entre reflejos dorados y el humo de un rincón,
un saxofón despierta la memoria de los dos.
[01:02 - 01:34] Tema 2: El Club Desvelo
Copas de ámbar que guardan secretos,
un piano que late al ritmo del viento.
[01:34 - 02:05] Tema 3: Carretera Solitaria
Las dos de la mañana en una avenida vacía,
siguiendo las luces rojas de lo que se nos fue.
[02:05 - 02:38] Tema 4: Susurros del Metal
Cada nota es una gota que cae en el cristal,
la noche nos envuelve en su vals inmortal.
[02:38 - 03:10] Tema 5: Melancolía Urbana
Las luces borrosas pintan el horizonte,
mientras la niebla abraza cada rascacielos.
[03:10 - 03:42] Tema 6: El Compás del Tiempo
Bajo el farol un destello en la oscuridad,
buscando una mirada que ya no volverá.
[03:42 - 04:14] Tema 7: Horizonte Azul
El latido del contrabajo en la penumbra,
un suspiro que la noche acostumbra.
[04:14 - 04:46] Tema 8: Rapsodia de Medianoche
Voces que se desvanecen en la bruma,
como acordes perdidos en la memoria.
[04:46 - 05:18] Tema 9: El Último Refugio
Un rincón cálido frente a la tormenta,
donde el jazz es la única respuesta.
[05:18 - 05:50] Tema 10: Alborada Lejana
El azul profundo anuncia la despedida,
la noche se retira pero el eco nos abriga...
[05:50 - 06:21] Epílogo: El Alba
La noche... siempre vuelve."""

# Download missing 6..12
for idx in range(6, 13):
    filename = f"escena_{idx:02d}.jpg"
    filepath = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(filepath) and os.path.getsize(filepath) > 50000:
        print(f"[CACHE] {filename} ya existe ({os.path.getsize(filepath)} bytes).", flush=True)
        continue
    
    success = False
    for url in candidate_photos[idx]:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ARKAIOS-Studio"})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = r.read()
                if len(data) > 30000:
                    with open(filepath, "wb") as f:
                        f.write(data)
                    print(f"[OK] {filename} descargada con éxito ({len(data)} bytes).", flush=True)
                    success = True
                    break
        except Exception as e:
            print(f"[INTENTO FALLIDO] {filename} de {url[:45]}: {e}", flush=True)
            continue
    if not success:
        print(f"[ALERTA] No se pudo descargar {filename}", flush=True)

# Build config
scenes_list = []
for idx in range(1, 13):
    filename = f"escena_{idx:02d}.jpg"
    filepath = os.path.join(OUTPUT_DIR, filename)
    scn_id, t_start, dur, desc = DESCRIPTIONS[idx]
    scenes_list.append({
        "id": scn_id,
        "timestamp": t_start,
        "duration": dur,
        "imageUrl": filepath,
        "description": desc
    })

config_data = {
    "audioPath": AUDIO_PATH,
    "aspectRatio": "16:9",
    "outputFilename": "La_Noche_Videoclip_Oficial.mp4",
    "scenes": scenes_list,
    "subtitlesText": SUBTITLES
}

config_path = os.path.join(OUTPUT_DIR, "config_la_noche.json")
with open(config_path, "w", encoding="utf-8") as f:
    json.dump(config_data, f, indent=2, ensure_ascii=False)

print(f"[FINALIZADO] config_la_noche.json guardado exitosamente en: {config_path}", flush=True)
