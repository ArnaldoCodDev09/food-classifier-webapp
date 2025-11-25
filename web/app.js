document.getElementById("send").onclick = async function () {
  const fileInput = document.getElementById("file");
  const resultDiv = document.getElementById("result");
  const statusEl = document.getElementById("status");

  if (!fileInput.files.length) {
    resultDiv.innerHTML = `<div style="color:#b00">Por favor sube una imagen.</div>`;
    return;
  }

  const formData = new FormData();
  const file = fileInput.files[0];
  formData.append("file", file);

  // Mostrar preview inmediato
  const previewURL = URL.createObjectURL(file);
  resultDiv.innerHTML = `
    <div class="preview"><img src="${previewURL}" alt="preview"></div>
    <div class="info">
      <div style="font-weight:700;color:#333">Procesando imagen...</div>
      <div style="color:#666;font-size:13px;margin-top:10px">Esto puede tardar unos segundos la primera vez.</div>
    </div>
  `;
  statusEl.innerText = "Enviando...";

  try {
    const response = await fetch("/predict", {
      method: "POST",
      body: formData
    });

    statusEl.innerText = "";

    console.log("HTTP status:", response.status);
    const text = await response.text();
    console.log("Body raw:", text);

    if (!response.ok) {
      resultDiv.innerHTML = `<div style="color:#b00">Error al procesar la imagen. Estado ${response.status}</div>`;
      return;
    }

    const data = JSON.parse(text);

    // Normalizar y formatear confianza
    const label = data.label ?? (data.predictions ? JSON.stringify(data.predictions) : "Desconocido");
    let confidence = data.confidence;
    if (confidence === null || confidence === undefined) {
      confidence = "-";
    } else {
      if (typeof confidence === "number" && confidence <= 1) {
        confidence = `${(confidence * 100).toFixed(2)}%`;
      } else if (typeof confidence === "number") {
        confidence = confidence.toFixed(4);
      } else {
        confidence = String(confidence);
      }
    }

    // Intentar sacar top-3 desde data.raw si existe (formato HF: lista de {label,score})
    let topHtml = "";
    if (Array.isArray(data.raw) && data.raw.length) {
      topHtml = "<div style='margin-top:8px'><strong>Top 3:</strong><ul class='toplist'>";
      const top = data.raw.slice(0, 3);
      for (const p of top) {
        const lab = p.label ?? p.name ?? JSON.stringify(p);
        const sc = (typeof p.score === "number" && p.score <= 1) ? `${(p.score*100).toFixed(2)}%` : (p.score ?? "-");
        topHtml += `<li>${lab} — ${sc}</li>`;
      }
      topHtml += "</ul></div>";
    }

    resultDiv.innerHTML = `
      <div class="preview"><img src="${previewURL}" alt="preview"></div>
      <div class="info">
        <div class="label">Predicción: ${label}</div>
        <div class="confidence">Confianza: ${confidence}</div>
        ${topHtml}
      </div>
    `;
  } catch (err) {
    console.error(err);
    statusEl.innerText = "";
    resultDiv.innerHTML = `<div style="color:#b00">Error conectando al servidor.</div>`;
  }
};
