// web/app.js (PRO-ANIMADO)
const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');
const previewImg = document.getElementById('previewImg');
const statusEl = document.getElementById('status');
const labelText = document.getElementById('labelText');
const confText = document.getElementById('confText');
const resultCard = document.getElementById('resultCard');
const topListContainer = document.getElementById('topListContainer');
const splashCanvas = document.getElementById('splashCanvas');
const electricRoot = document.getElementById('electricRoot');

// === preview and controls ===
fileInput.addEventListener('change', () => {
  const f = fileInput.files && fileInput.files[0];
  if (!f) { sendBtn.disabled = true; previewImg.style.display='none'; return; }
  sendBtn.disabled = false;
  previewImg.src = URL.createObjectURL(f);
  previewImg.style.display = 'block';
});

// allow clicking the fake button label
document.querySelector('.file-btn').addEventListener('click', () => fileInput.click());

// === helper format confidence ===
function fmtConfidence(v){
  if (v == null) return '-';
  if (typeof v === 'number'){
    if (v <= 1) return `${(v*100).toFixed(2)}%`;
    return `${(v*100).toFixed(2)}%`;
  }
  const n = Number(v);
  return isNaN(n) ? String(v) : `${(n*100).toFixed(2)}%`;
}

// === call backend predict ===
sendBtn.addEventListener('click', async () => {
  const f = fileInput.files && fileInput.files[0];
  if (!f) return;
  sendBtn.disabled = true;
  statusEl.innerHTML = 'Procesando...';

  const fd = new FormData();
  fd.append('file', f);

  try {
    const res = await fetch('/predict', { method: 'POST', body: fd });
    const text = await res.text();

    if (!res.ok) {
      statusEl.innerText = `Error ${res.status}`;
      sendBtn.disabled = false;
      return;
    }

    const data = JSON.parse(text);
    statusEl.innerText = 'Hecho';
    // normalize
    const label = data.label ?? data.predicted_label ?? (Array.isArray(data.raw) ? data.raw[0]?.label : null) ?? 'Desconocido';
    const confidence = data.confidence ?? data.score ?? (Array.isArray(data.raw) ? data.raw[0]?.score : null);
    labelText.innerText = String(label).replaceAll('_',' ');
    confText.innerText = `Confianza: ${fmtConfidence(confidence)}`;

    // top 3
    const raw = data.raw ?? data.predictions ?? [];
    if (Array.isArray(raw) && raw.length){
      const top = raw.slice(0,3);
      let html = '<div style="margin-top:10px"><strong>Top 3</strong><ul class="top3">';
      for (const p of top){
        const lab = p.label ?? p.name ?? JSON.stringify(p);
        html += `<li>${lab.replaceAll('_',' ')} — ${fmtConfidence(p.score ?? p.confidence)}</li>`;
      }
      html += '</ul></div>';
      topListContainer.innerHTML = html;
    } else {
      topListContainer.innerHTML = '';
    }

    resultCard.style.display = 'block';
    sendBtn.disabled = false;
  } catch (err) {
    console.error(err);
    statusEl.innerText = 'Error de conexión';
    sendBtn.disabled = false;
  }
});

// === simple electric pulse animation: tweak CSS var over time ===
(function animateElectric(){
  let t=0;
  function step(){
    t += 0.02;
    // oscillate border width and glow
    const w = 1 + Math.abs(Math.sin(t))*2;
    electricRoot.style.setProperty('--eb-border-width', `${w}px`);
    requestAnimationFrame(step);
  }
  step();
})();

// === lightweight splash canvas for cursor trails (simple particle, low cost) ===
(function splashParticles(){
  const c = splashCanvas;
  const ctx = c.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  let w = c.width = innerWidth*DPR, h = c.height = innerHeight*DPR;
  c.style.width = innerWidth+'px'; c.style.height = innerHeight+'px';
  ctx.scale(DPR, DPR);

  const particles = [];
  function addParticle(x,y){
    particles.push({
      x, y, vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2,
      life: 40 + Math.random()*40,
      size: 8 + Math.random()*18,
      hue: Math.floor(160 + Math.random()*120)
    });
  }
  window.addEventListener('mousemove', e => {
    addParticle(e.clientX, e.clientY);
    if (Math.random()>0.85) addParticle(e.clientX+10, e.clientY+10);
  });

  function resize(){
    w = c.width = innerWidth*DPR; h = c.height = innerHeight*DPR;
    c.style.width = innerWidth+'px'; c.style.height = innerHeight+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener('resize', resize);

  function draw(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for (let i = particles.length-1; i>=0; i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      const alpha = Math.max(0, p.life/80);
      ctx.beginPath();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      g.addColorStop(0, `hsla(${p.hue},90%,65%,${0.85*alpha})`);
      g.addColorStop(0.6, `hsla(${p.hue},70%,55%,${0.25*alpha})`);
      g.addColorStop(1, `hsla(${p.hue},60%,30%,0)`);
      ctx.fillStyle = g;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      if (p.life<=0) particles.splice(i,1);
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// === OPTIONAL: quick local sample preview path (para pruebas locales) ===
// ruta local que subiste: /mnt/data/83344e5a-d378-4479-9122-10e6bb081a5f.png
// si estás en local y quieres pre-cargar la imagen, descomenta la siguiente línea:
// previewImg.src = '/mnt/data/83344e5a-d378-4479-9122-10e6bb081a5f.png'; previewImg.style.display='block';
