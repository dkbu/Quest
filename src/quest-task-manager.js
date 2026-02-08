/**
 * QuestTaskManager - A flexible task and quest management widget
 * @version 1.0.0
 * @author Your Name
 * @license MIT
 */

class QuestTaskManager {
    constructor(options = {}) {
        // Default configuration
        this.config = {
            containerId: 'quest-task-manager',
            enableSave: true,
            enableLoad: true,
            autoSave: true,
            showQuestColors: true,
            showDeadlines: true,
            showOverdueWarnings: true,
            storageKey: 'questTaskManager',
            questColors: [
                'quest-color-0', 'quest-color-1', 'quest-color-2', 'quest-color-3',
                'quest-color-4', 'quest-color-5', 'quest-color-6', 'quest-color-7'
            ],
            cssClasses: {
                container: 'qtm-container',
                questItem: 'qtm-quest-item',
                taskItem: 'qtm-task-item',
                progressBar: 'qtm-progress-bar',
                form: 'qtm-form',
                button: 'qtm-button'
            },
            ...options
        };

        this.quests = [];
        this.tasks = [];
        this.lastSelectedQuest = null;
        this.container = null;
        this.callbacks = {
            onQuestAdded: options.onQuestAdded || (() => {}),
            onTaskAdded: options.onTaskAdded || (() => {}),
            onTaskCompleted: options.onTaskCompleted || (() => {}),
            onDataSaved: options.onDataSaved || (() => {}),
            onDataLoaded: options.onDataLoaded || (() => {})
        };
    }

