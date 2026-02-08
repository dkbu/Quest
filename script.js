// Quest and Task Manager Application
class QuestTaskManager {
    constructor() {
        this.quests = [];
        this.tasks = [];
        this.lastSelectedQuest = null;
        this.questColors = [
            'quest-color-0', 'quest-color-1', 'quest-color-2', 'quest-color-3',
            'quest-color-4', 'quest-color-5', 'quest-color-6', 'quest-color-7'
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.renderAll();
        this.setDefaultTaskValues();
    }

    setupEventListeners() {
        // Quest form submission
        document.getElementById('quest-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuest();
        });

        // Task form submission
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Save and Load buttons
        document.getElementById('save-btn').addEventListener('click', () => {
            this.exportData();
            this.showMessage('Data saved successfully!', 'success');
        });

        document.getElementById('load-btn').addEventListener('click', () => {
            this.importData();
            this.renderAll();
            this.showMessage('Data loaded successfully!', 'success');
        });
    }

    // Quest Management
    addQuest() {
        const questNameInput = document.getElementById('quest-name');
        const questName = questNameInput.value.trim();

        if (!questName) {
            this.showMessage('Please enter a quest name', 'error');
            return;
        }

        // Check for duplicate quest names
        if (this.quests.find(q => q.name.toLowerCase() === questName.toLowerCase())) {
            this.showMessage('Quest with this name already exists', 'error');
            return;
        }

        const quest = {
            id: Date.now().toString(),
            name: questName,
            colorClass: this.questColors[this.quests.length % this.questColors.length]
        };

        this.quests.push(quest);
        questNameInput.value = '';
        this.updateQuestDropdown();
        this.renderQuests();
        this.showMessage(`Quest "${questName}" added successfully!`, 'success');
    }

    updateQuestDropdown() {
        const questSelect = document.getElementById('task-quest');
        questSelect.innerHTML = '<option value="">Select a quest...</option>';

        this.quests.forEach(quest => {
            const option = document.createElement('option');
            option.value = quest.id;
            option.textContent = quest.name;
            questSelect.appendChild(option);
        });

        // Set last selected quest as default if it exists
        if (this.lastSelectedQuest) {
            questSelect.value = this.lastSelectedQuest;
        }
    }

