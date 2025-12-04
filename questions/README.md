# Questions Directory

This directory contains all exam questions organized by topic/problem.

## Structure

Each question is stored in its own JavaScript file (`.js`) that adds the question data to `window.questionData`. This allows questions to be loaded without CORS issues.

### JavaScript File Format

Each question file (e.g., `game-chat.js`) should follow this structure:

```javascript
// Question data for: [Question Title]
window.questionData = window.questionData || {};
window.questionData['question-id'] = {
  "id": "question-id",
  "title": "Question Title",
  "points": 30,
  "semester": "Spring 2025",
  "instructor": "Instructor Name",
  "description": "Problem description...",
  "relations": ["relation1", "relation2"],
  "schema": {
    "table1": "CREATE TABLE...",
    "table2": "CREATE TABLE..."
  },
  "questionContext": "Context for the questions...",
  "questions": [
    {
      "id": "1.1.i",
      "title": "1.1.i [3 pt]",
      "text": "Question text",
      "type": "multiple-choice",
      "points": 3,
      "options": [
        {
          "value": "option-value",
          "label": "A. Option Label",
          "isCorrect": true
        }
      ]
    }
  ]
};
```

## Adding New Questions

1. Create a new JavaScript file in this directory (e.g., `new-question.js`)
2. Follow the structure above, using the format shown
3. Add a script tag in `index.html` to load the question file:
   ```html
   <script src="questions/new-question.js"></script>
   ```
4. Update the sidebar in `index.html` to include the new question with `data-question-file="new-question"`
5. The question will automatically load when selected

## Current Questions

- `game-chat.js` - Chapter 1: Game Chat (Primary Keys and Foreign Keys)

## File Organization

Each question is now in its own JavaScript file:
- `questions/game-chat.js` - Contains all data for the Game Chat question
- More questions can be added as separate `.js` files

This organization makes it easy to:
- Add new questions without modifying the main code
- Keep question data separate and organized
- Avoid CORS issues (no need for a server)
- Maintain clean, modular code structure

