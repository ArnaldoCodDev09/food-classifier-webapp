FROM python:3.10-slim

WORKDIR /app

# copiar fichero de dependencias e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copiar aplicación
COPY app ./app
COPY web ./web
RUN if [ -f .env.example ]; then cp .env.example .env; fi

# puerto que Render asignará con la variable $PORT
ENV PORT 8080

# usar gunicorn con worker de uvicorn
CMD ["sh", "-c", "gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT"]
