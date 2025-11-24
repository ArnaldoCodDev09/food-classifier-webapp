document.getElementById("send").onclick = async function () {
    const fileInput = document.getElementById("file");
    const resultDiv = document.getElementById("result");

    if (!fileInput.files.length) {
        resultDiv.innerText = "Por favor sube una imagen.";
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    resultDiv.innerText = "Procesando...";

    try {
        const response = await fetch("https://food-classifier-webapp-shzv.onrender.com/predict", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            resultDiv.innerText = "Error al procesar la imagen.";
            return;
        }

        const data = await response.json();
        resultDiv.innerHTML = `
            <p><strong>Predicción:</strong> ${data.label}</p>
            <p><strong>Confianza:</strong> ${data.confidence}</p>
        `;
    } catch (err) {
        resultDiv.innerText = "Error conectando al servidor.";
    }
};
