document.getElementById("send").onclick = async function () {
  const fileInput = document.getElementById("file");
  const resultDiv = document.getElementById("result");

  if (!fileInput.files.length) {
    resultDiv.innerText = "Por favor sube una imagen.";
    return;
  }

  const formData = new FormData();
  const file = fileInput.files[0];
  formData.append("file", file);

  resultDiv.innerText = "Procesando...";

  try {
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

    // Normalizar y formatear confianza
    const label = data.label ?? (data.predictions ? JSON.stringify(data.predictions) : "Desconocido");
    let confidence = data.confidence;
    if (confidence === null || confidence === undefined) {
      confidence = "-";
    } else {
      // Convertir a porcentaje con 2 decimales si viene entre 0 y 1
      if (typeof confidence === "number" && confidence <= 1) {
        confidence = `${(confidence * 100).toFixed(2)}%`;
      } else if (typeof confidence === "number") {
        confidence = confidence.toFixed(4);
      } else {
        confidence = String(confidence);
      }
    }

    resultDiv.innerHTML = `
      <p><strong>Predicción:</strong> ${label}</p>
      <p><strong>Confianza:</strong> ${confidence}</p>
    `;
  } catch (err) {
    console.error(err);
    resultDiv.innerText = "Error conectando al servidor.";
  }
};
