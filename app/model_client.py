# app/model_client.py
import os
import requests
import io
from PIL import Image
import time

# modelo por defecto (cámbialo en Render si quieres otro)
DEFAULT_HF_MODEL = os.getenv("HF_MODEL", "google/vit-base-patch16-224")

# token (acepta varios nombres por compatibilidad)
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HF_API_TOKEN") or os.getenv("HF_APIKEY")

# Construir URL del router (requiere el nombre del modelo)
def _router_url(model_name: str) -> str:
    # Usamos el router recomendado por HF y la forma /models/<model>
    return f"https://router.huggingface.co/models/{model_name}"

def _validate_image_bytes(img_bytes: bytes):
    try:
        Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid image bytes: {e}")

def _normalize_hf_response(resp_json):
    """
    Intenta extraer label y confidence de varias formas de respuesta.
    Devuelve dict con keys: label, confidence, raw
    """
    label = None
    confidence = None

    # Casos comunes: lista de dicts, dict con keys conocidas, o dict con nested
    if isinstance(resp_json, list) and len(resp_json) > 0:
        first = resp_json[0]
        if isinstance(first, dict):
            label = first.get("label") or first.get("score") or first.get("name")
            confidence = first.get("score") or first.get("confidence")
        else:
            label = str(first)
    elif isinstance(resp_json, dict):
        # varias posibilidades: {"label":..., "score":...} o {"predictions": [...]}
        label = resp_json.get("label") or resp_json.get("predicted_label") or resp_json.get("name")
        confidence = resp_json.get("confidence") or resp_json.get("score")
        if not label and "predictions" in resp_json and isinstance(resp_json["predictions"], (list,tuple)) and resp_json["predictions"]:
            p = resp_json["predictions"][0]
            if isinstance(p, dict):
                label = p.get("label") or p.get("name")
                confidence = p.get("score") or p.get("confidence")
    else:
        label = str(resp_json)

    return {"label": label, "confidence": confidence, "raw": resp_json}

def hf_predict(image_bytes: bytes, model_name: str = None, timeout: int = 60):
    """
    Envia la imagen al Router de Hugging Face y devuelve un dict normalizado.
    - model_name: si es None usa DEFAULT_HF_MODEL
    - Si no hay token, devuelve un mock útil para debug.
    """
    _validate_image_bytes(image_bytes)

    model = model_name or DEFAULT_HF_MODEL
    if not model:
        raise RuntimeError("HF model not configured. Set HF_MODEL env var or pass model_name.")

    # Debug fallback si no hay token (útil para desarrollo)
    if not HF_TOKEN:
        return {"label": "debug_food", "confidence": 0.99, "raw": {"note": "HF_TOKEN not set - returning mock"}}

    url = _router_url(model)
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/octet-stream",
    }

    # reintentos simples (por si HF responde 503 temporal)
    tries = 3
    for attempt in range(1, tries + 1):
        try:
            resp = requests.post(url, headers=headers, data=image_bytes, timeout=timeout)
        except requests.exceptions.RequestException as e:
            if attempt == tries:
                raise RuntimeError(f"Request to HF Router failed after {tries} attempts: {e}")
            time.sleep(1 * attempt)
            continue

        # Si no OK -> mostrar body de forma legible
        if resp.status_code != 200:
            # intenta parsear JSON, si no -> mostrar texto
            try:
                body = resp.json()
            except Exception:
                body = resp.text
            raise RuntimeError(f"HF Router error {resp.status_code}: {body}")

        # parsear JSON y normalizar
        try:
            data = resp.json()
        except Exception as e:
            raise RuntimeError(f"Invalid JSON from HF Router: {e} - body: {resp.text}")

        return _normalize_hf_response(data)

    # no debería llegar aquí
    raise RuntimeError("Unexpected error in hf_predict")
