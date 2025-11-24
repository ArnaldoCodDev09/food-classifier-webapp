# app/model_client.py
import os
import requests

HF_API_TOKEN = os.environ.get("HF_API_TOKEN")  # set in deployment
HF_MODEL = os.environ.get("HF_MODEL", "openai/clip-vit-base-patch32")  # default placeholder; replace with Food-101 compatible model id
HF_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}

def hf_predict(image_bytes):
    if not HF_API_TOKEN:
        raise RuntimeError("HF_API_TOKEN environment variable is not set.")
    response = requests.post(HF_URL, headers=HEADERS, data=image_bytes, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"HF API error {response.status_code}: {response.text}")
    return response.json()
