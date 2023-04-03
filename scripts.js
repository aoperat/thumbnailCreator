const fileInput = document.getElementById("fileInput");
const imageCanvas = document.getElementById("imageCanvas");
const downloadBtn = document.getElementById("downloadBtn");
const ctx = imageCanvas.getContext("2d");
const snapDistance = 0;

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");

const highResCanvas = document.getElementById("highResCanvas");
const highResCtx = highResCanvas.getContext("2d");

let rect = {
  x: 50,
  y: 50,
  width: 100,
  height: 100 * (4 / 6),
  isResizing: false,
  isMoving: false,
};

let offsetY;
let img;

// Event Listeners
fileInput.addEventListener("change", handleFileInputChange);
imageCanvas.addEventListener("mousedown", handleMouseDown);
imageCanvas.addEventListener("mousemove", handleMouseMove);
imageCanvas.addEventListener("mouseup", handleMouseUp);
downloadBtn.addEventListener("click", handleDownloadClick);

// Event Handlers
function handleFileInputChange(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    img = new Image();
    img.src = event.target.result;

    img.onload = () => {
      drawImageAndRectangle();
    };
  };
  reader.readAsDataURL(file);
}

function handleMouseDown(e) {
  const mouseX = e.clientX - imageCanvas.getBoundingClientRect().left;
  const mouseY = e.clientY - imageCanvas.getBoundingClientRect().top;

  if (
    mouseX > rect.x + rect.width - 10 &&
    mouseX < rect.x + rect.width &&
    mouseY > rect.y + rect.height - 10 &&
    mouseY < rect.y + rect.height
  ) {
    rect.isResizing = true;
  } else if (
    mouseX > rect.x &&
    mouseX < rect.x + rect.width &&
    mouseY > rect.y &&
    mouseY < rect.y + rect.height
  ) {
    rect.isMoving = true;
  }
}

function handleMouseMove(e) {
  const mouseX = e.clientX - imageCanvas.getBoundingClientRect().left;
  const mouseY = e.clientY - imageCanvas.getBoundingClientRect().top;

  if (rect.isResizing) {
    handleResizing(mouseX, mouseY);
  } else if (rect.isMoving) {
    handleMoving(mouseX, mouseY);
  }
}

function handleMouseUp() {
  rect.isResizing = false;
  rect.isMoving = false;
}

function handleDownloadClick() {
  drawHighResImage();

  const link = document.createElement("a");
  link.download = "merged-image.png";
  link.href = highResCanvas.toDataURL();
  link.click();
}

// Helper Functions
function handleResizing(mouseX, mouseY) {
  const newWidth = mouseX - rect.x;
  const newHeight = newWidth * (4 / 6);

  if (newWidth <= imageCanvas.width - rect.x && newHeight <= imageCanvas.height - rect.y - offsetY * 2) {
    rect.width = newWidth;
    rect.height = newHeight;
  }

  applyMagnetEffect();
  drawImageAndRectangle();
}

function handleMoving(mouseX, mouseY) {
  const dx = mouseX - rect.width / 2;
  const dy = mouseY - rect.height / 2;

  rect.x = Math.max(0, Math.min(imageCanvas.width - rect.width, dx));
  rect.y = Math.max(offsetY, Math.min(imageCanvas.height - rect.height - offsetY, dy));

  applyMagnetEffect();
  drawImageAndRectangle();
}


function applyMagnetEffect() {
  if (Math.abs(rect.x) <= snapDistance) {
    rect.x = 0;
  }
  if (Math.abs(rect.y - offsetY) <= snapDistance) {
    rect.y = offsetY;
  }
  if (Math.abs(rect.x + rect.width - imageCanvas.width) <= snapDistance) {
    rect.x = imageCanvas.width - rect.width;
  }
  if (Math.abs(rect.y + rect.height - (imageCanvas.height - offsetY)) <= snapDistance) {
    rect.y = imageCanvas.height - offsetY - rect.height;
  }
}

