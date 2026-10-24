# EISENTODO - Eisenhower Matrix Todo App

Stop trying to figure out what the fuck you need to do. Own your time.

![EISEN Todo App](https://github.com/user-attachments/assets/8d5d16a0-26fe-40b2-b369-94bb616b16ed)

## ✨ Features

### 🎯 Eisenhower Matrix Framework
- **DO FIRST** (Urgent + Important) - Critical tasks requiring immediate attention
- **SCHEDULE** (Not Urgent + Important) - Long-term strategic work
- **DELEGATE** (Urgent + Not Important) - Tasks to assign to others
- **ELIMINATE** (Not Urgent + Not Important) - Time-wasters to avoid

### 📋 Task Management
- **Create, Edit, Delete** - Full CRUD operations for tasks
- **Task Status System** - Three states: TODO → IN PROGRESS → DONE
- **Smart Status Progression** - Click START to begin, COMPLETE to finish
- **Status Reversion** - Revert tasks back to previous states

### 🏷️ Organization
- **Search** - For when you have too many things on your plate
- **Tags** - Add multiple tags to categorize tasks
- **Tag Filtering** - Click any tag to filter tasks across all quadrants
- **Links** - Attach URLs to tasks (open in new windows)
- **Archive View** - Completed tasks are moved to a separate archive

### 💾 Data Persistence
- **localStorage** - All data persists in browser storage
- **Auto-Save** - Every action automatically saves
- **Survives Reloads** - Tasks, tags, status, and theme all persist

### 🎨 Design
- **Neo-Brutalist Aesthetic** - Bold colors, thick borders, dramatic shadows
- **Dark/Light Themes** - Toggle between modes with persistent preference
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Distinctive Typography** - Space Mono + Work Sans font pairing
- **Color-Coded Quadrants** - Each quadrant has a unique accent color

## 🚀 Getting Started locally

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mbianchidev/eisen-todo.git
cd eisen-todo
```

2. Select the [Node.js version pinned in `.nvmrc`](docs/ci.md#local-validation), then install the local tools and start the server:
```bash
npm ci
npm start
```

3. Open the URL printed by the server, normally `http://localhost:3000`.

### No Build Required
The app is vanilla JavaScript and needs no build step. Node.js is only used for
the local static server and test tooling. You can also open `src/index.html`
directly without installing dependencies.

See [CI and deployment](docs/ci.md) for security checks, Pages triggers, and local validation.

## 📖 Usage Guide

### Creating Tasks

1. Just write in any of the quadrants
2. Fill in the task description
3. Select the appropriate quadrant
4. Add tags `#work, #meeting`
5. Add links `https://github.com, https://docs.com`
6. Save the task

### For all the rest

It's so simple, just use it.


## 🏗️ Architecture

This is no building bro, just plain html, js and CSS.

## 🎨 Design System

### Color Palette
- **Electric Blue** (#0066FF) - Primary brand color
- **Hot Pink** (#FF006E) - Urgent/Important quadrant
- **Acid Yellow** (#FFBE0B) - Delegate quadrant
- **Cyber Cyan** (#00F5FF) - Accents and dark mode shadows
- **Purple** (#8338EC) - Eliminate quadrant

### Typography
- **Space Mono** - Headings, labels, and monospace elements
- **Work Sans** - Body text and UI elements

### Spacing
- Uses a consistent 4px base unit
- Generous padding for Neo-Brutalist aesthetic
- Bold borders (2px, 3px, 4px thickness)

## 🔒 Security Features

- **XSS Prevention** - All user input is HTML-escaped
- **Safe Links** - External links use `rel="noopener noreferrer"`
- **Client-Side Only** - No server communication, data stays local

## 🌐 Browser Support

Just use any chromium browser already, and keep it updated. No Edge pls.

Requires support for:
- CSS Grid and Flexbox
- CSS Custom Properties
- ES6+ JavaScript (Classes, Arrow Functions, Template Literals)
- localStorage API

## 🤝 Contributing

Contributions are welcome! But since I am lazy to review stuff you can just fork it and do it yourself lol.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by my managers giving me too much work

## 📧 Contact

For questions, feedback, or suggestions, please open an issue on GitHub and be patient, this is a hobby project.
