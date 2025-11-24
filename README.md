# Food Classifier - Web App (Proxy to Hugging Face Inference)

This repository contains a minimal FastAPI web app that proxies image uploads to a Hugging Face Inference API model.
It is intended for demonstration and rapid deployment without training.

## Quickstart

1. Create a Hugging Face account and get an API token.
2. Set environment variables (HF_API_TOKEN, HF_MODEL).
3. Deploy using Render / Railway / Docker.

## Files
- `app/` : FastAPI backend.
- `web/` : Simple static frontend (index.html + app.js).
- `requirements.txt` : Python dependencies.
- `Dockerfile` : Container image.
- `docs/PROYECTO_IA.docx` : Copy of the project report (bundle).

## Report bundled
A copy of the project report can be added to `docs/PROYECTO_IA.docx`.

## Deployment
- Render: Create a new web service from this repo.
- Set environment variable `HF_API_TOKEN` with your Hugging Face token.
- Optionally set `HF_MODEL` to a Food-101 compatible model id.
