// Global state variables (declared early to avoid reference errors)
let answersChecked = false;
let answersVisible = false;
let storedFeedback = {};

// Question data storage (loaded from separate question files)
// Each question file in questions/ folder adds its data to window.questionData
const questionDatabase = window.questionData || {};

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

if (currentTheme === 'light') {
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    if (currentTheme === 'light') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
});

// Sidebar Toggle from Header
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const sidebarIcon = toggleSidebarBtn.querySelector('i');

// Create backdrop element
const backdrop = document.createElement('div');
backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);

toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    backdrop.classList.toggle('active', !sidebar.classList.contains('collapsed'));
    
    // Save state
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    
    // Update icon based on state
    if (sidebar.classList.contains('collapsed')) {
        sidebarIcon.classList.remove('fa-times');
        sidebarIcon.classList.add('fa-bars');
    } else {
        sidebarIcon.classList.remove('fa-bars');
        sidebarIcon.classList.add('fa-times');
    }
});

// Close sidebar when clicking backdrop
backdrop.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
    backdrop.classList.remove('active');
    sidebarIcon.classList.remove('fa-times');
    sidebarIcon.classList.add('fa-bars');
    // Save state
    localStorage.setItem('sidebarCollapsed', 'true');
});

// Problem Panel Toggle
const problemPanel = document.getElementById('problemPanel');
const closeProblemPanel = document.getElementById('closeProblemPanel');

closeProblemPanel.addEventListener('click', () => {
    problemPanel.classList.toggle('collapsed');
    // Save state
    localStorage.setItem('problemPanelCollapsed', problemPanel.classList.contains('collapsed'));
});

// Tab Switching (Editor Panel)
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Problem Panel Tab Switching
const problemTabButtons = document.querySelectorAll('.problem-tab-btn');
const problemTabContents = document.querySelectorAll('.problem-tab-content');

problemTabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-problem-tab');
        
        // Remove active class from all buttons and contents
        problemTabButtons.forEach(btn => btn.classList.remove('active'));
        problemTabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const targetContent = document.getElementById(`problemTab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Save state
        localStorage.setItem('activeProblemTab', targetTab);
    });
});

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab
        button.classList.add('active');
        document.getElementById(`${targetTab}Tab`).classList.add('active');
        
        // Save state
        localStorage.setItem('activeEditorTab', targetTab);
        
        // Show/hide question navigation based on active tab
        if (targetTab === 'questions') {
            questionNavigation.style.display = questionSections.length > 1 ? 'flex' : 'none';
        } else {
            questionNavigation.style.display = 'none';
        }
    });
});

// Question Navigation
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const questionCounter = document.getElementById('questionCounter');
const questionNavigation = document.getElementById('questionNavigation');

function updateQuestionNavigation() {
    const totalQuestions = questionSections.length;
    
    if (totalQuestions > 1) {
        questionNavigation.style.display = 'flex';
        questionCounter.textContent = `${currentQuestionIndex + 1} / ${totalQuestions}`;
        
        // Enable/disable navigation buttons
        prevQuestionBtn.disabled = currentQuestionIndex === 0;
        nextQuestionBtn.disabled = currentQuestionIndex === totalQuestions - 1;
    } else {
        questionNavigation.style.display = 'none';
    }
}

function showQuestion(index) {
    // Hide all questions
    questionSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected question
    if (questionSections[index]) {
        questionSections[index].classList.add('active');
        currentQuestionIndex = index;
        updateQuestionNavigation();
        
        // Reapply feedback visibility if answers have been checked
        if (answersChecked && currentQuestionData) {
            const questionId = currentQuestionData.questions[index]?.id;
            if (questionId && storedFeedback[questionId]) {
                const feedback = storedFeedback[questionId];
                const question = currentQuestionData.questions[index];
                
                // For text input questions, get current value
                if (question && question.type === 'text-input') {
                    const inputElement = document.getElementById(`input-${questionId}`);
                    if (inputElement) {
                        feedback.selectedAnswers = inputElement.value;
                    }
                } else if (question && question.type === 'text-input-blanks') {
                    // For fill-in-the-blank questions, get current values for all blanks
                    feedback.selectedAnswers = {};
                    question.blanks.forEach(blank => {
                        const inputElement = document.getElementById(`input-${questionId}-${blank.id}`);
                        if (inputElement) {
                            feedback.selectedAnswers[blank.id] = inputElement.value;
                        }
                    });
                } else if (question && question.type === 'drag-drop') {
                    // For drag-and-drop questions, restore dropped operators if they exist
                    feedback.selectedAnswers = {};
                    const allNodes = feedback.questionElement.querySelectorAll('.execution-node');
                    allNodes.forEach(nodeElement => {
                        const nodeId = nodeElement.getAttribute('data-node-id');
                        const dropZone = nodeElement.querySelector('.node-drop-zone');
                        if (dropZone) {
                            const operatorItem = dropZone.querySelector('.operator-item');
                            if (operatorItem) {
                                feedback.selectedAnswers[nodeId] = operatorItem.getAttribute('data-operator-id');
                            } else if (feedback.selectedAnswers && feedback.selectedAnswers[nodeId]) {
                                // Restore operator if it was previously dropped
                                const operatorId = feedback.selectedAnswers[nodeId];
                                const operator = question.operators.find(op => op.id === operatorId);
                                if (operator) {
                                    const operatorElement = document.createElement('div');
                                    operatorElement.className = 'operator-item';
                                    operatorElement.setAttribute('data-operator-id', operator.id);
                                    operatorElement.style.opacity = '1';
                                    operatorElement.style.cursor = 'default';
                                    operatorElement.draggable = false;
                                    operatorElement.innerHTML = `
                                        <span class="operator-symbol">${operator.symbol}</span>
                                        <span class="operator-name">${operator.name}</span>
                                    `;
                                    dropZone.innerHTML = '';
                                    dropZone.appendChild(operatorElement);
                                }
                            }
                        }
                    });
                }
                
                applyFeedback(
                    feedback.questionElement,
                    feedback.correctAnswers,
                    feedback.selectedAnswers,
                    answersVisible
                );
            }
        }
        
        // Reinitialize drag-and-drop if this is a drag-drop question
        const currentQuestion = currentQuestionData?.questions[index];
        if (currentQuestion && currentQuestion.type === 'drag-drop') {
            setTimeout(() => {
                initializeDragAndDrop();
            }, 50);
        }
        
        // Scroll to top of questions container
        const questionsContainer = document.querySelector('.questions-container');
        if (questionsContainer) {
            questionsContainer.scrollTop = 0;
        }
    }
}

prevQuestionBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
});

nextQuestionBtn.addEventListener('click', () => {
    if (currentQuestionIndex < questionSections.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
});

// Initialize question navigation (will be called after questions are loaded)
let questionSections = [];
let currentQuestionIndex = 0;

// Load default question on page load (wait for DOM to be ready)
document.addEventListener('DOMContentLoaded', () => {
    // Restore saved state
    const savedProblem = localStorage.getItem('lastViewedProblem') || 'game-chat';
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    const savedProblemPanelState = localStorage.getItem('problemPanelCollapsed');
    const savedEditorTab = localStorage.getItem('activeEditorTab') || 'questions';
    const savedProblemTab = localStorage.getItem('activeProblemTab') || 'description';
    
    // Restore sidebar state
    if (savedSidebarState === 'true') {
        sidebar.classList.add('collapsed');
        const sidebarIcon = toggleSidebarBtn.querySelector('i');
        if (sidebarIcon) {
            sidebarIcon.classList.remove('fa-times');
            sidebarIcon.classList.add('fa-bars');
        }
    } else {
        sidebar.classList.remove('collapsed');
    }
    
    // Restore problem panel state
    if (savedProblemPanelState === 'true') {
        problemPanel.classList.add('collapsed');
    } else {
        problemPanel.classList.remove('collapsed');
    }
    
    // Restore editor tab
    const editorTabBtn = document.querySelector(`[data-tab="${savedEditorTab}"]`);
    if (editorTabBtn) {
        editorTabBtn.click();
    }
    
    // Restore problem panel tab
    const problemTabBtn = document.querySelector(`[data-problem-tab="${savedProblemTab}"]`);
    if (problemTabBtn) {
        problemTabBtn.click();
    }
    
    // Restore active problem item (need to wait for DOM to be ready)
    setTimeout(() => {
        const savedProblemItem = document.querySelector(`[data-question-file="${savedProblem}"]`);
        if (savedProblemItem) {
            const allProblemItems = document.querySelectorAll('.problem-item');
            allProblemItems.forEach(i => i.classList.remove('active'));
            savedProblemItem.classList.add('active');
        }
    }, 100);
    
    // Load the saved problem
    loadQuestion(savedProblem).then(() => {
        questionSections = document.querySelectorAll('.question-section');
        if (questionSections.length > 0) {
            updateQuestionNavigation();
        }
    }).catch(error => {
        console.error('Failed to load saved question, loading default:', error);
        // Fallback to default
        loadQuestion('game-chat').then(() => {
            questionSections = document.querySelectorAll('.question-section');
            if (questionSections.length > 0) {
                updateQuestionNavigation();
            }
        });
    });
});

// Problem Navigation
const problemItems = document.querySelectorAll('.problem-item');

problemItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        problemItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Show problem panel if collapsed
        if (problemPanel.classList.contains('collapsed')) {
            problemPanel.classList.remove('collapsed');
        }
        
        // Load the question
        const questionFile = item.getAttribute('data-question-file');
        if (questionFile) {
            // Save to localStorage
            localStorage.setItem('lastViewedProblem', questionFile);
            
            // Reset answer state when switching questions
            answersChecked = false;
            answersVisible = false;
            storedFeedback = {};
            if (toggleAnswersBtn) {
                toggleAnswersBtn.style.display = 'none';
            }
            
            loadQuestion(questionFile);
        }
    });
});

// Answer Checking System
const submitBtn = document.getElementById('submitBtn');
const resultsContent = document.getElementById('resultsContent');
const resultsStatus = document.getElementById('resultsStatus');
const toggleAnswersBtn = document.getElementById('toggleAnswersBtn');
const toggleAnswersText = document.getElementById('toggleAnswersText');

// Verify elements exist
if (!submitBtn) {
    console.error('Submit button not found!');
}
if (!resultsContent) {
    console.error('Results content not found!');
}
if (!resultsStatus) {
    console.error('Results status not found!');
}

// Track answer checking state (already declared at top of file)

// Current question data
let currentQuestionData = null;
let correctAnswers = {};

// Load question data from separate JS files or JSON (with server)
async function loadQuestion(questionId) {
    try {
        // First try to load from question JS files (loaded via script tags)
        if (questionDatabase[questionId]) {
            currentQuestionData = questionDatabase[questionId];
            renderQuestion(currentQuestionData);
            return currentQuestionData;
        }
        
        // If not in JS files, try to fetch from JSON file (requires local server)
        const response = await fetch(`questions/${questionId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load question: ${response.statusText}`);
        }
        const data = await response.json();
        // Add to questionDatabase for caching
        questionDatabase[questionId] = data;
        currentQuestionData = data;
        renderQuestion(data);
        return data;
    } catch (error) {
        console.error('Error loading question:', error);
        console.log('Note: Question files should be loaded via script tags in index.html');
        
        // Try to use questionDatabase as fallback
        if (questionDatabase[questionId]) {
            currentQuestionData = questionDatabase[questionId];
            renderQuestion(currentQuestionData);
            return currentQuestionData;
        }
        
        alert(`Failed to load question: ${questionId}. Please check that the question file exists in the questions/ folder.`);
    }
}

// Render problem description and schema
function renderQuestion(data) {
    if (!data) {
        console.error('No data provided to renderQuestion');
        return;
    }
    
    // Update title and metadata
    const problemTitle = document.getElementById('problemTitle');
    const difficultyBadge = document.getElementById('difficultyBadge');
    if (problemTitle) {
        problemTitle.textContent = data.title;
    }
    if (difficultyBadge) {
        const difficultyText = difficultyBadge.querySelector('.difficulty-text');
        if (difficultyText) {
            difficultyText.textContent = `${data.points}pt`;
        }
    }
    
    // Render description
    const problemDesc = document.getElementById('problemDescription');
    if (problemDesc) {
        problemDesc.innerHTML = `
            <p>${data.description}</p>
            <p style="margin-top: 16px;"><strong>The company stores information in the following relations:</strong></p>
            <ul style="margin-top: 8px; margin-left: 20px;">
                ${data.relations.map(rel => `<li><code>${rel}</code></li>`).join('')}
            </ul>
        `;
    }
    
    // Render schema
    const schemaCode = document.getElementById('schemaCode');
    if (schemaCode) {
        const schemaText = Object.values(data.schema).join('\n\n');
        schemaCode.textContent = schemaText;
    }
    
    // Render question context in left panel
    const problemQuestionContext = document.getElementById('problemQuestionContext');
    if (problemQuestionContext) {
        let contextHtml = '<p><strong>Question Context:</strong></p>';
        
        if (data.questionContextImage) {
            contextHtml += `<img src="${data.questionContextImage}" alt="Question Context" class="question-context-image" />`;
        }
        
        if (data.questionContext) {
            // Convert markdown-style code blocks to HTML
            let contextText = data.questionContext;
            const codeBlockRegex = /```sql\n([\s\S]*?)```/g;
            const codeBlocks = [];
            let match;
            let lastIndex = 0;
            let processedText = '';
            
            // Extract code blocks and replace with placeholders
            while ((match = codeBlockRegex.exec(contextText)) !== null) {
                codeBlocks.push(match[1]);
                processedText += contextText.substring(lastIndex, match.index) + `__CODEBLOCK_${codeBlocks.length - 1}__`;
                lastIndex = match.index + match[0].length;
            }
            processedText += contextText.substring(lastIndex);
            
            // Split by double newlines to create paragraphs
            const paragraphs = processedText.split(/\n\n+/);
            paragraphs.forEach(para => {
                if (para.trim()) {
                    // Replace code block placeholders
                    para = para.replace(/__CODEBLOCK_(\d+)__/g, (_, index) => {
                        return `<pre class="sql-code-block"><code>${codeBlocks[parseInt(index)].trim()}</code></pre>`;
                    });
                    // Replace single newlines with <br> for non-code content
                    para = para.replace(/\n/g, '<br>');
                    contextHtml += `<p>${para}</p>`;
                }
            });
        }
        
        problemQuestionContext.innerHTML = contextHtml || '';
    }
    
    // Check if this is a SQL execution question set
    const hasSQLQuestions = data.questions && data.questions.some(q => q.type === 'sql-execution');
    
    // Show/hide test cases tab based on question type (only in editor panel, not problem panel)
    const editorTestCasesTab = document.getElementById('editorTestCasesTab');
    if (hasSQLQuestions) {
        if (editorTestCasesTab) editorTestCasesTab.style.display = 'inline-flex';
    } else {
        if (editorTestCasesTab) editorTestCasesTab.style.display = 'none';
    }
    
    // Render questions
    renderQuestions(data);
    
    // Update correct answers for checking
    if (data.questions) {
        updateCorrectAnswers(data.questions);
    }
}

// Load test cases from JSON file
async function loadTestCases(questionId) {
    try {
        const response = await fetch(`questions/sql-review/test-cases/test-cases.json`);
        if (!response.ok) {
            throw new Error(`Failed to load test cases: ${response.statusText}`);
        }
        const testCases = await response.json();
        return testCases;
    } catch (error) {
        console.error('Error loading test cases:', error);
        return {};
    }
}

// Render practice test cases in the left panel
function renderPracticeTestCases(testCases, questions) {
    const practiceTestCasesContainer = document.getElementById('practiceTestCases');
    if (!practiceTestCasesContainer) return;
    
    let html = '';
    
    questions.forEach(question => {
        if (question.type === 'sql-execution' && testCases[question.id]) {
            const questionTestCases = testCases[question.id];
            if (questionTestCases.practiceCases && questionTestCases.practiceCases.length > 0) {
                html += `<div class="test-case-question-group">
                    <h4 class="test-case-question-title">${question.title}</h4>`;
                
                questionTestCases.practiceCases.forEach((testCase, index) => {
                    // Format expected output as a table
                    let outputTableHtml = '';
                    if (testCase.expectedOutput && testCase.expectedOutput.length > 0) {
                        const columns = Object.keys(testCase.expectedOutput[0]);
                        outputTableHtml = '<table class="test-case-table"><thead><tr>';
                        columns.forEach(col => {
                            outputTableHtml += `<th>${col}</th>`;
                        });
                        outputTableHtml += '</tr></thead><tbody>';
                        
                        testCase.expectedOutput.forEach(row => {
                            outputTableHtml += '<tr>';
                            columns.forEach(col => {
                                outputTableHtml += `<td>${row[col] !== null && row[col] !== undefined ? row[col] : 'NULL'}</td>`;
                            });
                            outputTableHtml += '</tr>';
                        });
                        
                        outputTableHtml += '</tbody></table>';
                    } else {
                        outputTableHtml = '<div class="test-case-empty">No rows returned</div>';
                    }
                    
                    html += `
                        <div class="practice-test-case" data-question-id="${question.id}" data-test-case-id="${testCase.id}">
                            <div class="test-case-header">
                                <span class="test-case-name">${testCase.name}</span>
                            </div>
                            ${testCase.description ? `<div class="test-case-description">${testCase.description}</div>` : ''}
                            <div class="test-case-output">
                                <strong>Output:</strong>
                                <div class="test-case-result-table">${outputTableHtml}</div>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
            }
        }
    });
    
    practiceTestCasesContainer.innerHTML = html || '<p>No practice test cases available.</p>';
}


