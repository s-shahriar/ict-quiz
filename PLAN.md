# Screenshot Question Extractor — Plan

## Workflow

1. User sends screenshots one by one (or multiple) — **no topic needed**
2. For each screenshot, I will:
   - Detect **marked questions only** (highlighted, underlined, circled, colored pen/pencil marks)
   - Extract the question text and all options
   - Determine the correct answer
   - **Auto-detect the topic** based on question content and my judgement
3. Accumulate all marked questions under the detected topic
4. Save everything to a `.json` file in this directory
5. Questions that don't fit any known topic go into `others.json`

---

## JSON Structure

```json
{
  "topic": "Computer Fundamental",
  "questions": [
    {
      "id": 1,
      "question": "Who invented QWERTY keyboard?",
      "options": {
        "a": "Steve Jobs",
        "b": "Christopher Latham Sholes",
        "c": "Brian Sams",
        "d": "Anderson Palimar"
      },
      "correct_answer": "b",
      "correct_answer_text": "Christopher Latham Sholes"
    }
  ]
}
```

---

## File Naming

- JSON file saved as: `{topic_name_snake_case}.json`
- Example: `computer_fundamental.json`

---

## Rules

- Only extract **marked** questions — skip all unmarked ones
- Marking types: color highlight, pen/pencil mark, tick, underline, circle
- No source tags included
- Each new topic starts a new JSON file
- If more screenshots are sent for the same topic, questions are **appended** to the existing file
- IDs are auto-incremented across all screenshots for the same topic
- Questions that don't clearly fit a known topic go into `others.json`
- Topic is **auto-detected** from question content — no need for the user to specify it

---

## Example

**User says:** topic is - Computer Fundamental  
**User sends:** screenshot with questions 2 and 5 marked  
**Output file:** `computer_fundamental.json`
