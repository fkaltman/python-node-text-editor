const net = require("net");

// Connect to the canvas server
const client = net.createConnection({ port: 5005 }, () => {
  console.log("Connected to canvas server!");
});

// Handle connection close
client.on("end", () => {
  console.log("Disconnected from canvas server");
});

client.on("error", (err) => {
  console.error("Connection error:", err);
});

// --- Helper functions ---

// Send a command to the canvas
function sendCommand(command) {
  client.write(command + "\n");
}

// Draw text at x, y with color and string
function drawText(x, y, color, text) {
  const safeText = text.replace(/,/g, "");
  sendCommand(`text,${x},${y},${color},${safeText}`);
}

// Draw a rectangle
function drawRect(x, y, width, height, color) {
  sendCommand(`rect,${x},${y},${width},${height},${color}`);
}

// Clear the canvas
function clear() {
  sendCommand("clear");
}

// --- Start building your text editor here ---

// Editor state
let lines = [""]; // Array of text lines
let cursorLine = 0; // Which line the cursor is on
let cursorCol = 0; // Column position in the line

const CHAR_WIDTH = 8; // Width of each character (from README)
const CHAR_HEIGHT = 14; // Height of each character
const PADDING = 10; // Padding from edges

// Listen for canvas events
client.on("data", (data) => {
  const events = data.toString().split("\n").filter(Boolean);
  events.forEach((event) => {
    const [type, ...args] = event.split(",");

    if (type === "keydown") {
      handleKeyPress(args[0]);
    } else if (type === "resize") {
      render();
    } else if (type === "mousedown") {
      const x = parseInt(args[0]);
      const y = parseInt(args[1]);
      handleMouseClick(x, y);
    }
  });
});

function handleKeyPress(key) {
  if (key === "BackSpace") {
    if (cursorCol > 0) {
      // Delete character before cursor
      lines[cursorLine] =
        lines[cursorLine].slice(0, cursorCol - 1) +
        lines[cursorLine].slice(cursorCol);
      cursorCol--;
    } else if (cursorLine > 0) {
      // Join with previous line
      cursorCol = lines[cursorLine - 1].length;
      lines[cursorLine - 1] += lines[cursorLine];
      lines.splice(cursorLine, 1);
      cursorLine--;
    }
  } else if (key === "Return") {
    // Split line at cursor
    const rightPart = lines[cursorLine].slice(cursorCol);
    lines[cursorLine] = lines[cursorLine].slice(0, cursorCol);
    lines.splice(cursorLine + 1, 0, rightPart);
    cursorLine++;
    cursorCol = 0;
  } else if (key === "space") {
    // Spacebar
    lines[cursorLine] =
      lines[cursorLine].slice(0, cursorCol) +
      " " +
      lines[cursorLine].slice(cursorCol);
    cursorCol++;
  } else if (key.length === 1) {
    // Regular character
    lines[cursorLine] =
      lines[cursorLine].slice(0, cursorCol) +
      key +
      lines[cursorLine].slice(cursorCol);
    cursorCol++;
  } else if (key === "Left") {
    if (cursorCol > 0) {
      cursorCol--;
    } else if (cursorLine > 0) {
      cursorLine--;
      cursorCol = lines[cursorLine].length;
    }
  } else if (key === "Right") {
    if (cursorCol < lines[cursorLine].length) {
      cursorCol++;
    } else if (cursorLine < lines.length - 1) {
      cursorLine++;
      cursorCol = 0;
    }
  } else if (key === "Up") {
    if (cursorLine > 0) {
      cursorLine--;
      cursorCol = Math.min(cursorCol, lines[cursorLine].length);
    }
  } else if (key === "Down") {
    if (cursorLine < lines.length - 1) {
      cursorLine++;
      cursorCol = Math.min(cursorCol, lines[cursorLine].length);
    }
  }

  render();
}

function handleMouseClick(x, y) {
  const line = Math.floor((y - PADDING) / CHAR_HEIGHT);
  const col = Math.floor((x - PADDING) / CHAR_WIDTH);

  if (line >= 0 && line < lines.length) {
    cursorLine = line;
    cursorCol = Math.min(col, lines[cursorLine].length);
  }

  render();
}

function render() {
  clear();

  // Draw each line of text
  lines.forEach((line, i) => {
    const y = PADDING + i * CHAR_HEIGHT;
    drawText(PADDING, y, "#000000", line || " ");
  });

  // Draw cursor
  const cursorX = PADDING + cursorCol * CHAR_WIDTH;
  const cursorY = PADDING + cursorLine * CHAR_HEIGHT;
  drawRect(cursorX, cursorY, 2, CHAR_HEIGHT, "#000000");
}

// Initial render
setTimeout(() => render(), 100);
