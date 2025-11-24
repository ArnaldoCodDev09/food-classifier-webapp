// web/app.js
document.getElementById('send').onclick = async () => {
  const f = document.getElementById('file').files[0];
  if(!f){ alert('Selecciona una imagen'); return; }
  const fd = new FormData();
  fd.append('file', f);
  document.getElementById('result').innerText = 'Enviando...';
  try {
    const res = await fetch('/predict', { method: 'POST', body: fd });
    const json = await res.json();
    document.getElementById('result').innerText = JSON.stringify(json, null, 2);
  } catch (err) {
    document.getElementById('result').innerText = 'Error: ' + err;
  }
};
