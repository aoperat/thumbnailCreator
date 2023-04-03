const fileInput = document.getElementById("fileInput");
const imageCanvas = document.getElementById("imageCanvas");
const downloadBtn = document.getElementById("downloadBtn");
const ctx = imageCanvas.getContext("2d");
const snapDistance = 0;

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");

const highResCanvas = document.getElementById("highResCanvas");
const highResCtx = highResCanvas.getContext("2d");

const handleSize = 20;


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


let initialFingerDistance = 0;
let initialRectSize = { width: 0, height: 0 };




// Event Listeners
fileInput.addEventListener("change", handleFileInputChange);
imageCanvas.addEventListener("mousedown", handleMouseDown);
imageCanvas.addEventListener("mousemove", handleMouseMove);
imageCanvas.addEventListener("mouseup", handleMouseUp);
downloadBtn.addEventListener("click", handleDownloadClick);
imageCanvas.addEventListener("wheel", handleMouseWheel);

// Touch event listeners for mobile
imageCanvas.addEventListener("touchstart", handleTouchStart);
imageCanvas.addEventListener("touchmove", handleTouchMove);
imageCanvas.addEventListener("touchend", handleTouchEnd)


// Event Handlers
function handleMouseWheel(e) {
  e.preventDefault();

  const scaleFactor = e.deltaY < 0 ? 1.05 : 0.95;
  const newWidth = rect.width * scaleFactor;
  const newHeight = rect.height * scaleFactor;

  rect.width = newWidth;
  rect.height = newHeight;

  applyMagnetEffect();
  drawImageAndRectangle();
}

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

  console.clear()
  console.log(`mouseX: ${mouseX} mouseY: ${mouseY} // X: ${e.clientX} Y: ${e.clientY} // left: ${imageCanvas.getBoundingClientRect().left} top: ${imageCanvas.getBoundingClientRect().top}`)
  console.log(`rect.x: ${rect.x} rect.y: ${rect.y} rect.width: ${rect.width} rect.height: ${rect.height}`)

  //console.log(`mouseX: ${mouseX} mouseY: ${mouseY} rect.width: ${rect.width} rect.height: ${rect.height}`)
  //console.log(`con1: [${mouseX > rect.x + rect.width - 10}] con2: [${mouseX < rect.x + rect.width}] con3: [${mouseY > rect.y + rect.height - 10}] con4: [${mouseY < rect.y + rect.height}]`)
  if (
    mouseX > rect.x + rect.width - handleSize / 2 &&
    mouseX < rect.x + rect.width + handleSize / 2 &&
    mouseY > rect.y + rect.height - handleSize / 2 &&
    mouseY < rect.y + rect.height + handleSize / 2
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

  if (
    mouseX > rect.x + rect.width - handleSize / 2 &&
    mouseX < rect.x + rect.width + handleSize / 2 &&
    mouseY > rect.y + rect.height - handleSize / 2 &&
    mouseY < rect.y + rect.height + handleSize / 2
  ) {
    document.getElementById("imageCanvas").style.cursor = 'pointer';
    

  } else {
    document.getElementById("imageCanvas").style.cursor = 'default';
  }

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


// Touch event handlers for mobile
function handleTouchStart(e) {
  e.preventDefault(); // Prevent scrolling or zooming
  const { x: touchX, y: touchY } = getTouchCoordinates(e);

  if (e.touches.length === 2) {
    initialFingerDistance = getDistanceBetweenFingers(e.touches[0], e.touches[1]);
    initialRectSize = { width: rect.width, height: rect.height };
  }

  if (
    touchX > rect.x + rect.width - handleSize / 2 &&
    touchX < rect.x + rect.width + handleSize / 2&&
    touchY > rect.y + rect.height - handleSize / 2 &&
    touchY < rect.y + rect.height + handleSize / 2
  ) {
    rect.isResizing = true;
  } else if (
    touchX > rect.x &&
    touchX < rect.x + rect.width &&
    touchY > rect.y &&
    touchY < rect.y + rect.height
  ) {
    rect.isMoving = true;
  }
}

function handleTouchMove(e){
  e.preventDefault(); // Prevent scrolling or zooming

  if (e.touches.length === 2) {
    const currentFingerDistance = getDistanceBetweenFingers(e.touches[0], e.touches[1]);
    const scaleFactor = currentFingerDistance / initialFingerDistance;

    rect.width = initialRectSize.width * scaleFactor;
    rect.height = initialRectSize.height * scaleFactor;

    drawImageAndRectangle();
  }

  const { x: touchX, y: touchY } = getTouchCoordinates(e);

  if (rect.isResizing) {
    const newWidth = touchX - rect.x;
    const newHeight = newWidth * (4 / 6);

    if (newWidth <= imageCanvas.width - rect.x && newHeight <= imageCanvas.height - rect.y - offsetY * 2) {
      rect.width = newWidth;
      rect.height = newHeight;
    }

    // Magnet effect
    applyMagnetEffect();

    drawImageAndRectangle();
  } else if (rect.isMoving) {
    const dx = touchX - rect.width / 2;
    const dy = touchY - rect.height / 2;

    rect.x = Math.max(0, Math.min(imageCanvas.width - rect.width, dx));
    rect.y = Math.max(offsetY, Math.min(imageCanvas.height - rect.height - offsetY, dy));

    // Magnet effect
    applyMagnetEffect();

    drawImageAndRectangle();
  }
}

function handleTouchEnd(e){
  e.preventDefault(); // Prevent scrolling or zooming
  rect.isResizing = false;
  rect.isMoving = false;
}





// Helper Functions
function handleResizing(mouseX, mouseY) {
  const newWidth = mouseX - rect.x;
  const newHeight = newWidth * (4 / 6);

  rect.width = newWidth;
  rect.height = newHeight;

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
    ctx.drawImage(img, 0, offsetY, imageCanvas.width, imageCanvas.height - offsetY * 2);

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
    ctx.drawImage(img, 0, offsetY, imageCanvas.width, imageCanvas.height - offsetY * 2);

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


function drawCanvas(canvas, ctx) {
  // Clear the canvas
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate the new dimensions for the 6:4 aspect ratio image
  const aspectRatio = 6 / 4;
  const previewWidth = Math.min(canvas.width, canvas.height * aspectRatio);
  const previewHeight = previewWidth / aspectRatio;

  // Calculate the position to draw the extracted image centered in the canvas
  const centerX = (canvas.width - previewWidth) / 2;
  const centerY = (canvas.height - previewHeight) / 2;

  // Clip the context to only draw within the rectangle area of ​​the original image
  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX, centerY, previewWidth, previewHeight);
  ctx.clip();

  // Draw the original image within the rectangle area centered in the canvas
  const addScale = (1.35);
  const scaleX = previewWidth / rect.width;
  const scaleY = previewHeight / rect.height;
  const imageOffsetX = centerX - rect.x * scaleX;
  const imageOffsetY = centerY - rect.y * scaleY + offsetY * scaleY * addScale;
  ctx.drawImage(img, imageOffsetX, imageOffsetY, imageCanvas.width * scaleX, imageCanvas.height * scaleY * addScale);

  // Restore the context
  ctx.restore();
}

function drawHighResImage() {
  drawCanvas(highResCanvas, highResCtx);
}

function drawPreview() {
  drawCanvas(previewCanvas, previewCtx);
}

function getTouchCoordinates(e) {
  const rect = e.target.getBoundingClientRect();
  const scaleX = e.target.width / rect.width;
  const scaleY = e.target.height / rect.height;
  const touchX = (e.touches[0].clientX - rect.left) * scaleX;
  const touchY = (e.touches[0].clientY - rect.top) * scaleY;
  return { x: touchX, y: touchY };
}

function getDistanceBetweenFingers(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}




// New code
const guideBtn = document.getElementById("guideBtn");
const guideModal = document.getElementById("guideModal");
const closeModal = document.querySelector(".close");

guideBtn.addEventListener("click", openModal);
closeModal.addEventListener("click", closeModalHandler);
window.addEventListener("click", outsideClickHandler);

function openModal() {
  guideModal.style.display = "block";
}

function closeModalHandler() {
  guideModal.style.display = "none";
}

function outsideClickHandler(e) {
  if (e.target == guideModal) {
    guideModal.style.display = "none";
  }
}
