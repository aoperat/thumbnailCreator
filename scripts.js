const fileInput = document.getElementById("fileInput");
const imageCanvas = document.getElementById("imageCanvas");
const downloadBtn = document.getElementById("downloadBtn");
const ctx = imageCanvas.getContext("2d");

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;

    img.onload = () => {
      const aspectRatio = 6 / 4;
      const imageWidth = imageCanvas.width;
      const imageHeight = imageWidth / aspectRatio;
      const offsetY = (imageCanvas.height - imageHeight) / 2;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
      ctx.drawImage(img, 0, offsetY, imageWidth, imageHeight);
    };
  };
  reader.readAsDataURL(file);
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "merged-image.png";
  link.href = imageCanvas.toDataURL();
  link.click();
});