// Render questions
function renderQuestions(data) {
    const questionsContainer = document.getElementById('questionsContainer');
    
    // Question context is now in the left panel, so we don't include it here
    let html = '';
    
    // Render each question
    data.questions.forEach((question, index) => {
        if (question.type === 'text-input') {
            html += `
                <div class="question-section ${index === 0 ? 'active' : ''}" data-question="${index}">
                    <div class="question-header">
                        <h3 class="question-title">${question.title}</h3>
                        <p class="question-text">${question.text}</p>
                    </div>
                    <div class="text-input-group" id="question-${question.id}">
                        <div class="sql-prompt">${question.prompt || ''}</div>
                        <input 
                            type="text" 
                            class="answer-input" 
                            id="input-${question.id}"
                            placeholder="${question.placeholder || 'Enter your answer'}"
                            autocomplete="off"
                            spellcheck="false"
                        />
                        ${question.hint ? `<p class="question-hint">${question.hint}</p>` : ''}
                        <p class="question-hint" style="margin-top: 4px;"><em>Note: SQL is case-insensitive, so capitalization doesn't matter for your answers.</em></p>
                    </div>
                </div>
            `;
        } else if (question.type === 'text-input-blanks') {
            const blanksHtml = question.blanks.map((blank, blankIndex) => `
                <input 
                    type="text" 
                    class="blank-input" 
                    id="input-${question.id}-${blank.id}"
                    data-blank-id="${blank.id}"
                    placeholder="${blank.placeholder}"
                    autocomplete="off"
                    spellcheck="false"
                />
            `).join('');
            
            html += `
                <div class="question-section ${index === 0 ? 'active' : ''}" data-question="${index}">
                    <div class="question-header">
                        <h3 class="question-title">${question.title}</h3>
                        <p class="question-text">${question.text}</p>
                    </div>
                    <div class="text-input-group" id="question-${question.id}">
                        <div class="sql-prompt">
                            ${question.prompt || ''} 
                            <span class="blank-wrapper">${blanksHtml}</span>
                            <span class="sql-suffix">;</span>
                        </div>
                        ${question.hint ? `<p class="question-hint">${question.hint}</p>` : ''}
                        <p class="question-hint" style="margin-top: 4px;"><em>Note: SQL is case-insensitive, so capitalization doesn't matter for your answers.</em></p>
                    </div>
                </div>
            `;
        } else if (question.type === 'drag-drop') {
            // Render drag-and-drop question
            const operatorsHtml = question.operators.map(op => `
                <div class="operator-item" draggable="true" data-operator-id="${op.id}">
                    <span class="operator-symbol">${op.symbol}</span>
                    <span class="operator-name">${op.name}</span>
                </div>
            `).join('');
            
            // Load saved positions from localStorage (skip for questions that should use fixed positions)
            const savedPositionsKey = `diagram-positions-${question.id}`;
            const useFixedPositions = question.id === '2.1'; // Food delivery question - use fixed positions
            const savedPositions = useFixedPositions ? {} : JSON.parse(localStorage.getItem(savedPositionsKey) || '{}');
            
            // Generate nodes from nodeGroups
            let nodeIndex = 0;
            const nodesHtml = (question.nodeGroups || question.nodes || []).flatMap((group, groupIndex) => {
                const label = group.label || group.id;
                const count = group.count || 1;
                const defaultPositions = group.defaultPositions || [group.position || {top: '0%', left: '0%'}];
                const correctOperator = group.correctOperator || group.correctOperator;
                
                return Array.from({length: count}, (_, i) => {
                    const nodeId = `${label}-${i}`;
                    // For fixed position questions, always use defaultPositions from JSON
                    const position = useFixedPositions 
                        ? (defaultPositions[i] || defaultPositions[0] || {top: '0%', left: '0%'})
                        : (savedPositions[nodeId] || defaultPositions[i] || defaultPositions[0] || {top: '0%', left: '0%'});
                    const style = `position: absolute; top: ${position.top || '0%'}; left: ${position.left || '0%'};`;
                    
                    return `
                        <div class="execution-node diagram-node" 
                             data-node-id="${nodeId}"
                             data-node-label="${label}"
                             data-correct-operator="${correctOperator}"
                             data-node-index="${nodeIndex++}"
                             style="${style}">
                            <div class="node-label">${label}</div>
                            <div class="node-drop-zone" id="drop-${question.id}-${nodeId}">
                                <span class="drop-placeholder">${label}</span>
                            </div>
                            <button class="node-delete-btn" title="Remove this node" style="display: none;">×</button>
                        </div>
                    `;
                });
            }).join('');
            
            html += `
                <div class="question-section ${index === 0 ? 'active' : ''}" data-question="${index}">
                    <div class="question-header">
                        <h3 class="question-title">${question.title}</h3>
                        <p class="question-text">${question.text}</p>
                    </div>
                    <div class="drag-drop-group" id="question-${question.id}">
                        <div class="execution-plan-area">
                            <div class="diagram-header">
                                <h4 class="plan-title">Execution Plan Diagram</h4>
                                <div class="diagram-controls">
                                    ${question.id === '2.1' ? '' : `<button class="btn-edit-positions" id="editPositions-${question.id}">Edit Positions</button>`}
                                    <button class="btn-add-node" id="addNode-${question.id}" style="display: none;">Add Node</button>
                                    <button class="btn-save-positions" id="savePositions-${question.id}" style="display: none;">Save Positions</button>
                                    <button class="btn-cancel-edit" id="cancelEdit-${question.id}" style="display: none;">Cancel</button>
                                </div>
                            </div>
                            ${question.diagramImage ? `
                                <div class="diagram-container" id="diagramContainer-${question.id}">
                                    <img src="${question.diagramImage}" alt="Execution Plan Diagram" class="execution-diagram" />
                                    <div class="operators-palette-overlay">
                                        <div class="operators-container">
                                            ${operatorsHtml}
                                        </div>
                                    </div>
                                    <div class="diagram-nodes-overlay">
                                        ${nodesHtml}
                                    </div>
                                </div>
                            ` : `
                                <div class="execution-nodes-container">
                                    ${nodesHtml}
                                </div>
                            `}
                        </div>
                        ${question.hint ? `<p class="question-hint">${question.hint}</p>` : ''}
                    </div>
                </div>
            `;
        } else if (question.type === 'sql-execution') {
            html += `
                <div class="question-section ${index === 0 ? 'active' : ''}" data-question="${index}">
                    <div class="question-header">
                        <h3 class="question-title">${question.title}</h3>
                        <p class="question-text">${question.text}</p>
                    </div>
                    <div class="sql-execution-group" id="question-${question.id}" data-question-id="${question.id}">
                        <div class="sql-editor-container">
                            <textarea 
                                class="sql-editor" 
                                id="sql-editor-${question.id}"
                                placeholder="Write your SQL query here...&#10;Example: SELECT * FROM books;"
                                spellcheck="false"
                            ></textarea>
                            <div class="sql-editor-actions">
                                <button class="btn-run-query" id="run-query-${question.id}">
                                    <i class="fas fa-play"></i> Run Query
                                </button>
                                <button class="btn-clear-query" id="clear-query-${question.id}">
                                    <i class="fas fa-eraser"></i> Clear
                                </button>
                            </div>
                        </div>
                        <div class="sql-results-container" id="sql-results-${question.id}">
                            <div class="sql-results-placeholder">
                                <i class="fas fa-database"></i>
                                <p>Write a query and click "Run Query" to see results</p>
                            </div>
                        </div>
                        ${question.hint ? `<p class="question-hint">${question.hint}</p>` : ''}
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="question-section ${index === 0 ? 'active' : ''}" data-question="${index}">
                    <div class="question-header">
                        <h3 class="question-title">${question.title}</h3>
                        <p class="question-text">${question.text}</p>
                    </div>
                    <div class="checkbox-group" id="question-${question.id}">
                        ${question.options.map(option => `
                            <label class="checkbox-option">
                                <input type="checkbox" value="${option.value}" data-answer="${option.isCorrect}">
                                <span class="checkbox-label">${option.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    questionsContainer.innerHTML = html;
    
    // Initialize drag-and-drop functionality after a brief delay to ensure DOM is ready
    setTimeout(() => {
        initializeDragAndDrop();
        initializePositionEditing();
        initializeSQLExecution(data);
    }, 100);
    
    // Reinitialize question navigation
    questionSections = document.querySelectorAll('.question-section');
    if (questionSections.length > 0) {
        currentQuestionIndex = 0;
        updateQuestionNavigation();
    }
}

// SQL Database Management
let sqlDB = null;
let sqlDBInitialized = false;

// Initialize SQL.js database with sample data
async function initializeSQLDatabase(questionData) {
    // If already initialized, verify it still works
    if (sqlDBInitialized && sqlDB) {
        try {
            // Quick test to verify database is still valid
            sqlDB.exec('SELECT 1');
            return sqlDB;
        } catch (e) {
            console.warn('Database appears corrupted, reinitializing...');
            sqlDB = null;
            sqlDBInitialized = false;
        }
    }
    
    try {
        // Initialize SQL.js - check if it's already loaded
        let SQL;
        if (typeof initSqlJs !== 'undefined') {
            SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
            });
        } else if (typeof sqljs !== 'undefined') {
            SQL = sqljs;
        } else {
            throw new Error('SQL.js library not loaded');
        }
        
        // Create new database
        sqlDB = new SQL.Database();
        
        // Create tables from schema
        if (questionData.schema) {
            Object.values(questionData.schema).forEach(createTableSQL => {
                try {
                    sqlDB.run(createTableSQL);
                } catch (e) {
                    console.error('Error creating table:', e);
                }
            });
        }
        
        // Load and insert sample data
        let sampleData = questionData.sampleData;
        
        // If dataFile is specified, load from file
        if (questionData.dataFile && !sampleData) {
            try {
                const dataResponse = await fetch(questionData.dataFile);
                if (dataResponse.ok) {
                    sampleData = await dataResponse.json();
                    console.log('Loaded sample data from file:', sampleData);
                } else {
                    console.error('Failed to load data file:', dataResponse.status, dataResponse.statusText);
                }
            } catch (error) {
                console.error('Error loading data file:', error);
            }
        }
        
        if (sampleData) {
            console.log('Inserting sample data into database...');
            // Insert books
            if (sampleData.books && sampleData.books.length > 0) {
                const booksStmt = sqlDB.prepare('INSERT INTO books (book_id, book_name, year, genre, author_id, times_trending) VALUES (?, ?, ?, ?, ?, ?)');
                sampleData.books.forEach(book => {
                    try {
                        booksStmt.run([book.book_id, book.book_name, book.year, book.genre, book.author_id, book.times_trending]);
                    } catch (e) {
                        console.error('Error inserting book:', book, e);
                    }
                });
                booksStmt.free();
                console.log(`Inserted ${sampleData.books.length} books`);
            }
            
            // Insert authors
            if (sampleData.authors && sampleData.authors.length > 0) {
                const authorsStmt = sqlDB.prepare('INSERT INTO authors (author_id, author_name, publishing_company, debut_year) VALUES (?, ?, ?, ?)');
                sampleData.authors.forEach(author => {
                    try {
                        authorsStmt.run([author.author_id, author.author_name, author.publishing_company, author.debut_year]);
                    } catch (e) {
                        console.error('Error inserting author:', author, e);
                    }
                });
                authorsStmt.free();
                console.log(`Inserted ${sampleData.authors.length} authors`);
            }
            
            // Insert awards
            if (sampleData.awards && sampleData.awards.length > 0) {
                const awardsStmt = sqlDB.prepare('INSERT INTO awards (award_id, book_id, award_name) VALUES (?, ?, ?)');
                sampleData.awards.forEach(award => {
                    try {
                        awardsStmt.run([award.award_id, award.book_id, award.award_name]);
                    } catch (e) {
                        console.error('Error inserting award:', award, e);
                    }
                });
                awardsStmt.free();
                console.log(`Inserted ${sampleData.awards.length} awards`);
            }
            
            // Verify data was inserted
            try {
                const testResult = sqlDB.exec('SELECT COUNT(*) as count FROM books');
                if (testResult.length > 0) {
                    console.log('Database verification - Books count:', testResult[0].values[0][0]);
                }
            } catch (e) {
                console.error('Error verifying database:', e);
            }
        } else {
            console.warn('No sample data available to insert');
        }
        
        sqlDBInitialized = true;
        return sqlDB;
    } catch (error) {
        console.error('Error initializing SQL database:', error);
        return null;
    }
}

// Initialize SQL execution for questions
function initializeSQLExecution(questionData) {
    // Only initialize if there are SQL execution questions
    const hasSQLQuestions = questionData.questions && questionData.questions.some(q => q.type === 'sql-execution');
    if (!hasSQLQuestions) return;
    
    // Initialize database
    initializeSQLDatabase(questionData).then(db => {
        if (!db) {
            console.error('Failed to initialize SQL database');
            return;
        }
        
        // Set up event handlers for each SQL execution question
        questionData.questions.forEach(question => {
            if (question.type === 'sql-execution') {
                const runBtn = document.getElementById(`run-query-${question.id}`);
                const clearBtn = document.getElementById(`clear-query-${question.id}`);
                const editor = document.getElementById(`sql-editor-${question.id}`);
                const resultsContainer = document.getElementById(`sql-results-${question.id}`);
                
                if (runBtn) {
                    runBtn.addEventListener('click', () => {
                        executeSQLQuery(question.id, editor.value, resultsContainer, question);
                    });
                }
                
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        if (editor) editor.value = '';
                        if (resultsContainer) {
                            resultsContainer.innerHTML = `
                                <div class="sql-results-placeholder">
                                    <i class="fas fa-database"></i>
                                    <p>Write a query and click "Run Query" to see results</p>
                                </div>
                            `;
                        }
                    });
                }
                
                // Allow Ctrl+Enter to run query
                if (editor) {
                    editor.addEventListener('keydown', (e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            if (runBtn) runBtn.click();
                        }
                    });
                }
            }
        });
        
        // Set up "Run All Tests" button
        const runAllTestsBtn = document.getElementById('runAllTestsBtn');
        if (runAllTestsBtn) {
            runAllTestsBtn.addEventListener('click', () => {
                runAllAssessmentTests(questionData);
            });
        }
    });
}

