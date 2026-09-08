import urllib.request
import json
import ssl
import sys
import os

# Lee token seguro de API KEY ROOT.txt si existe
def get_render_token():
    token_env = os.environ.get("RENDER_TOKEN")
    if token_env:
        return token_env
    key_file = r"C:\Ruta\API KEY ROOT.txt"
    if os.path.exists(key_file):
        with open(key_file, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "RENDER:" in line or "TRAE TOKEN RENDER:" in line:
                    parts = line.split(":")
                    if len(parts) > 1:
                        tok = parts[1].strip()
                        if tok.startswith("rnd_"):
                            return tok
    return None

RENDER_TOKEN = get_render_token()
OWNER_ID = "tea-d2jvqu2li9vc73dnp8m0"

if not RENDER_TOKEN:
    print("[ERROR] Token de Render no encontrado.")
    sys.exit(1)

payload = {
    "type": "web_service",
    "name": "dynamic-scenario-studio",
    "ownerId": OWNER_ID,
    "repo": "https://github.com/djklmr2025/Dynamic-Scenario-Studio",
    "branch": "main",
    "autoDeploy": "yes",
    "serviceDetails": {
        "env": "docker",
        "envSpecificDetails": {
            "dockerfilePath": "./Dockerfile",
            "dockerContext": "."
        },
        "plan": "free",
        "region": "oregon",
        "envVars": [
            {"key": "NODE_ENV", "value": "production"},
            {"key": "PORT", "value": "3000"},
            {"key": "PYTHON_PATH", "value": "python3"}
        ]
    }
}

req = urllib.request.Request(
    "https://api.render.com/v1/services",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {RENDER_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    method="POST"
)

try:
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx) as response:
        res = json.loads(response.read().decode("utf-8"))
        srv = res.get("service", {})
        print("[EXITO] Servicio registrado en Render:")
        print(f"ID: {srv.get('id')}")
        print(f"Name: {srv.get('name')}")
        print(f"URL: {srv.get('serviceDetails', {}).get('url')}")
        print(f"Dashboard: {srv.get('dashboardUrl')}")
except urllib.error.HTTPError as e:
    err_body = e.read().decode("utf-8")
    print(f"[ERROR {e.code}]: {err_body}")
except Exception as e:
    print(f"[ERROR]: {e}")
