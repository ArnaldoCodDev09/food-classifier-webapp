// web/app.js (PRO)
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendBtn");
const previewImg = document.getElementById("previewImg");
const previewArea = document.getElementById("previewArea");
const statusEl = document.getElementById("status");
const labelText = document.getElementById("labelText");
const confText = document.getElementById("confText");
const resultCard = document.getElementById("resultCard");
const topListContainer = document.getElementById("topListContainer");
const modelNameEl = document.getElementById("modelName");

// Helper: format confidence
function fmtConfidence(v){
  if (v === null || v === undefined) return "-";
  if (typeof v === "number"){
    if (v <= 1) return `${(v*100).toFixed(2)}%`;
    return `${(v*100).toFixed(2)}%`;
  }
  const n = Number(v);
  return isNaN(n) ? String(v) : `${(n*100).toFixed(2)}%`;
}

// show model name from backend env (optional)
(function fetchModelName(){
  // It will try to fetch / which returns basic app status containing env info (we didn't add that),
  // but we can populate with HF_MODEL via a fetch to / (if you want).
  // For now, show generic label
  modelNameEl.innerText = "Food-101 model";
})();

// enable send when file selected
fileInput.addEventListener("change", () => {
  const f = fileInput.files && fileInput.files[0];
  if (!f) {
    sendBtn.disabled = true;
    previewImg.style.display = "none";
    return;
  }
  sendBtn.disabled = false;
  previewImg.src = URL.createObjectURL(f);
  previewImg.style.display = "block";
});

// drag & drop support
previewArea.addEventListener("dragover", (ev) => {
  ev.preventDefault();
  previewArea.style.outline = "2px dashed rgba(255,255,255,0.06)";
});
previewArea.addEventListener("dragleave", () => {
  previewArea.style.outline = "none";
});
previewArea.addEventListener("drop", (ev) => {
  ev.preventDefault();
  previewArea.style.outline = "none";
  const f = ev.dataTransfer.files && ev.dataTransfer.files[0];
  if (f) {
    fileInput.files = ev.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

// main send handler
sendBtn.onclick = async function () {
  const f = fileInput.files && fileInput.files[0];
  if (!f) return;

  // UI: busy
  sendBtn.disabled = true;
  statusEl.innerHTML = `<span class="spinner" aria-hidden="true"></span> Enviando...`;
  labelText.innerText = "—";
  confText.innerText = "Confianza: —";
  topListContainer.innerHTML = "";
  resultCard.style.display = "block";

  const fd = new FormData();
  fd.append("file", f);

  try {
    const res = await fetch("/predict", { method: "POST", body: fd });
    const text = await res.text();
    if (!res.ok) {
      statusEl.innerText = `Error: ${res.status}`;
      sendBtn.disabled = false;
      return;
    }
    const data = JSON.parse(text);

    // label & confidence normalization
    const label = data.label ?? data.predicted_label ?? data.name ?? "Desconocido";
    const confidence = (data.confidence !== undefined) ? data.confidence : data.score ?? null;

    labelText.innerText = label.replaceAll('_',' ');
    confText.innerText = `Confianza: ${fmtConfidence(confidence)}`;

    // top-3: try to read data.raw or data.predictions
    let raw = data.raw ?? data.predictions ?? data;
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (Array.isArray(data.predictions)) list = data.predictions;

    if (list.length){
      const top = list.slice(0,3);
      let html = "<div style='margin-top:10px'><strong>Top 3</strong><ul class='top3'>";
      for (const p of top){
        const lab = p.label ?? p.name ?? JSON.stringify(p);
        const sc = p.score ?? p.confidence ?? null;
        html += `<li>${lab.replaceAll('_',' ')} — ${fmtConfidence(sc)}</li>`;
      }
      html += "</ul></div>";
      topListContainer.innerHTML = html;
    } else {
      topListContainer.innerHTML = "";
    }

    statusEl.innerText = "";
    sendBtn.disabled = false;

  } catch (err) {
    console.error(err);
    statusEl.innerText = "Error de conexión";
    sendBtn.disabled = false;
  }
};

// Optional: quick demo loader using local sample image (for testing local dev)
// This uses the uploaded file path you provided earlier. If you're testing locally,
// you can uncomment and use it. (Render won't serve /mnt/data paths; this is for local dev).
/*
(function loadLocalSample(){
  const sample = "/mnt/data/83344e5a-d378-4479-9122-10e6bb081a5f.png";
  // previewImg.src = sample;
  // previewImg.style.display = "block";
})();
*/