// Run all assessment test cases
async function runAllAssessmentTests(questionData) {
    if (!sqlDB) {
        alert('Database not initialized. Please wait for the page to load completely.');
        return;
    }
    
    const testCases = await loadTestCases(questionData.id);
    const testCasesResults = document.getElementById('testCasesResults');
    if (!testCasesResults) return;
    
    let html = '';
    let totalTests = 0;
    let passedTests = 0;
    
    questionData.questions.forEach(question => {
        if (question.type === 'sql-execution' && testCases[question.id]) {
            const questionTestCases = testCases[question.id];
            if (questionTestCases.assessmentCases && questionTestCases.assessmentCases.length > 0) {
                html += `<div class="assessment-test-case-group">
                    <h4 class="assessment-question-title">${question.title}</h4>`;
                
                questionTestCases.assessmentCases.forEach((testCase, index) => {
                    totalTests++;
                    const editor = document.getElementById(`sql-editor-${question.id}`);
                    const userQuery = editor ? editor.value.trim() : '';
                    
                    if (!userQuery) {
                        html += `
                            <div class="assessment-test-case-item not-run">
                                <div class="test-case-status-icon"><i class="fas fa-circle"></i></div>
                                <div class="test-case-info">
                                    <div class="test-case-name">${testCase.name}</div>
                                    <div class="test-case-description">${testCase.description}</div>
                                </div>
                                <div class="test-case-status">Not Run</div>
                            </div>
                        `;
                        return;
                    }
                    
                    try {
                        const result = sqlDB.exec(userQuery);
                        const actualColumns = result.length > 0 ? result[0].columns : [];
                        const actualValues = result.length > 0 ? result[0].values : [];
                        const isCorrect = checkSQLResult(actualColumns, actualValues, testCase.expectedOutput);
                        
                        if (isCorrect) {
                            passedTests++;
                        }
                        
                        // Format expected output for display
                        let expectedOutputHtml = '';
                        if (!isCorrect && testCase.expectedOutput) {
                            if (testCase.expectedOutput.length > 0) {
                                const columns = Object.keys(testCase.expectedOutput[0]);
                                expectedOutputHtml = '<div class="test-case-expected-output"><strong>Expected Output:</strong><table class="test-case-table"><thead><tr>';
                                columns.forEach(col => {
                                    expectedOutputHtml += `<th>${col}</th>`;
                                });
                                expectedOutputHtml += '</tr></thead><tbody>';
                                testCase.expectedOutput.forEach(row => {
                                    expectedOutputHtml += '<tr>';
                                    columns.forEach(col => {
                                        expectedOutputHtml += `<td>${row[col] !== null && row[col] !== undefined ? row[col] : 'NULL'}</td>`;
                                    });
                                    expectedOutputHtml += '</tr>';
                                });
                                expectedOutputHtml += '</tbody></table></div>';
                            } else {
                                expectedOutputHtml = '<div class="test-case-expected-output"><strong>Expected Output:</strong> <em>No rows returned</em></div>';
                            }
                        }
                        
                        html += `
                            <div class="assessment-test-case-item ${isCorrect ? 'passed' : 'failed'}">
                                <div class="test-case-status-icon">
                                    <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                </div>
                                <div class="test-case-info">
                                    <div class="test-case-name">${testCase.name}</div>
                                    <div class="test-case-description">${testCase.description}</div>
                                    ${!isCorrect ? `<div class="test-case-error-details">Result does not match expected output${expectedOutputHtml}</div>` : ''}
                                </div>
                                <div class="test-case-status ${isCorrect ? 'passed' : 'failed'}">${isCorrect ? 'Passed' : 'Failed'}</div>
                            </div>
                        `;
                    } catch (error) {
                        html += `
                            <div class="assessment-test-case-item failed">
                                <div class="test-case-status-icon">
                                    <i class="fas fa-times-circle"></i>
                                </div>
                                <div class="test-case-info">
                                    <div class="test-case-name">${testCase.name}</div>
                                    <div class="test-case-description">${testCase.description}</div>
                                    <div class="test-case-error-details">Error: ${error.message}</div>
                                </div>
                                <div class="test-case-status failed">Failed</div>
                            </div>
                        `;
                    }
                });
                
                html += `</div>`;
            }
        }
    });
    
    if (html === '') {
        html = '<div class="empty-test-cases"><i class="fas fa-vial"></i><p>No assessment test cases available.</p></div>';
    } else {
        html = `
            <div class="test-cases-summary">
                <div class="summary-stats">
                    <span class="stat-item">${passedTests}/${totalTests} test cases passed</span>
                </div>
            </div>
            ${html}
        `;
    }
    
    testCasesResults.innerHTML = html;
}