function drawImageAndRectangle() {
  const imageAspectRatio = img.width / img.height;
  const imageWidth = imageCanvas.width;
  const imageHeight = imageWidth / imageAspectRatio;
  offsetY = (imageCanvas.height - imageHeight) / 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
  if (img) {
    ctx.drawImage(img, 0, offsetY, imageWidth, imageHeight);

    // Darken the image outside the rectangle
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, offsetY, imageCanvas.width, rect.y - offsetY);
    ctx.fillRect(0, offsetY, rect.x, imageHeight);
    ctx.fillRect(rect.x + rect.width, offsetY, imageCanvas.width - rect.x - rect.width, imageHeight);
    ctx.fillRect(rect.x, rect.y + rect.height, rect.width, imageCanvas.height - rect.y - rect.height - offsetY);

    // Clip the image to only draw within the rectangle
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();

    // Draw the original image within the rectangle
    ctx.drawImage(img, 0, offsetY, imageWidth, imageHeight);

    // Restore the context to draw the rectangle and resize handle
    ctx.restore();

    drawPreview();

  }

  // Draw the rectangle
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

  // Draw the resize handle
  ctx.fillStyle = "#000";
  ctx.fillRect(rect.x + rect.width - 10, rect.y + rect.height - 10, 10, 10);
}

function darkenImageOutsideRectangle() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, offsetY, imageCanvas.width, rect.y - offsetY);
  ctx.fillRect(0, offsetY, rect.x, imageCanvas.height);
  ctx.fillRect(rect.x + rect.width, offsetY, imageCanvas.width - rect.x - rect.width, imageCanvas.height);
  ctx.fillRect(rect.x, rect.y + rect.height, rect.width, imageCanvas.height - rect.y - rect.height - offsetY);
}




function drawHighResImage() {

  // Clear the preview canvas
  highResCtx.fillStyle = "#FFFFFF";
  highResCtx.fillRect(0, 0, highResCanvas.width, highResCanvas.height);

  // Calculate the new dimensions for the 6:4 aspect ratio image
  const aspectRatio = 6 / 4;
  const previewWidth = Math.min(highResCanvas.width, highResCanvas.height * aspectRatio);
  const previewHeight = previewWidth / aspectRatio;

  // Calculate the position to draw the extracted image centered in the preview canvas
  const centerX = (highResCanvas.width - previewWidth) / 2;
  const centerY = (highResCanvas.height - previewHeight) / 2;

  // Clip the context to only draw within the rectangle area of ​​the original image
  highResCtx.save();
  highResCtx.beginPath();
  highResCtx.rect(centerX, centerY, previewWidth, previewHeight);
  highResCtx.clip();

  // Draw the original image within the rectangle area centered in the preview canvas
  const scaleX = previewWidth / rect.width;
  const scaleY = previewHeight / rect.height;
  const imageOffsetX = centerX - rect.x * scaleX;
  const imageOffsetY = centerY - rect.y * scaleY + offsetY * scaleY*(6/4)
  highResCtx.drawImage(img, imageOffsetX, imageOffsetY, imageCanvas.width * scaleX, imageCanvas.height * scaleY*(6/4));

  // Restore the context
  highResCtx.restore();
}


function drawPreview() {
  // Clear the preview canvas
  previewCtx.fillStyle = "#FFFFFF";
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

  // Calculate the new dimensions for the 6:4 aspect ratio image
  const aspectRatio = 6 / 4;
  const previewWidth = Math.min(previewCanvas.width, previewCanvas.height * aspectRatio);
  const previewHeight = previewWidth / aspectRatio;

  // Calculate the position to draw the extracted image centered in the preview canvas
  const centerX = (previewCanvas.width - previewWidth) / 2;
  const centerY = (previewCanvas.height - previewHeight) / 2;

  // Clip the context to only draw within the rectangle area of ​​the original image
  previewCtx.save();
  previewCtx.beginPath();
  previewCtx.rect(centerX, centerY, previewWidth, previewHeight);
  previewCtx.clip();

  // Draw the original image within the rectangle area centered in the preview canvas
  const scaleX = previewWidth / rect.width;
  const scaleY = previewHeight / rect.height;
  const imageOffsetX = centerX - rect.x * scaleX;
  const imageOffsetY = centerY - rect.y * scaleY + offsetY * scaleY*(6/4)
  previewCtx.drawImage(img, imageOffsetX, imageOffsetY, imageCanvas.width * scaleX, imageCanvas.height * scaleY*(6/4));

  // Restore the context
  previewCtx.restore();
}

