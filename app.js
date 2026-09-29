const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const colorInput = document.querySelector("#color");
const sizeInput = document.querySelector("#size");
const sizeLabel = document.querySelector("#size-label");
const undoButton = document.querySelector("#undo");
const clearButton = document.querySelector("#clear");
const saveButton = document.querySelector("#save");
const toolButtons = document.querySelectorAll(".tool");
const swatches = document.querySelectorAll(".swatch");

const state = {
  tool: "pen",
  color: colorInput.value,
  size: Number(sizeInput.value),
  drawing: false,
  history: [],
};

function resizeCanvas() {
  const snapshot = canvas.width ? canvas.toDataURL() : null;
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(width * ratio));
  canvas.height = Math.max(1, Math.floor(height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  fillBackground();
  if (snapshot) {
    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 0, 0, width, height);
    };
    image.src = snapshot;
  }
}

function fillBackground() {
  const { width, height } = canvas.getBoundingClientRect();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function beginStroke(event) {
  event.preventDefault();
  if (canvas.setPointerCapture) {
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable for some synthetic or canceled pointers.
    }
  }
  pushHistory();
  state.drawing = true;
  const point = pointerPosition(event);
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  drawDot(point);
}

function drawStroke(event) {
  if (!state.drawing) return;
  const point = pointerPosition(event);
  ctx.lineWidth = state.size;
  ctx.strokeStyle = state.tool === "eraser" ? "#ffffff" : state.color;
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
}

function drawDot(point) {
  ctx.fillStyle = state.tool === "eraser" ? "#ffffff" : state.color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, state.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
}

function endStroke() {
  state.drawing = false;
}

function pushHistory() {
  state.history.push(canvas.toDataURL());
  if (state.history.length > 30) state.history.shift();
  undoButton.disabled = false;
}

function undo() {
  const snapshot = state.history.pop();
  if (!snapshot) return;
  const image = new Image();
  image.onload = () => {
    const { width, height } = canvas.getBoundingClientRect();
    fillBackground();
    ctx.drawImage(image, 0, 0, width, height);
  };
  image.src = snapshot;
  undoButton.disabled = state.history.length === 0;
}

function clearCanvas() {
  pushHistory();
  fillBackground();
}

function saveImage() {
  const link = document.createElement("a");
  link.download = "drawing.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function setTool(tool) {
  state.tool = tool;
  toolButtons.forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  canvas.classList.toggle("tool-pen", tool === "pen");
  canvas.classList.toggle("tool-eraser", tool === "eraser");
}

function setColor(color) {
  state.color = color;
  colorInput.value = color;
  setTool("pen");
  swatches.forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color === color);
  });
}

canvas.addEventListener("pointerdown", beginStroke);
canvas.addEventListener("pointermove", drawStroke);
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);

colorInput.addEventListener("input", () => setColor(colorInput.value));
sizeInput.addEventListener("input", () => {
  state.size = Number(sizeInput.value);
  sizeLabel.textContent = sizeInput.value;
});

toolButtons.forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => setColor(swatch.dataset.color));
});

undoButton.addEventListener("click", undo);
clearButton.addEventListener("click", clearCanvas);
saveButton.addEventListener("click", saveImage);

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
  }
});

window.addEventListener("resize", resizeCanvas);
undoButton.disabled = true;
setColor(state.color);
resizeCanvas();