// Execute SQL query and display results
function executeSQLQuery(questionId, query, resultsContainer, questionData) {
    if (!sqlDB) {
        resultsContainer.innerHTML = `
            <div class="sql-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Database not initialized. Please refresh the page.</p>
            </div>
        `;
        console.error('SQL database not initialized');
        return;
    }
    
    if (!query || !query.trim()) {
        resultsContainer.innerHTML = `
            <div class="sql-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Please enter a SQL query.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Execute query
        console.log('Executing query:', query.trim());
        const result = sqlDB.exec(query.trim());
        console.log('Query result:', result);
        
        if (result.length === 0) {
            resultsContainer.innerHTML = `
                <div class="sql-success">
                    <i class="fas fa-check-circle"></i>
                    <p>Query executed successfully. No rows returned.</p>
                </div>
            `;
            return;
        }
        
        // Verify we have result data
        if (!result[0] || !result[0].columns || !result[0].values) {
            resultsContainer.innerHTML = `
                <div class="sql-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Query executed but returned invalid result format.</p>
                </div>
            `;
            return;
        }
        
        // Display results in a table
        const columns = result[0].columns;
        const values = result[0].values;
        
        console.log('Query returned:', columns.length, 'columns,', values.length, 'rows');
        
        let html = '<div class="sql-results-table-container"><table class="sql-results-table"><thead><tr>';
        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        values.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${cell !== null && cell !== undefined ? cell : 'NULL'}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        // Check if result matches expected result (for answer checking)
        if (questionData.expectedResult) {
            console.log('Comparing results:');
            console.log('Actual columns:', columns);
            console.log('Actual values:', values);
            console.log('Expected result:', questionData.expectedResult);
            const isCorrect = checkSQLResult(columns, values, questionData.expectedResult);
            console.log('Comparison result:', isCorrect);
            if (isCorrect !== null) {
                html += `
                    <div class="sql-answer-feedback ${isCorrect ? 'correct' : 'incorrect'}">
                        <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        <span>${isCorrect ? 'Correct! Your query produces the expected result.' : 'Your query does not match the expected result. Try again.'}</span>
                    </div>
                `;
            }
        }
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="sql-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p><strong>SQL Error:</strong> ${error.message}</p>
            </div>
        `;
    }
}

// Check if SQL result matches expected result
// Compares: same columns, same number of rows, same row data
function checkSQLResult(columns, values, expectedResult) {
    if (!expectedResult || expectedResult.length === 0) {
        // If expected is empty, actual should also be empty
        return values.length === 0;
    }
    
    // Check 1: Same number of rows (shape)
    if (values.length !== expectedResult.length) {
        return false;
    }
    
    // Check 2: Same columns (column names must match)
    const expectedColumns = Object.keys(expectedResult[0]).map(k => k.toLowerCase()).sort();
    const actualColumns = columns.map(c => c.toLowerCase()).sort();
    
    if (expectedColumns.length !== actualColumns.length) {
        return false;
    }
    
    for (let i = 0; i < expectedColumns.length; i++) {
        if (expectedColumns[i] !== actualColumns[i]) {
            return false;
        }
    }
    
    // Check 3: Same rows (all rows must match)
    // Convert actual values to objects with lowercase keys for comparison
    const normalizedActual = values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
            // Normalize the value - handle null, undefined, and convert to comparable format
            let val = row[idx];
            if (val === null || val === undefined) {
                val = null;
            } else if (typeof val === 'number') {
                val = val; // Keep numbers as numbers for comparison
            } else {
                val = String(val).trim(); // Trim strings
            }
            obj[col.toLowerCase()] = val;
        });
        return obj;
    });
    
    const normalizedExpected = expectedResult.map(row => {
        const obj = {};
        Object.keys(row).forEach(key => {
            // Normalize the value
            let val = row[key];
            if (val === null || val === undefined) {
                val = null;
            } else if (typeof val === 'number') {
                val = val; // Keep numbers as numbers
            } else {
                val = String(val).trim(); // Trim strings
            }
            obj[key.toLowerCase()] = val;
        });
        return obj;
    });
    
    // Sort both arrays by all column values for comparison (order might differ)
    const createSortKey = (obj) => {
        const keys = Object.keys(obj).sort();
        return keys.map(k => {
            const v = obj[k];
            if (v === null || v === undefined) return 'NULL';
            return String(v);
        }).join('|');
    };
    
    normalizedActual.sort((a, b) => createSortKey(a).localeCompare(createSortKey(b)));
    normalizedExpected.sort((a, b) => createSortKey(a).localeCompare(createSortKey(b)));
    
    console.log('Normalized actual (sorted):', normalizedActual);
    console.log('Normalized expected (sorted):', normalizedExpected);
    
    // Compare each row
    for (let i = 0; i < normalizedActual.length; i++) {
        const actual = normalizedActual[i];
        const expected = normalizedExpected[i];
        
        console.log(`Comparing row ${i}:`, actual, 'vs', expected);
        
        // Check all columns match
        for (const key of expectedColumns) {
            const actualVal = actual[key];
            const expectedVal = expected[key];
            
            // Handle null/undefined comparison
            if ((actualVal === null || actualVal === undefined) && (expectedVal === null || expectedVal === undefined)) {
                continue;
            }
            
            // Compare values - use strict equality for numbers, string comparison for others
            if (typeof actualVal === 'number' && typeof expectedVal === 'number') {
                if (actualVal !== expectedVal) {
                    console.log(`Mismatch at row ${i}, key ${key}: ${actualVal} !== ${expectedVal}`);
                    return false;
                }
            } else {
                // Convert both to strings for comparison
                const actualStr = String(actualVal);
                const expectedStr = String(expectedVal);
                if (actualStr !== expectedStr) {
                    console.log(`Mismatch at row ${i}, key ${key}: "${actualStr}" !== "${expectedStr}"`);
                    return false;
                }
            }
        }
    }
    
    console.log('All rows match!');
    return true;
}

// Initialize drag-and-drop functionality
function initializeDragAndDrop() {
    let draggedElement = null;
    
    // Remove old event listeners by using event delegation or checking if already initialized
    // Make operator items draggable (only those in the palette, not already dropped)
    // Check both regular palette and overlay palette
    document.querySelectorAll('.operators-container .operator-item, .operators-palette-overlay .operators-container .operator-item').forEach(item => {
        // Check if already has dragstart listener
        if (item.hasAttribute('data-drag-initialized')) return;
        item.setAttribute('data-drag-initialized', 'true');
        
        item.addEventListener('dragstart', (e) => {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        });
        
        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
    });
    
    // Make drop zones accept drops
    document.querySelectorAll('.node-drop-zone').forEach(dropZone => {
        // Check if already has drop listener
        if (dropZone.hasAttribute('data-drop-initialized')) return;
        dropZone.setAttribute('data-drop-initialized', 'true');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (draggedElement) {
                const operatorId = draggedElement.getAttribute('data-operator-id');
                const nodeElement = dropZone.closest('.execution-node');
                const nodeLabel = nodeElement ? nodeElement.getAttribute('data-node-label') : null;
                
                // Remove from previous location if it was already dropped
                const existingOperator = dropZone.querySelector('.operator-item');
                if (existingOperator && existingOperator !== draggedElement) {
                    // Check if it's a clone (not draggable) - if so, just remove it
                    // If it's the original from palette (draggable), move it back
                    if (existingOperator.draggable === false) {
                        // It's a clone, just remove it - don't add to palette
                        existingOperator.remove();
                    } else {
                        // It's the original operator, move it back to palette
                        const operatorsContainer = document.querySelector('.operators-container');
                        if (operatorsContainer) {
                            operatorsContainer.appendChild(existingOperator);
                            existingOperator.removeAttribute('data-drag-initialized');
                            // Re-initialize drag for the returned operator
                            existingOperator.addEventListener('dragstart', (e) => {
                                draggedElement = e.target;
                                e.target.style.opacity = '0.5';
                                e.dataTransfer.effectAllowed = 'move';
                            });
                            existingOperator.addEventListener('dragend', (e) => {
                                e.target.style.opacity = '1';
                            });
                        }
                    }
                }
                
                // Clone the operator for the drop zone
                const clonedOperator = draggedElement.cloneNode(true);
                clonedOperator.style.opacity = '1';
                clonedOperator.draggable = false;
                clonedOperator.style.cursor = 'default';
                clonedOperator.removeAttribute('data-drag-initialized');
                
                // Clear placeholder and add operator
                dropZone.innerHTML = '';
                dropZone.appendChild(clonedOperator);
                
                // Auto-fill all nodes with the same label
                if (nodeLabel) {
                    const questionElement = dropZone.closest('.drag-drop-group');
                    if (questionElement) {
                        questionElement.querySelectorAll(`.execution-node[data-node-label="${nodeLabel}"]`).forEach(node => {
                            const otherDropZone = node.querySelector('.node-drop-zone');
                            if (otherDropZone && otherDropZone !== dropZone) {
                                // Check if it already has an operator
                                const existingOtherOperator = otherDropZone.querySelector('.operator-item');
                                if (existingOtherOperator) {
                                    // Remove existing operator (it's a clone, so just remove it)
                                    existingOtherOperator.remove();
                                }
                                // Add the new operator
                                const clonedOperatorForOther = clonedOperator.cloneNode(true);
                                otherDropZone.appendChild(clonedOperatorForOther);
                            }
                        });
                    }
                }
                
                // Keep original in palette for reuse
            }
        });
    });
}

