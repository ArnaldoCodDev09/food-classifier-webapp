# app/main.py

import os
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .model_client import hf_predict

# Crear la app FastAPI
app = FastAPI(title="Food Classifier - Proxy")

# Montar carpeta 'web' para servir index.html y scripts
web_dir = os.path.join(os.path.dirname(__file__), "..", "web")
app.mount("/web", StaticFiles(directory=web_dir), name="web")

# CORS para permitir peticiones del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint raíz para comprobar que el backend corre
@app.get("/")
async def root():
    return {"status": "ok", "message": "Food Classifier Backend"}

# ============================================================
#  ENDPOINT PREDICT  (CORREGIDO + 100% COMPATIBLE)
# ============================================================
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    try:
        preds = hf_predict(img_bytes)  # Predicción del modelo

        # Normalizar salida del modelo para frontend
        label = None
        confidence = None

        if isinstance(preds, dict):
            label = preds.get("label") or preds.get("predicted_label") or preds.get("name")
            confidence = preds.get("confidence") or preds.get("score")

        elif isinstance(preds, (list, tuple)) and len(preds) > 0:
            first = preds[0]
            if isinstance(first, dict):
                label = first.get("label") or first.get("predicted_label") or first.get("name")
                confidence = first.get("confidence") or first.get("score")
            else:
                label = str(first)
        else:
            label = str(preds)

        return JSONResponse(content={
            "label": label,
            "confidence": confidence,
            "predictions": preds
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Descargar documento (opcional)
@app.get("/download-report")
async def download_report():
    path = os.path.join(os.path.dirname(__file__), "..", "docs", "PROYECTO_IA.docx")
    if os.path.exists(path):
        return FileResponse(
            path,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename='PROYECTO_IA.docx'
        )
    return JSONResponse(status_code=404, content={"error": "report not found"})
