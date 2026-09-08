#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ARKAIOS Dynamic Scenario Studio - CLI Compiler Entrypoint
Permite a los agentes y desarrolladores compilar videoclips cinematográficos
utilizando el motor de videoclipCompiler de ARKAIOS directamente desde la consola.

Uso:
  python cli_compile.py --config config.json
  python cli_compile.py --demo-citricos
"""

import os
import sys
import json
import argparse
from services.videoclipCompiler import compile_videoclip

DEMO_CONFIG = {
    "audioPath": r"D:\DJKLMR\Videos\JAZZ BEAT\Cítricos_y_sal.mp3",
    "aspectRatio": "16:9",
    "outputFilename": "Citricos_y_Sal_Videoclip_Oficial.mp4",
    "scenes": [
        {
            "id": "scn_01",
            "timestamp": 0.0,
            "duration": 6.5,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_01.jpg",
            "description": "Intro: Vista general del mercado costero al atardecer."
        },
        {
            "id": "scn_02",
            "timestamp": 6.5,
            "duration": 16.5,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_02.jpg",
            "description": "Verso 1: Puesto de frutas con naranjas y limones bañados por la luz dorada."
        },
        {
            "id": "scn_03",
            "timestamp": 23.0,
            "duration": 16.0,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_03.jpg",
            "description": "Verso 2: Callejón empedrado con faroles y vista lejana al mar azul."
        },
        {
            "id": "scn_04",
            "timestamp": 39.0,
            "duration": 16.5,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_04.jpg",
            "description": "Coro: Olas rompiendo suavemente contra el muelle al atardecer."
        },
        {
            "id": "scn_05",
            "timestamp": 55.5,
            "duration": 13.5,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_05.jpg",
            "description": "Interludio Instrumental: Siluetas de gaviotas volando sobre el océano."
        },
        {
            "id": "scn_06",
            "timestamp": 69.0,
            "duration": 15.0,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_06.jpg",
            "description": "Verso 3: Personas caminando y sombras alargadas en el paseo marítimo."
        },
        {
            "id": "scn_07",
            "timestamp": 84.0,
            "duration": 15.5,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_07.jpg",
            "description": "Verso 4: Canasta de frutas con gotas de rocío y fondo desenfocado."
        },
        {
            "id": "scn_08",
            "timestamp": 99.5,
            "duration": 16.5,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_08.jpg",
            "description": "Coro 2: Vista dramática del sol ocultándose en el horizonte marino."
        },
        {
            "id": "scn_09",
            "timestamp": 116.0,
            "duration": 24.0,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_09.jpg",
            "description": "Puente: Luz de luna reflejada en el agua con tonos azules profundos."
        },
        {
            "id": "scn_10",
            "timestamp": 140.0,
            "duration": 24.0,
            "imageUrl": r"D:\DJKLMR\Videos\JAZZ BEAT\Citricos_y_Sal_Videoclip\escena_10.jpg",
            "description": "Coro Final & Outro: Faro costero encendido en la noche estrellada."
        }
    ],
    "subtitlesText": """[00:00 - 00:06] Intro
Yeah, escucho el eco de la tarde,
un aroma que me lleva de vuelta...
[00:07 - 00:22] Verso 1
La fruta fresca brilla en el puesto,
cítricos amargos flotan en el viento.
Humedad marina que abraza la piel,
y tu recuerdo regresa otra vez.
[00:23 - 00:38] Verso 2
Cierro los ojos buscando tu luz,
en este mercado que huele a sur.
Cada color me recuerda a tu hogar,
un nido lejano difícil de hallar.
[00:39 - 00:55] Coro
Sabor a mar me duele,
huele a limón tu boca,
atardece y me desvelo,
sabor a mar me duele...
[00:55 - 01:08] Interludio instrumental
[01:09 - 01:23] Verso 3
La tarde cae despacio y fría,
mientras la gente pasa sonriendo,
y yo atrapado en esta agonía,
de un paraíso que estoy perdiendo.
[01:24 - 01:39] Verso 4
Frutas maduras que huelen a olvido,
en este suelo que no es el mío,
un eco dulce de lo que ha sido,
me deja el alma llena de frío.
[01:40 - 01:55] Coro
Sabor a mar me duele,
huele a limón tu boca,
atardece y me desvelo,
sabor a mar me duele...
[01:56 - 02:20] Puente
La sal se me mete en las heridas,
los cítricos queman lo que juré,
y entre tantas luces encendidas,
ya no sé si alguna vez te encontré.
[02:21 - 02:44] Coro Final & Outro
Sabor a mar me duele,
huele a limón tu boca,
atardece y me desvelo,
sabor a mar me duele...
Cítricos y sal en el aire...
Sólo me queda el frío de la tarde..."""
}

def main():
    parser = argparse.ArgumentParser(description="ARKAIOS Studio - Compilador de Videoclips")
    parser.add_argument("--config", help="Ruta al archivo JSON de configuracion del videoclip")
    parser.add_argument("--out-dir", help="Directorio destino personalizado para el render")
    parser.add_argument("--demo-citricos", action="store_true", help="Compilar videoclip demo 'Citricos y Sal'")
    args = parser.parse_args()

    if args.demo_citricos:
        print("[ARKAIOS] Ejecutando compilacion DEMO: Citricos y Sal...")
        config = DEMO_CONFIG
    elif args.config:
        if not os.path.exists(args.config):
            print(f"[ERROR] Archivo de configuracion no encontrado: {args.config}")
            sys.exit(1)
        with open(args.config, "r", encoding="utf-8") as f:
            config = json.load(f)
    else:
        print("Uso: python cli_compile.py --demo-citricos O --config ruta_a_config.json [--out-dir ruta_salida]")
        sys.exit(0)

    job_id = "cli_job_" + str(os.getpid())
    if args.out_dir:
        output_dir = args.out_dir
    else:
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders", job_id)
    os.makedirs(output_dir, exist_ok=True)
    
    config_file = os.path.join(output_dir, "config.json")
    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"[ARKAIOS] Iniciando render en: {output_dir}")
    res = compile_videoclip(config_file, output_dir)
    print("\n" + "="*50)
    print("[RESULTADO COMPILACION]")
    print(json.dumps(res, indent=2))
    print("="*50)

if __name__ == "__main__":
    main()
