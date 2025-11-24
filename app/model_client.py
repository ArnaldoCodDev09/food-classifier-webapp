# app/model_client.py
import os
import requests
from PIL import Image
import io

# Modelo por defecto (puedes cambiarlo vía env HF_MODEL)
DEFAULT_HF_MODEL = os.getenv("HF_MODEL", "google/vit-base-patch16-224")

# Aceptar varios nombres de token por compatibilidad
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HF_API_TOKEN") or os.getenv("HF_APIKEY")

def _validate_image(img_bytes):
    try:
        Image.open(io.BytesIO(img_bytes)).convert("RGB")
        return True
    except Exception as e:
        raise ValueError(f"Invalid image bytes: {e}")

def hf_predict(img_bytes):
    """
    Llama al router de Hugging Face y devuelve la respuesta JSON.
    Si no hay token, devuelve un mock para debug.
    """
    # validar imagen
    _validate_image(img_bytes)

    model = DEFAULT_HF_MODEL

    # DEBUG fallback si no hay token (útil para verificar que todo lo demás funciona)
    if not HF_TOKEN:
        return {"label": "debug_food", "confidence": 0.99, "note": "HF_TOKEN not set - returning mock"}

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/octet-stream",
        "Accept": "application/json",
    }

    # usar el router (nuevo endpoint recomendado por HF)
    url = f"https://router.huggingface.co/models/{model}"

    try:
        resp = requests.post(url, headers=headers, data=img_bytes, timeout=60)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Request to HF Router failed: {e}")

    # Si HF respondió con error, devolver un error claro
    if resp.status_code != 200:
        # intenta parsear JSON, si no -> retorna texto crudo
        try:
            body = resp.json()
        except Exception:
            body = resp.text
        raise RuntimeError(f"HF Router error {resp.status_code}: {body}")

    # parsear JSON
    try:
        result = resp.json()
    except Exception as e:
        raise RuntimeError(f"Invalid JSON from HF Router: {e} - body: {resp.text}")

    return result