// Initialize position editing functionality
function initializePositionEditing() {
    // Edit positions button
    document.querySelectorAll('.btn-edit-positions').forEach(btn => {
        if (btn.hasAttribute('data-initialized')) return;
        btn.setAttribute('data-initialized', 'true');
        
        btn.addEventListener('click', () => {
            const questionId = btn.id.replace('editPositions-', '');
            enterEditMode(questionId);
        });
    });
    
    // Save positions button
    document.querySelectorAll('.btn-save-positions').forEach(btn => {
        if (btn.hasAttribute('data-initialized')) return;
        btn.setAttribute('data-initialized', 'true');
        
        btn.addEventListener('click', () => {
            const questionId = btn.id.replace('savePositions-', '');
            savePositions(questionId);
        });
    });
    
    // Cancel edit button
    document.querySelectorAll('.btn-cancel-edit').forEach(btn => {
        if (btn.hasAttribute('data-initialized')) return;
        btn.setAttribute('data-initialized', 'true');
        
        btn.addEventListener('click', () => {
            const questionId = btn.id.replace('cancelEdit-', '');
            exitEditMode(questionId);
        });
    });
    
    // Add node button
    document.querySelectorAll('.btn-add-node').forEach(btn => {
        if (btn.hasAttribute('data-initialized')) return;
        btn.setAttribute('data-initialized', 'true');
        
        btn.addEventListener('click', () => {
            const questionId = btn.id.replace('addNode-', '');
            showAddNodeDialog(questionId);
        });
    });
}

// Enter edit mode - make nodes draggable for positioning
function enterEditMode(questionId) {
    const questionElement = document.getElementById(`question-${questionId}`);
    if (!questionElement) return;
    
    questionElement.classList.add('edit-mode');
    
    // Show/hide buttons
    document.getElementById(`editPositions-${questionId}`).style.display = 'none';
    document.getElementById(`savePositions-${questionId}`).style.display = 'inline-block';
    document.getElementById(`cancelEdit-${questionId}`).style.display = 'inline-block';
    document.getElementById(`addNode-${questionId}`).style.display = 'inline-block';
    
    // Show delete buttons
    questionElement.querySelectorAll('.node-delete-btn').forEach(btn => {
        btn.style.display = 'block';
    });
    
    // Make nodes draggable for positioning
    const diagramContainer = document.getElementById(`diagramContainer-${questionId}`);
    if (!diagramContainer) return;
    
    let isDragging = false;
    let currentElement = null;
    let offset = {x: 0, y: 0};
    
    questionElement.querySelectorAll('.execution-node').forEach(node => {
        node.style.cursor = 'move';
        node.classList.add('position-editable');
        
        // Remove existing listeners
        const newNode = node.cloneNode(true);
        node.parentNode.replaceChild(newNode, node);
        
        newNode.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('node-delete-btn')) return;
            if (e.target.closest('.node-drop-zone')) return;
            
            isDragging = true;
            currentElement = newNode;
            const rect = newNode.getBoundingClientRect();
            const containerRect = diagramContainer.getBoundingClientRect();
            offset.x = e.clientX - rect.left - (rect.width / 2);
            offset.y = e.clientY - rect.top - (rect.height / 2);
            newNode.style.zIndex = '1000';
            e.preventDefault();
        });
        
        // Delete button
        const deleteBtn = newNode.querySelector('.node-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                newNode.remove();
            });
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentElement) return;
        
        const containerRect = diagramContainer.getBoundingClientRect();
        const x = e.clientX - containerRect.left - offset.x;
        const y = e.clientY - containerRect.top - offset.y;
        
        const percentX = (x / containerRect.width) * 100;
        const percentY = (y / containerRect.height) * 100;
        
        currentElement.style.left = `${Math.max(0, Math.min(100, percentX))}%`;
        currentElement.style.top = `${Math.max(0, Math.min(100, percentY))}%`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging && currentElement) {
            currentElement.style.zIndex = '10';
        }
        isDragging = false;
        currentElement = null;
    });
}

// Exit edit mode
function exitEditMode(questionId) {
    const questionElement = document.getElementById(`question-${questionId}`);
    if (!questionElement) return;
    
    questionElement.classList.remove('edit-mode');
    
    // Show/hide buttons
    document.getElementById(`editPositions-${questionId}`).style.display = 'inline-block';
    document.getElementById(`savePositions-${questionId}`).style.display = 'none';
    document.getElementById(`cancelEdit-${questionId}`).style.display = 'none';
    document.getElementById(`addNode-${questionId}`).style.display = 'none';
    
    // Hide delete buttons
    questionElement.querySelectorAll('.node-delete-btn').forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Reload question to reset positions (or keep current positions)
    // For now, we'll keep the current positions until saved
}

// Save positions to localStorage
function savePositions(questionId) {
    const questionElement = document.getElementById(`question-${questionId}`);
    if (!questionElement) return;
    
    const positions = {};
    const positionsByLabel = {};
    
    questionElement.querySelectorAll('.execution-node').forEach(node => {
        const nodeId = node.getAttribute('data-node-id');
        const nodeLabel = node.getAttribute('data-node-label');
        const style = node.getAttribute('style');
        const topMatch = style.match(/top:\s*([\d.]+%)/);
        const leftMatch = style.match(/left:\s*([\d.]+%)/);
        
        if (topMatch && leftMatch) {
            const pos = {
                top: topMatch[1],
                left: leftMatch[1]
            };
            positions[nodeId] = pos;
            
            // Group by label for easier copying
            if (!positionsByLabel[nodeLabel]) {
                positionsByLabel[nodeLabel] = [];
            }
            positionsByLabel[nodeLabel].push(pos);
        }
    });
    
    const savedPositionsKey = `diagram-positions-${questionId}`;
    localStorage.setItem(savedPositionsKey, JSON.stringify(positions));
    
    // Output positions in a format that can be copied to the question file
    console.log('=== Positions to copy to question file ===');
    console.log('Group positions by label:');
    Object.keys(positionsByLabel).sort().forEach(label => {
        console.log(`"${label}":`, JSON.stringify(positionsByLabel[label], null, 2));
    });
    console.log('=== End positions ===');
    
    alert('Positions saved to localStorage! Check console for copyable format.');
    exitEditMode(questionId);
}

