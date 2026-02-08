# Quest Task Manager

A flexible, reusable task and quest management widget for web applications.

## Features

- ✅ Create and manage quests
- ✅ Add tasks with deadlines and quest assignments
- ✅ Visual progress tracking with colored progress bars
- ✅ Task completion tracking
- ✅ Data persistence (localStorage)
- ✅ Import/Export functionality
- ✅ Responsive design
- ✅ Configurable options
- ✅ Event callbacks for integration
- ✅ Programmatic API

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="styles/quest-task-manager.css">
</head>
<body>
    <div id="my-quest-manager"></div>
    
    <script src="src/quest-task-manager.js"></script>
    <script>
        const questManager = new QuestTaskManager();
        questManager.init('#my-quest-manager');
    </script>
</body>
</html>
```

### Advanced Configuration

```javascript
const questManager = new QuestTaskManager({
    containerId: 'my-quest-manager',
    enableSave: true,
    enableLoad: true,
    autoSave: true,
    showQuestColors: true,
    showDeadlines: true,
    showOverdueWarnings: true,
    storageKey: 'myAppQuests',
    
    // Event callbacks
    onQuestAdded: (quest) => console.log('Quest added:', quest),
    onTaskAdded: (task) => console.log('Task added:', task),
    onTaskCompleted: (task) => console.log('Task completed:', task),
    onDataSaved: (data) => console.log('Data saved:', data),
    onDataLoaded: (data) => console.log('Data loaded:', data)
});

questManager.init('#my-container');
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | string | 'quest-task-manager' | ID for the main container |
| `enableSave` | boolean | true | Enable save/export functionality |
| `enableLoad` | boolean | true | Enable load/import functionality |
| `autoSave` | boolean | true | Automatically save to localStorage |
| `showQuestColors` | boolean | true | Show colored progress bars |
| `showDeadlines` | boolean | true | Show deadline inputs and displays |
| `showOverdueWarnings` | boolean | true | Highlight overdue tasks |
| `storageKey` | string | 'questTaskManager' | localStorage key |
| `questColors` | array | [...] | Array of CSS classes for quest colors |
| `cssClasses` | object | {...} | Custom CSS class mappings |

## Programmatic API

### Adding Quests and Tasks

```javascript
// Add a quest programmatically
const quest = questManager.addQuestProgrammatically('My New Quest');

// Add a task programmatically
const task = questManager.addTaskProgrammatically(
    'Task Name', 
    quest.id, 
    '2026-02-15' // deadline (optional)
);
```

### Data Management

```javascript
// Get all data
const data = questManager.getData();

// Set data
questManager.setData({
    quests: [...],
    tasks: [...],
    lastSelectedQuest: 'quest-id'
});

// Save to localStorage
questManager.saveToStorage();

// Load from localStorage
questManager.loadFromStorage();
```

### Cleanup

```javascript
// Destroy the widget
questManager.destroy();
```

## CSS Customization

The widget uses CSS custom properties and scoped classes with the `qtm-` prefix. You can override styles:

```css
.qtm-container {
    /* Override container styles */
    max-width: 800px;
}

.qtm-quest-item {
    /* Override quest item styles */
    border-radius: 12px;
}

.qtm-button {
    /* Override button styles */
    background: linear-gradient(45deg, #your-color, #your-other-color);
}
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';

function QuestManager() {
    const containerRef = useRef(null);
    const managerRef = useRef(null);
    
    useEffect(() => {
        const QuestTaskManager = window.QuestTaskManager;
        managerRef.current = new QuestTaskManager({
            onTaskCompleted: (task) => {
                // Handle task completion in React
                console.log('Task completed:', task);
            }
        });
        
        managerRef.current.init(containerRef.current);
        
        return () => {
            managerRef.current?.destroy();
        };
    }, []);
    
    return <div ref={containerRef}></div>;
}
```

### Vue Integration

```vue
<template>
    <div ref="questContainer"></div>
</template>

<script>
export default {
    mounted() {
        this.questManager = new QuestTaskManager({
            onQuestAdded: this.handleQuestAdded
        });
        this.questManager.init(this.$refs.questContainer);
    },
    
    beforeDestroy() {
        this.questManager?.destroy();
    },
    
    methods: {
        handleQuestAdded(quest) {
            this.$emit('quest-added', quest);
        }
    }
};
</script>
```

## Module Systems

The package supports multiple module systems:

### ES6 Modules
```javascript
import QuestTaskManager from './src/quest-task-manager.js';
```

### CommonJS
```javascript
const QuestTaskManager = require('./src/quest-task-manager.js');
```

### AMD
```javascript
define(['./src/quest-task-manager'], function(QuestTaskManager) {
    // Use QuestTaskManager
});
```

### Global (Browser)
```javascript
// QuestTaskManager is available globally
const manager = new QuestTaskManager();
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development with watch
npm run dev

# Serve demo
npm run serve
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release
- Core quest and task management
- Data persistence
- Responsive design
- Programmatic API
- Event callbacks