    // Task Management
    addTask() {
        const taskNameInput = document.getElementById('task-name');
        const taskDeadlineInput = document.getElementById('task-deadline');
        const taskQuestSelect = document.getElementById('task-quest');

        const taskName = taskNameInput.value.trim();
        const taskDeadline = taskDeadlineInput.value;
        const questId = taskQuestSelect.value;

        if (!taskName || !taskDeadline || !questId) {
            this.showMessage('Please fill in all task fields', 'error');
            return;
        }

        const quest = this.quests.find(q => q.id === questId);
        if (!quest) {
            this.showMessage('Selected quest not found', 'error');
            return;
        }

        const task = {
            id: Date.now().toString(),
            name: taskName,
            deadline: taskDeadline,
            questId: questId,
            questName: quest.name,
            completed: false
        };

        this.tasks.push(task);
        
        // Remember the selected quest
        this.lastSelectedQuest = questId;
        
        // Clear form and set defaults
        taskNameInput.value = '';
        this.setDefaultTaskValues();

        this.renderAll();
        this.showMessage(`Task "${taskName}" added successfully!`, 'success');
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.renderAll();
            const status = task.completed ? 'completed' : 'marked as incomplete';
            this.showMessage(`Task "${task.name}" ${status}`, 'success');
        }
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const taskName = this.tasks[taskIndex].name;
            this.tasks.splice(taskIndex, 1);
            this.renderAll();
            this.showMessage(`Task "${taskName}" deleted`, 'success');
        }
    }

    deleteQuest(questId) {
        const questIndex = this.quests.findIndex(q => q.id === questId);
        if (questIndex !== -1) {
            const questName = this.quests[questIndex].name;
            
            // Also delete all tasks associated with this quest
            this.tasks = this.tasks.filter(t => t.questId !== questId);
            
            this.quests.splice(questIndex, 1);
            this.updateQuestDropdown();
            this.renderAll();
            this.showMessage(`Quest "${questName}" and all its tasks deleted`, 'success');
        }
    }

    // Rendering Methods
    renderAll() {
        this.renderQuests();
        this.renderTasks();
    }

    renderQuests() {
        const questsContainer = document.getElementById('quests-container');
        questsContainer.innerHTML = '';

        if (this.quests.length === 0) {
            questsContainer.innerHTML = '<p style="text-align: center; color: #888;">No quests created yet. Add your first quest above!</p>';
            return;
        }

        this.quests.forEach(quest => {
            const questTasks = this.tasks.filter(t => t.questId === quest.id);
            const completedTasks = questTasks.filter(t => t.completed);
            const completionPercentage = questTasks.length > 0 
                ? Math.round((completedTasks.length / questTasks.length) * 100) 
                : 0;

            const questElement = document.createElement('div');
            questElement.className = 'quest-item';
            questElement.innerHTML = `
                <div class="quest-header">
                    <div class="quest-name">${this.escapeHtml(quest.name)}</div>
                    <div class="quest-stats">${completedTasks.length}/${questTasks.length} tasks completed</div>
                    <button class="delete-btn" onclick="manager.deleteQuest('${quest.id}')">Delete Quest</button>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar ${quest.colorClass}" style="width: ${completionPercentage}%">
                        ${completionPercentage}%
                    </div>
                </div>
                <div class="quest-task-list">
                    ${questTasks.length === 0 ? '<em>No tasks in this quest yet</em>' : ''}
                </div>
            `;

            questsContainer.appendChild(questElement);
        });
    }

    renderTasks() {
        const tasksContainer = document.getElementById('tasks-container');
        tasksContainer.innerHTML = '';

        if (this.tasks.length === 0) {
            tasksContainer.innerHTML = '<p style="text-align: center; color: #888;">No tasks created yet. Add your first task above!</p>';
            return;
        }

        // Sort tasks by deadline and completion status
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // Incomplete tasks first
            }
            return new Date(a.deadline) - new Date(b.deadline);
        });

        sortedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            const deadlineDate = new Date(task.deadline);
            const today = new Date();
            const isOverdue = deadlineDate < today && !task.completed;
            const deadlineText = this.formatDeadline(deadlineDate, isOverdue);

            taskElement.innerHTML = `
                <div class="task-header">
                    <div class="task-name ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.name)}</div>
                    <div class="task-controls">
                        <button class="complete-btn" onclick="manager.toggleTaskCompletion('${task.id}')">
                            ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </button>
                        <button class="delete-btn" onclick="manager.deleteTask('${task.id}')">Delete</button>
                    </div>
                </div>
                <div class="task-details">
                    <span class="task-deadline ${isOverdue ? 'overdue' : ''}">${deadlineText}</span>
                    <span class="task-quest">Quest: ${this.escapeHtml(task.questName)}</span>
                </div>
            `;

            tasksContainer.appendChild(taskElement);
        });
    }

    // Set default values for task form
    setDefaultTaskValues() {
        const taskDeadlineInput = document.getElementById('task-deadline');
        const taskQuestSelect = document.getElementById('task-quest');
        
        // Set deadline to today's date
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        taskDeadlineInput.value = todayString;
        
        // Set quest to last selected if available
        if (this.lastSelectedQuest && this.quests.find(q => q.id === this.lastSelectedQuest)) {
            taskQuestSelect.value = this.lastSelectedQuest;
        }
    }

    // Utility Methods
    formatDeadline(date, isOverdue) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const formatted = date.toLocaleDateString(undefined, options);
        return isOverdue ? `⚠️ ${formatted} (Overdue)` : `📅 ${formatted}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        // Remove any existing message
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(messageElement, mainContent.firstChild);

        // Auto-remove message after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    // Data Persistence
    saveToLocalStorage() {
        try {
            const data = {
                quests: this.quests,
                tasks: this.tasks,
                lastSelectedQuest: this.lastSelectedQuest,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('questTaskManager', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showMessage('Error saving data', 'error');
        }
    }

    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('questTaskManager');
            if (data) {
                const parsed = JSON.parse(data);
                this.quests = parsed.quests || [];
                this.tasks = parsed.tasks || [];
                this.lastSelectedQuest = parsed.lastSelectedQuest || null;
                
                // Ensure quest colors are assigned if they were saved without them
                this.quests.forEach((quest, index) => {
                    if (!quest.colorClass) {
                        quest.colorClass = this.questColors[index % this.questColors.length];
                    }
                });

                this.updateQuestDropdown();
                this.setDefaultTaskValues();
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.showMessage('Error loading saved data', 'error');
        }
    }

    // Export/Import functionality (bonus features)
    exportData() {
        const data = {
            quests: this.quests,
            tasks: this.tasks,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `quest-task-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.quests && data.tasks) {
                    this.quests = data.quests;
                    this.tasks = data.tasks;
                    this.updateQuestDropdown();
                    this.renderAll();
                    this.saveToLocalStorage();
                    this.showMessage('Data imported successfully!', 'success');
                } else {
                    this.showMessage('Invalid file format', 'error');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                this.showMessage('Error importing data', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.manager = new QuestTaskManager();
});

// Add some CSS for overdue tasks
const additionalStyles = `
    .task-deadline.overdue {
        color: #d32f2f;
        font-weight: 600;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);