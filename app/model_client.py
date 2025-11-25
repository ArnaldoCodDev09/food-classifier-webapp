# app/model_client.py
import requests
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "openai/clip-vit-base-patch32")
API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

headers = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/octet-stream",
    "Accept": "application/json"
}

def hf_predict(image_bytes, timeout=30):
    """Envía imagen al endpoint de HuggingFace y mejora logging/herror handling."""
    try:
        resp = requests.post(API_URL, headers=headers, data=image_bytes, timeout=timeout)
    except requests.RequestException as e:
        logger.exception("Error de conexión a Hugging Face")
        raise Exception(f"Error de conexión a HF: {e}")

    logger.info("HF response status: %s", resp.status_code)
    # loguea body corto para debug
    try:
        body_preview = resp.text[:1000]
    except Exception:
        body_preview = "<no text>"
    logger.info("HF response text (preview): %s", body_preview)

    if resp.status_code != 200:
        # si devuelve JSON con mensaje de error, intenta mostrarlo
        err_text = resp.text
        raise Exception(f"HF API error {resp.status_code}: {err_text}")

    try:
        data = resp.json()
    except ValueError:
        raise Exception("HF devolvió una respuesta no-JSON")

    # intentamos normalizar varias formas de respuesta
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        label = data[0].get("label") or data[0].get("name") or data[0].get("predicted_label")
        score = data[0].get("score") or data[0].get("confidence")
    elif isinstance(data, dict):
        label = data.get("label") or data.get("predicted_label") or data.get("name")
        score = data.get("score") or data.get("confidence")
    else:
        label = None
        score = None

    return {
        "label": label,
        "confidence": score,
        "raw": data
    }
