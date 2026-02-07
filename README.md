# Priority Matrix - Eisenhower Todo Application

A production-ready todo list application built with the Eisenhower Matrix methodology, featuring a distinctive editorial-brutalist design aesthetic.

![Light Mode](https://github.com/user-attachments/assets/f57b4ee6-1e07-439d-a002-9b07d6e0f5e1)
![Dark Mode](https://github.com/user-attachments/assets/3ddce9d7-9fef-4754-bf90-300f7876898a)

## Features

### Core Functionality
- **Eisenhower Matrix Layout**: Four quadrants organizing tasks by urgency and importance
  - Do First (Urgent & Important)
  - Schedule (Not Urgent & Important)
  - Delegate (Urgent & Not Important)
  - Eliminate (Not Urgent & Not Important)

### Task Management
- Create tasks with rich descriptions, labels, and URL references
- Three workflow stages: To Do → In Progress → Done
- Drag and drop tasks between quadrants
- Color-coded labels for easy categorization
- Clickable links that open in new tabs
- Delete tasks with confirmation

### Advanced Features
- **Label Filtering**: Filter tasks by labels across all quadrants
- **Archive System**: Completed tasks automatically move to a dedicated archive page
- **Dark/Light Mode**: Toggle between themes with preference persistence
- **LocalStorage Persistence**: All data saved locally in the browser
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## Design Philosophy

This application features an editorial-brutalist design aesthetic that combines:
- **Typography**: Crimson Pro serif for headings, Work Sans for body text
- **Color Palette**: Refined earth tones with bold accent colors
- **Layout**: Strong borders, clear hierarchy, and generous spacing
- **Interactions**: Subtle hover states with transform effects
- **Theme Support**: Carefully crafted light and dark modes

## Technical Stack

- **Pure HTML5**: Semantic markup with accessibility in mind
- **CSS3**: Custom properties for theming, modern layout techniques
- **Vanilla JavaScript**: No frameworks, fully original implementation
- **LocalStorage API**: Client-side data persistence
- **Drag and Drop API**: Native browser drag-and-drop functionality

## Architecture

### Custom Implementations
- **StorageVault**: Custom key encoding and data persistence layer
- **WorkItemFactory**: Unique ID generation using timestamp + random hybrid
- **ApplicationState**: Observer pattern for reactive updates
- **ComponentRenderer**: Dynamic DOM construction with label color assignment
- **MatrixController**: Main application orchestration
- **ArchiveController**: Dedicated archive page management

### Data Structure
Each task (work item) contains:
- `identifier`: Unique generated ID
- `content`: Task description
- `categoryLabels`: Array of labels
- `urlReferences`: Array of URLs
- `priorityZone`: Quadrant assignment
- `workflowStage`: Current status (pending/active/finished)
- `birthTimestamp`: Creation time
- `completionTimestamp`: Completion time (archived tasks only)

## Getting Started

### Quick Start
1. Clone the repository
2. Open `index.html` in a modern web browser
3. Start organizing your tasks!

No build process, no dependencies, no installation required.

### Usage
1. Click "New Task" to create your first task
2. Fill in the task details and select the appropriate quadrant
3. Use the cycle button to change task status
4. Drag tasks between quadrants to reorganize
5. Click the archive icon to view completed tasks

### Label Filtering
- Click any label chip in the filter bar to show only tasks with that label
- Click "All" to show all tasks
- Filters work across all quadrants simultaneously

## Browser Compatibility

Tested and working in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires support for CSS Grid, Flexbox, Custom Properties, LocalStorage, and ES6+.

## Customization

### Changing Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --accent-crimson: #c41e3a;
    --accent-forest: #2d5016;
    --accent-amber: #d4a017;
    --accent-navy: #1e3a5f;
}
```

### Modifying Typography
Update font imports and variables:
```css
:root {
    --font-serif: 'Crimson Pro', Georgia, serif;
    --font-sans: 'Work Sans', 'Helvetica Neue', sans-serif;
}
```

## License

This is a demonstration project created as a unique implementation of the Eisenhower Matrix methodology
