# EISEN - Eisenhower Matrix Todo App

A bold, Neo-Brutalist todo application built on the Eisenhower Matrix productivity framework. Organize your tasks by urgency and importance with a distinctive, memorable design.

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

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/eisen-todo.git
cd eisen-todo
```

2. Open `index.html` in your browser, or serve with any web server:
```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8080
```

3. Navigate to `http://localhost:8080` in your browser

### No Build Required
This is a vanilla JavaScript application with no dependencies or build steps!

## 📖 Usage Guide

### Creating Tasks

1. Click **+ NEW TASK** button
2. Fill in the task description
3. Select the appropriate quadrant
4. Add tags (comma-separated): `work, urgent, meeting`
5. Add links (comma-separated): `https://github.com, https://docs.com`
6. Click **SAVE TASK**

### Managing Tasks

- **Start Working**: Click **START** to mark as IN PROGRESS
- **Complete**: Click **COMPLETE** to mark as DONE (moves to archive)
- **Revert**: Click **← REVERT** to move back to TODO state
- **Edit**: Click the **✎** (edit) icon to modify task details
- **Delete**: Click the **✕** icon to permanently remove

### Filtering Tasks

- Click any tag in the yellow filter bar to show only tasks with that tag
- Click **ALL** to show all tasks again
- Filtering works across all quadrants simultaneously

### Archive

- Click **ARCHIVE** to view completed tasks
- Use **↻ RESTORE** to bring tasks back to active state
- Delete archived tasks permanently with the **✕** icon

### Theme Toggle

- Click the **◐** icon to switch between dark and light modes
- Theme preference is saved and persists across sessions

## 🏗️ Architecture

### File Structure
```
eisen-todo/
├── index.html      # HTML structure and layout
├── styles.css      # Neo-Brutalist styling and themes
├── app.js          # Application logic and state management
└── README.md       # Documentation
```

### Technology Stack
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, grid, flexbox, animations
- **Vanilla JavaScript** - ES6+ with classes and modern syntax
- **localStorage API** - Client-side data persistence

### Key Classes

#### `EisenMatrixController`
Main application controller that manages:
- UI initialization and event binding
- Task CRUD operations
- State management and persistence
- Tag filtering logic
- Archive functionality
- Theme switching

### Data Structure

Tasks are stored in localStorage with this schema:
```javascript
{
  activeTasks: [
    {
      id: "task_1234567890_abc123",
      content: "Task description",
      quadrant: "urgent-important",
      labels: ["work", "urgent"],
      urls: ["https://example.com"],
      status: "todo", // "todo" | "in-progress" | "done"
      createdAt: "2024-01-01T00:00:00.000Z"
    }
  ],
  completedTasks: [
    {
      // Same structure as activeTasks
      completedAt: "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

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

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires support for:
- CSS Grid and Flexbox
- CSS Custom Properties
- ES6+ JavaScript (Classes, Arrow Functions, Template Literals)
- localStorage API

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the Eisenhower Matrix productivity method
- Neo-Brutalist design movement
- The productivity community

## 📧 Contact

For questions, feedback, or suggestions, please open an issue on GitHub.

---

**Made with ⚡ and bold design choices** 
