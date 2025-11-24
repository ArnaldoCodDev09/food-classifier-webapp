document.getElementById("send").onclick = async function () {
  const fileInput = document.getElementById("file");
  const resultDiv = document.getElementById("result");

  if (!fileInput.files.length) {
    resultDiv.innerText = "Por favor sube una imagen.";
    return;
  }

  const formData = new FormData();
  const file = fileInput.files[0];
  formData.append("file", file);       // coincida con backend
  // formData.append("image", file);   // opcional si tu backend espera "image"

  resultDiv.innerText = "Procesando...";

  try {
    // <-- USAR RUTA ROOT (no relativa /web/predict)
    const response = await fetch("/predict", {
      method: "POST",
      body: formData
    });

    console.log("HTTP status:", response.status);
    const text = await response.text();
    console.log("Body raw:", text);

    if (!response.ok) {
      resultDiv.innerText = `Error al procesar la imagen. Estado ${response.status}`;
      return;
    }

    const data = JSON.parse(text);
    // ahora frontend espera { label, confidence }
    resultDiv.innerHTML = `
      <p><strong>Predicción:</strong> ${data.label ?? JSON.stringify(data.predictions)}</p>
      <p><strong>Confianza:</strong> ${data.confidence ?? "-"}</p>
    `;
  } catch (err) {
    console.error(err);
    resultDiv.innerText = "Error conectando al servidor.";
  }
};
