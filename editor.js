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
let animations = []; // Active emoji animations

const CHAR_WIDTH = 8; // Width of each character (from README)
const CHAR_HEIGHT = 14; // Height of each character
const LINE_HEIGHT = 18; // Actual spacing between lines (adds line spacing)
const PADDING = 26; // Padding from edges (increased for more margin)
const HEADER_HEIGHT = 40; // Space for header at top (increased for more spacing)
const MAX_LINE_WIDTH = 90; // Maximum characters per line before auto-wrap

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

function autoWrapLine() {
  if (lines[cursorLine].length >= MAX_LINE_WIDTH) {
    const lastSpace = lines[cursorLine].lastIndexOf(" ");
    if (lastSpace > 0) {
      const rightPart = lines[cursorLine].slice(lastSpace + 1);
      lines[cursorLine] = lines[cursorLine].slice(0, lastSpace);
      lines.splice(cursorLine + 1, 0, rightPart);
      cursorLine++;
      cursorCol = rightPart.length;
    }
  }
}

function handleKeyPress(key) {
  // Map special key names to their characters
  const keyMap = {
    period: ".",
    comma: ",",
    exclam: "!",
    question: "?",
    apostrophe: "'",
    quotedbl: '"',
    colon: ":",
    semicolon: ";",
    parenleft: "(",
    parenright: ")",
    bracketleft: "[",
    bracketright: "]",
    braceleft: "{",
    braceright: "}",
    slash: "/",
    backslash: "\\",
    minus: "-",
    underscore: "_",
    plus: "+",
    equal: "=",
    at: "@",
    numbersign: "#",
    dollar: "$",
    percent: "%",
    ampersand: "&",
    asterisk: "*",
  };

  // Convert key name to actual character if needed
  if (keyMap[key]) {
    key = keyMap[key];
  }

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
    autoWrapLine();
  } else if (key.length === 1) {
    // Regular character
    lines[cursorLine] =
      lines[cursorLine].slice(0, cursorCol) +
      key +
      lines[cursorLine].slice(cursorCol);
    cursorCol++;
    checkForTriggerWords(); // Check if we typed an animal word
    autoWrapLine();
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
  // Account for header when calculating line position
  const line = Math.floor((y - PADDING - HEADER_HEIGHT) / LINE_HEIGHT);
  const col = Math.floor((x - PADDING) / CHAR_WIDTH);

  if (line >= 0 && line < lines.length) {
    cursorLine = line;
    cursorCol = Math.min(col, lines[cursorLine].length);
  }

  render();
}

function render() {
  clear();
  drawRect(0, 0, 800, 600, "#f5f5f5"); // Light gray background

  // Draw header (left-aligned)
  const headerText = "✨ Tell me about your pet ✨";
  drawText(PADDING, PADDING, "#7393B3", headerText);

  // Draw each line of text (shifted down by header)
  lines.forEach((line, i) => {
    const y = PADDING + HEADER_HEIGHT + i * LINE_HEIGHT;
    drawText(PADDING, y, "#000000", line || " ");
  });

  // Draw animations
  animations.forEach((anim) => {
    drawText(Math.floor(anim.x), Math.floor(anim.y), "#000000", anim.emoji);
  });

  // Draw cursor (shifted down by header)
  const cursorX = PADDING + cursorCol * CHAR_WIDTH;
  const cursorY = PADDING + HEADER_HEIGHT + cursorLine * LINE_HEIGHT;
  drawRect(cursorX, cursorY, 2, CHAR_HEIGHT, "#000000");
}

// Initial render
setTimeout(() => render(), 100);

// Animation functions
function checkForTriggerWords() {
  const currentLine = lines[cursorLine].toLowerCase();
  const triggers = [
    { words: ["dog", "puppy", "pup"], emoji: "🐶" },
    { words: ["cat", "kitten", "kitty", "kittie"], emoji: "🐱" },
    { words: ["bunny", "rabbit"], emoji: "🐰" },
    { words: ["lizard", "reptile"], emoji: "🦎" },
    { words: ["bird", "parrot", "parakeet"], emoji: "🐦" },
    { words: ["fish", "goldfish"], emoji: "🐠" },
    { words: ["hamster"], emoji: "🐹" },
    { words: ["turtle", "tortoise"], emoji: "🐢" },
    { words: ["frog", "toad"], emoji: "🐸" },
    { words: ["mouse", "mice"], emoji: "🐭" },
    { words: ["peacock"], emoji: "🦚" },
    { words: ["tiger"], emoji: "🐯" },
    { words: ["horse", "pony"], emoji: "🐴" },
    { words: ["chicken", "hen", "rooster"], emoji: "🐔" },
    { words: ["squirrel", "chipmunk"], emoji: "🐿️" },
    { words: ["bear"], emoji: "🐻" },
    { words: ["dragon"], emoji: "🐉" },
    { words: ["koala"], emoji: "🐨" },
    { words: ["fox"], emoji: "🦊" },
    { words: ["scorpion"], emoji: "🦂" },
    { words: ["hedgehog"], emoji: "🦔" },
    { words: ["sauropod"], emoji: "🦕" },
    { words: ["t-rex"], emoji: "🦖" },
  ];

  for (let trigger of triggers) {
    const matchFound = trigger.words.some((word) => currentLine.includes(word));
    if (matchFound) {
      // Only spawn if we don't already have an animation running for this emoji
      const alreadyAnimating = animations.some(
        (anim) => anim.emoji === trigger.emoji
      );
      if (!alreadyAnimating) {
        spawnAnimation(trigger.emoji);
      }
      // Continue checking for other animals in the line
    }
  }
}

function spawnAnimation(emoji) {
  // Start just above the current line (accounting for header)
  const startY =
    PADDING + HEADER_HEIGHT + cursorLine * LINE_HEIGHT - LINE_HEIGHT;

  const anim = {
    emoji: emoji,
    x: 0, // Start from left edge
    y: startY,
    vx: 0.75, // Move right at constant speed (slower)
    vy: 0, // Will be used for bouncing
    baseY: startY, // Remember the baseline
    bouncePhase: 0, // For sine wave bounce
    life: 100, // More frames since we're moving slower
  };

  animations.push(anim);
}

function updateAnimations() {
  animations = animations.filter((anim) => {
    anim.x += anim.vx;

    // Add a bouncing motion
    anim.bouncePhase += 0.3;
    anim.y = anim.baseY + Math.sin(anim.bouncePhase) * 8;

    // Remove when it goes off the right edge
    if (anim.x > 800) return false;

    anim.life--;
    return anim.life > 0;
  });
}

// Animation loop - runs at 20fps
setInterval(() => {
  if (animations.length > 0) {
    updateAnimations();
    render();
  }
}, 50);
