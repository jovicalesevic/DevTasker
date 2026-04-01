# DevTasker

A lightweight, browser-based task manager with a dark-themed UI. Add tasks with priorities, track completion with a live progress bar, and keep everything on your device—no backend required.

## Features

- **localStorage persistence** — Tasks are saved in the browser under the key `devtasker_tasks`, so your list survives refresh and new sessions on the same origin.
- **Progress bar** — The header shows completion as a percentage and a `completed / total` counter, updated whenever you finish or remove tasks.
- **Priority levels** — Each task can be marked as urgent, important, or “can wait,” with clear visual labels.
- **Dark mode UI** — Glass-style panels, gradient accents, and a layout tuned for readability in low light.
- **Core task flow** — Add tasks, toggle completion, and delete with a short removal animation; empty state when there are no tasks.
- **Responsive layout** — Works on narrow viewports and respects safe areas for mobile browsers.

## Tech Stack

| Layer   | Technology |
|--------|------------|
| Markup | HTML5      |
| Styles | CSS3 (custom properties, flexbox, backdrop blur) |
| Logic  | Vanilla JavaScript (ES6+) |

Fonts: [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts.

## Live Demo

**[Open DevTasker](https://jovicalesevic.github.io/DevTasker/)**

## Installation

No build step or package manager is required.

1. Clone the repository:

   ```bash
   git clone https://github.com/jovicalesevic/DevTasker.git
   cd DevTasker
   ```

2. Open `index.html` in your browser (double-click the file, or use a local static server if you prefer).

## License

This project is licensed under the [MIT License](LICENSE).

## Author

**Jovica Lešević**
