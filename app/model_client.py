import requests
from PIL import Image
import io
import os

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

API_URL = "https://router.huggingface.co/pipeline/feature-extraction"

headers = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/octet-stream",
}

def hf_predict(image_bytes):
    """Envía imagen al router de HuggingFace y obtiene features o embeddings."""

    response = requests.post(
        API_URL,
        headers=headers,
        data=image_bytes
    )

    if response.status_code != 200:
        raise Exception(f"HF Router error {response.status_code}: {response.text}")

    data = response.json()

    # retornar algo entendible
    return {
        "label": "features",
        "confidence": None,
        "raw": data
    }
