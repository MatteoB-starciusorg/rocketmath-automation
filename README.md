# 🚀 Rocket Math Automation Extension

A Chrome Extension (Manifest V3) that automates solving "Equivalent Fractions" levels on [play.rocketmath.com](https://play.rocketmath.com) by reading game data directly from the DOM.

## Features

- ✅ **DOM-Based Solving**: Reads fraction problems directly from the page elements (no Vision API required).
- 🧮 **Fraction Logic**: Uses `fraction.min.js` for robust arithmetic and automatic fraction simplification.
- ⌨️ **Keyboard Simulation**: Simulates mouse events on the game's on-screen keyboard to input answers.
- ⚡ **High Performance**: Polling every 700ms for rapid response times.
- 🔄 **Auto-Resume**: Remembers your bot state across page refreshes.
- 🎨 **Modern UI**: Sleek, glassmorphism-inspired popup with real-time activity logs.

## Installation

1.  **Download the Extension**: Ensure you have all the project files in a folder.
2.  **Open Extensions Page**: Navigate to `chrome://extensions/` in your browser.
3.  **Enable Developer Mode**: Toggle the "Developer mode" switch in the top-right corner.
4.  **Load Unpacked**: Click the **Load unpacked** button.
5.  **Select Directory**: Choose the folder containing this project: `Rocketmath automation thing`
6.  **Pin Extension**: Click the puzzle icon in Chrome and pin "Rocket Math Bot" for easy access.

## Usage

### Running the Bot

1.  Navigate to [https://play.rocketmath.com](https://play.rocketmath.com)
2.  Start an "Equivalent Fractions" level.
3.  Click the extension icon in your toolbar.
4.  Click **Start Bot**.
5.  The bot will automatically read the fractions, simplify them, and click the numbers on the on-screen keypad.

### Stopping the Bot

- Open the popup again and click **Stop Bot**.

## How It Works

1.  **DOM Inspection**: The extension monitors the page for the `playing-screen` and specifically the `.problem-details-equivalent-fractions` container.
2.  **Data Extraction**: It reads the numerator and denominator from the game elements.
3.  **Simplification**: It uses the `Fraction.js` library to find the simplest form of the displayed fraction.
4.  **Keypad Simulation**: It triggers `mousedown`, `mouseup`, and `click` events on the specific on-screen buttons (e.g., `#number_5`, `#enter`) to mimic human input.
5.  **State Management**: Uses `chrome.storage.local` to track if the bot should be running, allowing it to survive tab reloads.

## Technical Details

### File Structure

```
Rocketmath automation thing/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html            # Popup UI (Vanilla HTML)
├── popup.js              # Popup controller logic
├── styles.css            # Modern CSS styling 
├── content.js            # Main automation script (DOM logic)
├── background.js         # Service worker for state handling
├── fraction.min.js       # Mathematical utility library
├── icon16.png            # 16x16 icon
├── icon48.png            # 48x48 icon
├── icon128.png           # 128x128 icon
└── README.md             # This file
```

### Permissions

-   `activeTab`: Access to the current tab when extension is clicked.
-   `storage`: Store bot state.
-   `host_permissions`: Access to `play.rocketmath.com`.

## Troubleshooting

-   **Bot Not Starting**: Ensure you are on an active "Equivalent Fractions" level.
-   **Wrong Answers**: The bot simplifies fractions to their lowest terms (e.g., 2/4 becomes 1/2). Ensure the game expects simplified fractions at your current level.
-   **Button Not Found**: If the game UI changes, the selectors in `content.js` might need updating.

## Safety & Disclaimer

⚠️ **Use at your own risk**: This bot automates gameplay. Extensive use of automation may be detectable by the site and could potentially violate their terms of service.

## License

MIT License - Feel free to modify and use as needed!

## Credits

-   Built with Chrome Extension Manifest V3
-   Math logic powered by [Fraction.js](https://github.com/infusion/Fraction.js/)
-   Iconography generated for Rocket Math branding.


