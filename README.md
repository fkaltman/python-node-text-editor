# Socket-Driven Text Editor — with Bouncing Animal Emojis 🐱🐧🐰

A lightweight, experimental text editor built on top of a custom Tkinter-based **socket canvas API**.  
The editor communicates with a canvas window over a TCP socket, sending drawing commands and receiving real-time keyboard/mouse events.

One of the playful features of this editor: **when you type the name of an animal, a matching animal emoji “bops” across the screen.**  
For example, typing “cat” makes 🐱 stroll across the canvas, “penguin” makes 🐧 waddle by, and so on.  
This turns the editor into a lively, animated environment that responds to your words in real time.

---

## 🚀 Features

- ✏️ Renders text and UI elements through socket-based canvas commands  
- ⌨️ Real-time keyboard and mouse event handling  
- 🪟 Automatic canvas window creation when a TCP connection is established  
- 🧹 Screen clearing and redrawing support  
- 🎨 Customizable colors, shapes, and text rendering  
- ⚙️ Built with Python 3 and Tkinter as the visual backend  

---

## 📦 Installation

**Prerequisite:**  
- Python 3.x

Clone the repository:

```bash
git clone <your-repo-url>
cd <project-folder>
