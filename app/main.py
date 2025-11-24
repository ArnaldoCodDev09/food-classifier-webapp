# app/main.py
import os
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from .model_client import hf_predict

app = FastAPI(title="Food Classifier - Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Food Classifier Backend"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    try:
        preds = hf_predict(img_bytes)
        return JSONResponse(content={"predictions": preds})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/download-report")
async def download_report():
    path = os.path.join(os.path.dirname(__file__), "..", "docs", "PROYECTO_IA.docx")
    if os.path.exists(path):
        return FileResponse(path, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename='PROYECTO_IA.docx')
    return JSONResponse(status_code=404, content={"error": "report not found"})
