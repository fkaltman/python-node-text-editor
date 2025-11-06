const net = require("net");

// Connect to the canvas server
const client = net.createConnection({ port: 5005 }, () => {
  console.log("Connected to canvas server!");
});

// Listen for events from the canvas
client.on("data", (data) => {
  const lines = data.toString().split("\n").filter(Boolean);
  lines.forEach((line) => {
    console.log("Event from canvas:", line);
  });
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
