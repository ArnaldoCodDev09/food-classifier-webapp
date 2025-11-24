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
  formData.append("image", file); // <-- intento con otro nombre por si el backend espera "image"

  resultDiv.innerText = "Procesando...";

  try {
    const response = await fetch("https://food-classifier-webapp-shzv.onrender.com/predict", {
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
    resultDiv.innerHTML = `
      <p><strong>Predicción:</strong> ${data.label}</p>
      <p><strong>Confianza:</strong> ${data.confidence}</p>
    `;
  } catch (err) {
    console.error(err);
    resultDiv.innerText = "Error conectando al servidor.";
  }
};
