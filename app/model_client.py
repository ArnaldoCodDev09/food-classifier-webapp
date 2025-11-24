# app/model_client.py
import os
import requests
from PIL import Image
import io

# Modelo por defecto (puedes cambiarlo vía env HF_MODEL)
DEFAULT_HF_MODEL = os.getenv("HF_MODEL", "google/vit-base-patch16-224")

# Aceptar ambos nombres de variable de entorno por compatibilidad
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HF_API_TOKEN") or os.getenv("HF_APIKEY")

def _validate_image(img_bytes):
    try:
        Image.open(io.BytesIO(img_bytes)).convert("RGB")
        return True
    except Exception as e:
        raise ValueError(f"Invalid image bytes: {e}")

def hf_predict(img_bytes):
    """
    Llama a Hugging Face Inference API y devuelve la respuesta (json).
    Requiere HF_TOKEN en las env vars. En caso de no tener token, devuelve un mock para debug.
    """
    # validar imagen
    _validate_image(img_bytes)

    model = DEFAULT_HF_MODEL

    # Si no hay HF_TOKEN, devolvemos un mock (útil para debug rápido)
    if not HF_TOKEN:
        return {"label": "debug_food", "confidence": 0.99, "note": "HF_TOKEN not set - returning mock"}

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Accept": "application/json",
    }

    url = f"https://api-inference.huggingface.co/models/{model}"

    try:
        resp = requests.post(url, headers=headers, data=img_bytes, timeout=60)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Request to HF Inference API failed: {e}")

    if resp.status_code != 200:
        # intenta parsear JSON, si no -> retorna texto para logging
        try:
            body = resp.json()
        except Exception:
            body = resp.text
        raise RuntimeError(f"HF API error {resp.status_code}: {body}")

    try:
        result = resp.json()
    except Exception as e:
        raise RuntimeError(f"Invalid JSON from HF API: {e} - body: {resp.text}")

    return result
