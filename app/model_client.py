import requests
import os

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# Nuevo endpoint correcto para el modelo CLIP
HF_MODEL = os.getenv("HF_MODEL", "openai/clip-vit-base-patch32")

API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

headers = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/octet-stream",
}

def hf_predict(image_bytes):
    """Envía imagen al modelo CLIP y devuelve predicción."""

    response = requests.post(
        API_URL,
        headers=headers,
        data=image_bytes
    )

    if response.status_code != 200:
        raise Exception(f"HF error {response.status_code}: {response.text}")

    return response.json()
