// Question data for: Chapter 1: Game Chat
// This file loads the question data from the JSON file to eliminate redundancy
// JSON is the single source of truth for question data
window.questionData = window.questionData || {};

(async function() {
    try {
        // Load question data from JSON file
        const response = await fetch('questions/game-chat.json');
        if (!response.ok) {
            throw new Error(`Failed to load game-chat.json: ${response.statusText}`);
        }
        const data = await response.json();
        window.questionData['game-chat'] = data;
    } catch (error) {
        console.error('Error loading game-chat.json:', error);
        console.warn('Note: Loading JSON requires a local server. Use: python3 -m http.server 8000');
        // Fallback: You could add inline data here as a backup if needed
    }
})();