// Show dialog to add a new node
function showAddNodeDialog(questionId) {
    const question = currentQuestionData?.questions.find(q => q.id === questionId);
    if (!question || !question.nodeGroups) return;
    
    const label = prompt('Enter node label (e.g., [I], [II], etc.):');
    if (!label) return;
    
    // Find the group for this label
    const group = question.nodeGroups.find(g => g.label === label);
    if (!group) {
        alert('Label not found in node groups. Please use an existing label.');
        return;
    }
    
    // Add new node
    const diagramContainer = document.getElementById(`diagramContainer-${questionId}`);
    if (!diagramContainer) return;
    
    const overlay = diagramContainer.querySelector('.diagram-nodes-overlay');
    if (!overlay) return;
    
    const existingNodes = overlay.querySelectorAll(`[data-node-label="${label}"]`);
    const newNodeIndex = existingNodes.length;
    const newNodeId = `${label}-${newNodeIndex}`;
    
    // Get center position or random position
    const containerRect = diagramContainer.getBoundingClientRect();
    const top = '50%';
    const left = '50%';
    
    const newNode = document.createElement('div');
    newNode.className = 'execution-node diagram-node position-editable';
    newNode.setAttribute('data-node-id', newNodeId);
    newNode.setAttribute('data-node-label', label);
    newNode.setAttribute('data-correct-operator', group.correctOperator);
    newNode.style.cssText = `position: absolute; top: ${top}; left: ${left}; cursor: move;`;
    newNode.innerHTML = `
        <div class="node-label">${label}</div>
        <div class="node-drop-zone" id="drop-${questionId}-${newNodeId}">
            <span class="drop-placeholder">${label}</span>
        </div>
        <button class="node-delete-btn" title="Remove this node">×</button>
    `;
    
    overlay.appendChild(newNode);
    
    // Update correctAnswers for the new node
    if (!correctAnswers[questionId]) {
        correctAnswers[questionId] = {};
    }
    correctAnswers[questionId][newNodeId] = group.correctOperator;
    
    // Reinitialize drag-and-drop for the new node
    setTimeout(() => {
        initializeDragAndDrop();
    }, 50);
    
    // Make it draggable in edit mode
    if (document.getElementById(`question-${questionId}`).classList.contains('edit-mode')) {
        // The existing mousemove handler will handle it
        enterEditMode(questionId);
    }
}

// Normalize SQL answers for comparison (case-insensitive, flexible whitespace)
// SQL keywords and identifiers are case-insensitive, so we normalize everything
function normalizeSQLAnswer(answer) {
    if (!answer) return '';
    
    return answer
        .toUpperCase()                    // Case insensitive
        .replace(/\s+/g, ' ')            // Normalize all whitespace to single spaces
        .replace(/\s*\(\s*/g, '(')       // Remove spaces around opening parentheses
        .replace(/\s*\)\s*/g, ')')       // Remove spaces around closing parentheses
        .replace(/\s*,\s*/g, ',')        // Normalize commas (remove spaces around them)
        .trim();                          // Remove leading/trailing spaces
}

// Update correct answers object
function updateCorrectAnswers(questions) {
    correctAnswers = {};
    questions.forEach(question => {
        if (question.type === 'text-input') {
            correctAnswers[question.id] = question.correctAnswer;
        } else if (question.type === 'text-input-blanks') {
            // Store correct answers for each blank
            correctAnswers[question.id] = {};
            question.blanks.forEach(blank => {
                correctAnswers[question.id][blank.id] = blank.correctAnswer;
            });
        } else if (question.type === 'drag-drop') {
            // Store correct answers for each node group
            correctAnswers[question.id] = {};
            if (question.nodeGroups) {
                question.nodeGroups.forEach(group => {
                    // All nodes with this label should have the same correct operator
                    for (let i = 0; i < group.count; i++) {
                        const nodeId = `${group.label}-${i}`;
                        correctAnswers[question.id][nodeId] = group.correctOperator;
                    }
                });
            } else if (question.nodes) {
                // Fallback for old format
                question.nodes.forEach(node => {
                    correctAnswers[question.id][node.id] = node.correctOperator;
                });
            }
        } else if (question.type === 'sql-execution') {
            // Store correct query for SQL execution questions
            correctAnswers[question.id] = question.correctQuery || '';
        } else {
            const correct = question.options
                .filter(opt => opt.isCorrect)
                .map(opt => opt.value);
            correctAnswers[question.id] = correct;
        }
    });
}

