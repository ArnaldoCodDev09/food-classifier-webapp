# app/model_client.py
import os
import requests
from PIL import Image
import io
import json

# Modelo por defecto (puedes cambiarlo)
DEFAULT_HF_MODEL = os.getenv("HF_MODEL", "google/vit-base-patch16-224")

HF_TOKEN = os.getenv("HF_TOKEN")  # define esto en Render environment

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
        # DEBUG fallback: devuelve una prediccion simulada
        return {"label": "debug_food", "confidence": 0.99, "note": "HF_TOKEN not set - returning mock"}

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        # cuando se manda binario no ponemos content-type; requests lo manejará
    }

    url = f"https://api-inference.huggingface.co/models/{model}"

    try:
        resp = requests.post(url, headers=headers, data=img_bytes, timeout=60)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Request to HF Inference API failed: {e}")

    # Si HF respondió con error, levanta excepción con info legible
    if resp.status_code != 200:
        # intenta parsear JSON, si no -> retorna texto
        try:
            body = resp.json()
        except Exception:
            body = resp.text
        raise RuntimeError(f"HF API error {resp.status_code}: {body}")

    # normalmente la API responde JSON
    try:
        result = resp.json()
    except Exception as e:
        raise RuntimeError(f"Invalid JSON from HF API: {e} - body: {resp.text}")

    # Normalizamos respuesta para que main.py pueda extraer label/confidence
    # La forma exacta depende del modelo / pipeline; dejamos la respuesta tal cual
    return result
