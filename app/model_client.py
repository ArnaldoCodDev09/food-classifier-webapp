import requests
import os

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "openai/clip-vit-base-patch32")

API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

headers = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/octet-stream"
}

def hf_predict(image_bytes):
    """Envía imagen al nuevo endpoint de HuggingFace."""
    
    response = requests.post(
        API_URL,
        headers=headers,
        data=image_bytes
    )

    if response.status_code != 200:
        raise Exception(f"HF API error {response.status_code}: {response.text}")

    data = response.json()

    # Normalización mínima
    try:
        label = data[0]["label"]
        score = data[0]["score"]
    except:
        label = "unknown"
        score = None

    return {
        "label": label,
        "confidence": score,
        "raw": data
    }