function checkAnswers() {
    console.log('checkAnswers function called');
    
    if (!currentQuestionData) {
        console.error('No question data loaded!');
        return;
    }
    
    // Get selected answers for each question
    const questionResults = [];
    let totalScore = 0;
    let maxScore = 0;
    
    currentQuestionData.questions.forEach(question => {
        const questionElement = document.getElementById(`question-${question.id}`);
        if (!questionElement) {
            console.error(`Question element not found: question-${question.id}`);
            return;
        }
        
        let selected, correct, isCorrect, score;
        
        if (question.type === 'text-input') {
            // Handle text input questions
            const inputElement = document.getElementById(`input-${question.id}`);
            if (!inputElement) {
                console.error(`Input element not found for question: ${question.id}`);
                return;
            }
            
            selected = inputElement.value.trim();
            correct = correctAnswers[question.id] || '';
            
            // Normalize answers for comparison (SQL is case-insensitive)
            isCorrect = normalizeSQLAnswer(selected) === normalizeSQLAnswer(correct);
            score = isCorrect ? question.points : 0;
        } else if (question.type === 'text-input-blanks') {
            // Handle fill-in-the-blank questions with multiple inputs
            // SQL is case-insensitive, so we normalize answers
            selected = {};
            correct = correctAnswers[question.id] || {};
            let allCorrect = true;
            
            question.blanks.forEach(blank => {
                const inputElement = document.getElementById(`input-${question.id}-${blank.id}`);
                if (!inputElement) {
                    console.error(`Input element not found for blank: ${blank.id}`);
                    allCorrect = false;
                    return;
                }
                
                const userAnswer = normalizeSQLAnswer(inputElement.value.trim());
                const correctAnswer = normalizeSQLAnswer(blank.correctAnswer);
                const blankCorrect = userAnswer === correctAnswer;
                
                selected[blank.id] = inputElement.value.trim();
                
                if (!blankCorrect) {
                    allCorrect = false;
                }
            });
            
            isCorrect = allCorrect;
            score = isCorrect ? question.points : 0;
        } else if (question.type === 'drag-drop') {
            // Handle drag-and-drop questions
            selected = {};
            correct = correctAnswers[question.id] || {};
            let allCorrect = true;
            
            // Get all nodes from the DOM (including dynamically added ones)
            const allNodes = questionElement.querySelectorAll('.execution-node');
            
            allNodes.forEach(nodeElement => {
                const nodeId = nodeElement.getAttribute('data-node-id');
                const dropZone = nodeElement.querySelector('.node-drop-zone');
                
                if (!dropZone) {
                    console.error(`Drop zone not found for node: ${nodeId}`);
                    allCorrect = false;
                    return;
                }
                
                const droppedOperator = dropZone.querySelector('.operator-item');
                const userOperatorId = droppedOperator ? droppedOperator.getAttribute('data-operator-id') : null;
                const correctOperatorId = correct[nodeId];
                
                selected[nodeId] = userOperatorId;
                
                if (userOperatorId !== correctOperatorId) {
                    allCorrect = false;
                }
            });
            
            // Check if all nodes have been filled
            if (allNodes.length === 0) {
                allCorrect = false;
            }
            
            isCorrect = allCorrect;
            score = isCorrect ? question.points : 0;
        } else if (question.type === 'sql-execution') {
            // Handle SQL execution questions
            const editor = document.getElementById(`sql-editor-${question.id}`);
            const resultsContainer = document.getElementById(`sql-results-${question.id}`);
            
            if (!editor) {
                console.error(`SQL editor not found for question: ${question.id}`);
                return;
            }
            
            selected = editor.value.trim();
            correct = question.correctQuery || '';
            
            // Check if there's a feedback element indicating correctness
            const feedbackElement = resultsContainer.querySelector('.sql-answer-feedback');
            if (feedbackElement) {
                isCorrect = feedbackElement.classList.contains('correct');
            } else {
                // If no feedback yet, try to execute and check
                if (selected) {
                    executeSQLQuery(question.id, selected, resultsContainer, question);
                    // Re-check after execution
                    setTimeout(() => {
                        const newFeedback = resultsContainer.querySelector('.sql-answer-feedback');
                        isCorrect = newFeedback ? newFeedback.classList.contains('correct') : false;
                    }, 100);
                    isCorrect = false; // Default to false, will be updated by execution
                } else {
                    isCorrect = false;
                }
            }
            
            score = isCorrect ? question.points : 0;
        } else {
            // Handle multiple choice questions
            selected = Array.from(questionElement.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            correct = correctAnswers[question.id] || [];
            isCorrect = arraysEqual(selected.sort(), correct.sort());
            score = isCorrect ? question.points : 0;
        }
        
        questionResults.push({
            question,
            questionElement,
            selected,
            correct,
            score,
            isCorrect
        });
        
        totalScore += score;
        maxScore += question.points;
    });
    
    // Store feedback data and apply visual feedback (hidden by default)
    storedFeedback = {};
    questionResults.forEach(result => {
        storedFeedback[result.question.id] = {
            questionElement: result.questionElement,
            correctAnswers: result.correct,
            selectedAnswers: result.selected
        };
        applyFeedback(result.questionElement, result.correct, result.selected, false);
    });
    
    // Mark answers as checked and show toggle button
    answersChecked = true;
    if (toggleAnswersBtn) {
        toggleAnswersBtn.style.display = 'flex';
    }
    answersVisible = false;
    updateToggleButtonText();
    
    // Display results
    displayResults(questionResults, totalScore, maxScore);
    
    // Switch to results tab
    document.querySelector('[data-tab="results"]').click();
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function applyFeedback(questionElement, correctAnswers, selectedAnswers, showFeedback = false) {
    // Check if this is a drag-and-drop question
    const executionNodes = questionElement.querySelectorAll('.execution-node');
    if (executionNodes.length > 0) {
        // Handle drag-and-drop feedback
        executionNodes.forEach(node => {
            const nodeId = node.getAttribute('data-node-id');
            const dropZone = node.querySelector('.node-drop-zone');
            const correctOperatorId = correctAnswers[nodeId];
            const selectedOperatorId = selectedAnswers[nodeId];
            
            node.classList.remove('node-correct', 'node-incorrect');
            
            if (showFeedback) {
                const isCorrect = selectedOperatorId === correctOperatorId;
                if (isCorrect) {
                    node.classList.add('node-correct');
                } else {
                    node.classList.add('node-incorrect');
                    // Show correct operator as hint
                    if (correctOperatorId) {
                        const question = currentQuestionData.questions.find(q => 
                            questionElement.id === `question-${q.id}`
                        );
                        if (question) {
                            const correctOp = question.operators.find(op => op.id === correctOperatorId);
                            if (correctOp) {
                                node.title = `Correct operator: ${correctOp.symbol} (${correctOp.name})`;
                            }
                        }
                    }
                }
            }
        });
        return;
    }
    
    // Check if this is a fill-in-the-blank question with multiple inputs
    const blankInputs = questionElement.querySelectorAll('.blank-input');
    if (blankInputs.length > 0) {
        // Handle fill-in-the-blank feedback (SQL is case-insensitive)
        blankInputs.forEach(input => {
            const blankId = input.getAttribute('data-blank-id');
            input.classList.remove('answer-correct', 'answer-incorrect');
            
            if (showFeedback && correctAnswers && correctAnswers[blankId]) {
                const userAnswer = normalizeSQLAnswer(selectedAnswers[blankId] || input.value.trim());
                const correctAnswer = normalizeSQLAnswer(correctAnswers[blankId]);
                const isCorrect = userAnswer === correctAnswer;
                
                if (isCorrect) {
                    input.classList.add('answer-correct');
                } else {
                    input.classList.add('answer-incorrect');
                    input.title = `Correct answer: ${correctAnswers[blankId]}`;
                }
            }
        });
        return;
    }
    
    // Check if this is a single text input question
    const textInput = questionElement.querySelector('.answer-input');
    if (textInput) {
        // Handle text input feedback
        textInput.classList.remove('answer-correct', 'answer-incorrect');
        
        if (showFeedback) {
            // Normalize for comparison (SQL is case-insensitive)
            const userAnswer = normalizeSQLAnswer(selectedAnswers || '');
            const correctAnswer = normalizeSQLAnswer(correctAnswers || '');
            const isCorrect = userAnswer === correctAnswer;
            
            if (isCorrect) {
                textInput.classList.add('answer-correct');
            } else {
                textInput.classList.add('answer-incorrect');
                // Show correct answer as placeholder or tooltip
                textInput.title = `Correct answer: ${correctAnswers}`;
            }
        }
        return;
    }
    
    // Handle multiple choice questions
    const options = questionElement.querySelectorAll('.checkbox-option');
    
    options.forEach(option => {
        const checkbox = option.querySelector('input[type="checkbox"]');
        const value = checkbox.value;
        const isCorrect = correctAnswers.includes(value);
        const isSelected = selectedAnswers.includes(value);
        const shouldBeSelected = correctAnswers.includes(value);
        
        // Remove previous feedback classes
        option.classList.remove('correct', 'incorrect', 'missed');
        
        if (showFeedback) {
            if (isSelected && isCorrect) {
                // Correctly selected
                option.classList.add('correct');
            } else if (isSelected && !isCorrect) {
                // Incorrectly selected
                option.classList.add('incorrect');
            } else if (!isSelected && shouldBeSelected) {
                // Should have been selected but wasn't
                option.classList.add('missed');
            }
        }
        // If showFeedback is false, we just remove the classes (hide feedback)
    });
}

function toggleAnswersVisibility() {
    answersVisible = !answersVisible;
    updateToggleButtonText();
    
    // Apply or remove feedback based on visibility state for all questions
    Object.keys(storedFeedback).forEach(questionId => {
        const feedback = storedFeedback[questionId];
        if (feedback) {
            applyFeedback(
                feedback.questionElement,
                feedback.correctAnswers,
                feedback.selectedAnswers,
                answersVisible
            );
        }
    });
}

function updateToggleButtonText() {
    const icon = toggleAnswersBtn.querySelector('i');
    if (answersVisible) {
        toggleAnswersText.textContent = 'Hide Answers';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        toggleAnswersText.textContent = 'Show Answers';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

if (toggleAnswersBtn) {
    toggleAnswersBtn.addEventListener('click', () => {
        if (answersChecked) {
            toggleAnswersVisibility();
        }
    });
}

function displayResults(questionResults, totalScore, maxScore) {
    const percentage = (totalScore / maxScore) * 100;
    const isPassing = percentage >= 50;
    
    resultsStatus.textContent = `Results: ${totalScore}/${maxScore} points (${percentage.toFixed(0)}%)`;
    resultsStatus.style.color = isPassing ? 'var(--success-color)' : 'var(--error-color)';
    
    let resultsHTML = `
        <div class="results-summary">
            <h3>Overall Score</h3>
            <div class="score-display ${isPassing ? 'passing' : 'failing'}">
                ${totalScore}/${maxScore} points
            </div>
            <p class="feedback-text">${percentage.toFixed(0)}% correct</p>
        </div>
    `;
    
    questionResults.forEach(result => {
        resultsHTML += `
            <div class="question-result">
                <div class="question-result-header">
                    <span class="question-result-title">${result.question.title}</span>
                    <span class="question-result-score ${result.isCorrect ? 'correct' : 'incorrect'}">
                        ${result.score}/${result.question.points} points
                    </span>
                </div>
                <p class="feedback-text">
                    ${result.isCorrect 
                        ? '✓ Correct! You answered this question correctly.' 
                        : '✗ Incorrect. Review your answer and try again.'}
                </p>
            </div>
        `;
    });
    
    resultsContent.innerHTML = resultsHTML;
}

if (submitBtn) {
    submitBtn.addEventListener('click', () => {
        console.log('Submit button clicked');
        checkAnswers();
    });
} else {
    console.error('Cannot attach submit button listener - button not found');
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submitBtn.click();
    }
    
    // Ctrl/Cmd + S to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        submitBtn.click();
    }
});

// Resize Functionality
function initResize() {
    // Load saved widths from localStorage
    const savedSidebarWidth = localStorage.getItem('sidebarWidth');
    const savedProblemPanelWidth = localStorage.getItem('problemPanelWidth');
    
    if (savedSidebarWidth) {
        sidebar.style.width = savedSidebarWidth;
        document.documentElement.style.setProperty('--sidebar-width', savedSidebarWidth);
    }
    
    if (savedProblemPanelWidth) {
        problemPanel.style.width = savedProblemPanelWidth;
        document.documentElement.style.setProperty('--problem-panel-width', savedProblemPanelWidth);
    }
    
    // Sidebar Resize
    const sidebarResize = document.getElementById('sidebarResize');
    if (sidebarResize) {
        console.log('Sidebar resize handle found');
        let isResizingSidebar = false;
        let startX = 0;
        let startWidth = 0;
        
        sidebarResize.addEventListener('mousedown', (e) => {
            console.log('Sidebar resize started');
            isResizingSidebar = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizingSidebar) return;
            
            const diff = e.clientX - startX;
            const newWidth = Math.max(200, Math.min(600, startWidth + diff));
            sidebar.style.width = `${newWidth}px`;
            document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizingSidebar) {
                isResizingSidebar = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                localStorage.setItem('sidebarWidth', sidebar.style.width);
            }
        });
    }
    
    // Problem Panel Resize
    const problemPanelResize = document.getElementById('problemPanelResize');
    if (problemPanelResize) {
        console.log('Problem panel resize handle found');
        let isResizingProblemPanel = false;
        let startXProblem = 0;
        let startWidthProblem = 0;
        
        problemPanelResize.addEventListener('mousedown', (e) => {
            console.log('Problem panel resize started');
            isResizingProblemPanel = true;
            startXProblem = e.clientX;
            startWidthProblem = problemPanel.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizingProblemPanel) return;
            
            const diff = e.clientX - startXProblem;
            const newWidth = Math.max(300, Math.min(800, startWidthProblem + diff));
            problemPanel.style.width = `${newWidth}px`;
            document.documentElement.style.setProperty('--problem-panel-width', `${newWidth}px`);
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizingProblemPanel) {
                isResizingProblemPanel = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                localStorage.setItem('problemPanelWidth', problemPanel.style.width);
            }
        });
    }
}

// Initialize resize functionality
initResize();

// Initialize
console.log('SQL Problem Navigator initialized');