    /**
     * Initialize the widget in a container
     * @param {string|HTMLElement} container - Container element or selector
     */
    init(container) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) || document.getElementById(container)
            : container;

        if (!this.container) {
            throw new Error(`Container not found: ${container}`);
        }

        this.render();
        this.setupEventListeners();
        this.loadFromStorage();
        this.renderAll();
        this.setDefaultTaskValues();

        // Auto-save functionality
        if (this.config.autoSave) {
            setInterval(() => this.saveToStorage(), 30000); // Auto-save every 30 seconds
        }
    }

    /**
     * Render the main HTML structure
     */
    render() {
        const saveLoadSection = this.config.enableSave || this.config.enableLoad ? `
            <section class="${this.config.cssClasses.form} qtm-save-load-section">
                ${this.config.enableSave ? `<button id="qtm-save-btn" class="${this.config.cssClasses.button}">Save Data</button>` : ''}
                ${this.config.enableLoad ? `<button id="qtm-load-btn" class="${this.config.cssClasses.button}">Load Data</button>` : ''}
            </section>
        ` : '';

        this.container.innerHTML = `
            <div class="${this.config.cssClasses.container}">
                <section class="${this.config.cssClasses.form} qtm-quest-section">
                    <h2>Add New Quest</h2>
                    <form id="qtm-quest-form">
                        <div class="qtm-form-group">
                            <label for="qtm-quest-name">Quest Name:</label>
                            <input type="text" id="qtm-quest-name" required>
                            <button type="submit" class="${this.config.cssClasses.button}">Add Quest</button>
                        </div>
                    </form>
                </section>

                <section class="${this.config.cssClasses.form} qtm-task-section">
                    <h2>Add New Task</h2>
                    <form id="qtm-task-form">
                        <div class="qtm-form-group">
                            <label for="qtm-task-name">Task Name:</label>
                            <input type="text" id="qtm-task-name" required>
                        </div>
                        ${this.config.showDeadlines ? `
                        <div class="qtm-form-group">
                            <label for="qtm-task-deadline">Deadline:</label>
                            <input type="date" id="qtm-task-deadline" required>
                        </div>
                        ` : ''}
                        <div class="qtm-form-group">
                            <label for="qtm-task-quest">Quest:</label>
                            <select id="qtm-task-quest" required>
                                <option value="">Select a quest...</option>
                            </select>
                        </div>
                        <button type="submit" class="${this.config.cssClasses.button}">Add Task</button>
                    </form>
                </section>

                ${saveLoadSection}

                <section class="qtm-quests-display">
                    <h2>Quests Overview</h2>
                    <div id="qtm-quests-container"></div>
                </section>

                <section class="qtm-tasks-display">
                    <h2>All Tasks</h2>
                    <div id="qtm-tasks-container"></div>
                </section>
            </div>
        `;
    }

    setupEventListeners() {
        // Quest form submission
        this.container.querySelector('#qtm-quest-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuest();
        });

        // Task form submission
        this.container.querySelector('#qtm-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Save and Load buttons (if enabled)
        if (this.config.enableSave) {
            const saveBtn = this.container.querySelector('#qtm-save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.exportData();
                    this.showMessage('Data saved successfully!', 'success');
                    this.callbacks.onDataSaved(this.getData());
                });
            }
        }

        if (this.config.enableLoad) {
            const loadBtn = this.container.querySelector('#qtm-load-btn');
            if (loadBtn) {
                loadBtn.addEventListener('click', () => {
                    this.importData();
                    this.renderAll();
                    this.showMessage('Data loaded successfully!', 'success');
                    this.callbacks.onDataLoaded(this.getData());
                });
            }
        }
    }

    // Quest Management
    addQuest() {
        const questNameInput = this.container.querySelector('#qtm-quest-name');
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
            colorClass: this.config.questColors[this.quests.length % this.config.questColors.length]
        };

        this.quests.push(quest);
        questNameInput.value = '';
        this.updateQuestDropdown();
        this.renderQuests();
        this.showMessage(`Quest "${questName}" added successfully!`, 'success');
        this.callbacks.onQuestAdded(quest);
        
        if (this.config.autoSave) this.saveToStorage();
    }

    updateQuestDropdown() {
        const questSelect = this.container.querySelector('#qtm-task-quest');
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
        const taskNameInput = this.container.querySelector('#qtm-task-name');
        const taskDeadlineInput = this.container.querySelector('#qtm-task-deadline');
        const taskQuestSelect = this.container.querySelector('#qtm-task-quest');

        const taskName = taskNameInput.value.trim();
        const taskDeadline = this.config.showDeadlines ? taskDeadlineInput?.value : new Date().toISOString().split('T')[0];
        const questId = taskQuestSelect.value;

        const requiredFields = [taskName, questId];
        if (this.config.showDeadlines) requiredFields.push(taskDeadline);

        if (requiredFields.some(field => !field)) {
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
        this.callbacks.onTaskAdded(task);
        
        if (this.config.autoSave) this.saveToStorage();
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.renderAll();
            const status = task.completed ? 'completed' : 'marked as incomplete';
            this.showMessage(`Task "${task.name}" ${status}`, 'success');
            this.callbacks.onTaskCompleted(task);
            
            if (this.config.autoSave) this.saveToStorage();
        }
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const taskName = this.tasks[taskIndex].name;
            this.tasks.splice(taskIndex, 1);
            this.renderAll();
            this.showMessage(`Task "${taskName}" deleted`, 'success');
            
            if (this.config.autoSave) this.saveToStorage();
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
            
            if (this.config.autoSave) this.saveToStorage();
        }
    }

    // Set default values for task form
    setDefaultTaskValues() {
        if (this.config.showDeadlines) {
            const taskDeadlineInput = this.container.querySelector('#qtm-task-deadline');
            const today = new Date().toISOString().split('T')[0];
            taskDeadlineInput.value = today;
        }
        
        const taskQuestSelect = this.container.querySelector('#qtm-task-quest');
        if (this.lastSelectedQuest && this.quests.find(q => q.id === this.lastSelectedQuest)) {
            taskQuestSelect.value = this.lastSelectedQuest;
        }
    }

    // Rendering Methods
    renderAll() {
        this.renderQuests();
        this.renderTasks();
    }

    renderQuests() {
        const questsContainer = this.container.querySelector('#qtm-quests-container');
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
            questElement.className = `${this.config.cssClasses.questItem} qtm-quest-item`;
            questElement.innerHTML = `
                <div class="qtm-quest-header">
                    <div class="qtm-quest-name">${this.escapeHtml(quest.name)}</div>
                    <div class="qtm-quest-stats">${completedTasks.length}/${questTasks.length} tasks completed</div>
                    <button class="qtm-delete-btn" onclick="window.questManager.deleteQuest('${quest.id}')">Delete Quest</button>
                </div>
                <div class="qtm-progress-bar-container">
                    <div class="${this.config.cssClasses.progressBar} qtm-progress-bar ${this.config.showQuestColors ? quest.colorClass : ''}" style="width: ${completionPercentage}%">
                        ${completionPercentage}%
                    </div>
                </div>
            `;

            questsContainer.appendChild(questElement);
        });
    }

    renderTasks() {
        const tasksContainer = this.container.querySelector('#qtm-tasks-container');
        tasksContainer.innerHTML = '';

        if (this.tasks.length === 0) {
            tasksContainer.innerHTML = '<p style="text-align: center; color: #888;">No tasks created yet. Add your first task above!</p>';
            return;
        }

        // Sort tasks by deadline and completion status
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(a.deadline) - new Date(b.deadline);
        });

        sortedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `${this.config.cssClasses.taskItem} qtm-task-item ${task.completed ? 'completed' : ''}`;
            
            const deadlineHtml = this.config.showDeadlines ? this.formatDeadlineHtml(task.deadline, task.completed) : '';

            taskElement.innerHTML = `
                <div class="qtm-task-header">
                    <div class="qtm-task-name ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.name)}</div>
                    <div class="qtm-task-controls">
                        <button class="qtm-complete-btn" onclick="window.questManager.toggleTaskCompletion('${task.id}')">
                            ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </button>
                        <button class="qtm-delete-btn" onclick="window.questManager.deleteTask('${task.id}')">Delete</button>
                    </div>
                </div>
                <div class="qtm-task-details">
                    ${deadlineHtml}
                    <span class="qtm-task-quest">Quest: ${this.escapeHtml(task.questName)}</span>
                </div>
            `;

            tasksContainer.appendChild(taskElement);
        });
    }

    formatDeadlineHtml(deadline, isCompleted) {
        if (!this.config.showDeadlines) return '';
        
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const isOverdue = deadlineDate < today && !isCompleted;
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const formatted = deadlineDate.toLocaleDateString(undefined, options);
        
        const classes = ['qtm-task-deadline'];
        if (isOverdue && this.config.showOverdueWarnings) {
            classes.push('overdue');
        }
        
        const icon = isOverdue ? '⚠️' : '📅';
        const overdueText = isOverdue ? ' (Overdue)' : '';
        
        return `<span class="${classes.join(' ')}">${icon} ${formatted}${overdueText}</span>`;
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        // Remove any existing message
        const existingMessage = this.container.querySelector('.qtm-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `qtm-message ${type}`;
        messageElement.textContent = message;

        const mainContent = this.container.querySelector(`.${this.config.cssClasses.container}`);
        mainContent.insertBefore(messageElement, mainContent.firstChild);

        // Auto-remove message after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    // Data Management
    getData() {
        return {
            quests: this.quests,
            tasks: this.tasks,
            lastSelectedQuest: this.lastSelectedQuest
        };
    }

    setData(data) {
        this.quests = data.quests || [];
        this.tasks = data.tasks || [];
        this.lastSelectedQuest = data.lastSelectedQuest || null;
        this.updateQuestDropdown();
        this.renderAll();
        this.setDefaultTaskValues();
    }

    saveToStorage() {
        if (!this.config.enableSave) return;
        
        try {
            const data = {
                ...this.getData(),
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.config.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showMessage('Error saving data', 'error');
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.config.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.setData(parsed);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.showMessage('Error loading saved data', 'error');
        }
    }

    exportData() {
        const data = {
            ...this.getData(),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `quest-task-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.setData(data);
                    this.saveToStorage();
                    this.showMessage('Data imported successfully!', 'success');
                } catch (error) {
                    console.error('Error importing data:', error);
                    this.showMessage('Error importing data', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Public API Methods
    addQuestProgrammatically(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('Quest name must be a non-empty string');
        }
        
        const quest = {
            id: Date.now().toString(),
            name: name.trim(),
            colorClass: this.config.questColors[this.quests.length % this.config.questColors.length]
        };
        
        this.quests.push(quest);
        this.updateQuestDropdown();
        this.renderQuests();
        return quest;
    }

    addTaskProgrammatically(name, questId, deadline) {
        if (!name || !questId) {
            throw new Error('Task name and quest ID are required');
        }
        
        const quest = this.quests.find(q => q.id === questId);
        if (!quest) {
            throw new Error('Quest not found');
        }
        
        const task = {
            id: Date.now().toString(),
            name: name.trim(),
            deadline: deadline || new Date().toISOString().split('T')[0],
            questId: questId,
            questName: quest.name,
            completed: false
        };
        
        this.tasks.push(task);
        this.renderAll();
        return task;
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestTaskManager;
} else if (typeof define === 'function' && define.amd) {
    define(() => QuestTaskManager);
} else {
    window.QuestTaskManager = QuestTaskManager;
}