# ⚡ ICT Quiz

A fast, clean quiz and study app for mastering **Information & Communication Technology** topics. Built with React + Vite. Features Bengali explanations for every question.

## ✨ Features

- **12 Topics** — Computer Fundamentals, C Programming, DSA, Database, Digital Logic, OOP, OS, Networks, Info Security, Linux, Microprocessor, Software Engineering
- **344+ Questions** — extracted from real exam/textbook MCQs
- **Quiz Mode** — randomized questions with instant right/wrong feedback and score tracking
- **Study Mode** — browse all Q&As at your own pace, reveal answers when ready
- **Bengali Explanations** — every question has a detailed Bengali explanation of *why* the answer is correct
- **Dark / Light Theme** — toggle with persistent preference (saved in localStorage)
- **Responsive** — works on desktop, tablet, and mobile

## 🛠 Tech Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- [Lucide React](https://lucide.dev/) — icons
- [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) + [Nunito](https://fonts.google.com/specimen/Nunito) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — fonts
- Plain CSS with CSS variables for theming — no Tailwind, no CSS-in-JS

## 📁 Project Structure

```
ict-quiz/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── HomeScreen.jsx    # Topic selection grid
│   │   ├── ModeSelect.jsx    # Quiz vs Study chooser
│   │   ├── QuizMode.jsx      # Interactive quiz with scoring
│   │   └── StudyMode.jsx     # Read-through Q&A cards
│   ├── data/
│   │   ├── index.js          # Topic registry with icons & colors
│   │   ├── computer_fundamental.json
│   │   ├── c_programming.json
│   │   ├── database.json
│   │   ├── digital_logic.json
│   │   ├── dsa.json
│   │   ├── information_security.json
│   │   ├── linux.json
│   │   ├── microprocessor.json
│   │   ├── oop.json
│   │   ├── operating_system.json
│   │   ├── software_engineering.json
│   │   └── computer_network.json
│   ├── App.jsx               # Root — routing + theme state
│   ├── index.css             # All styles + CSS theme variables
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/s-shahriar/ict-quiz.git
cd ict-quiz

# Install
npm install

# Dev server
npm run dev

# Production build
npm run build
```

Then open [http://localhost:5173](http://localhost:5173).

## 📦 Adding Questions

Each JSON file in `src/data/` follows this schema:

```json
{
  "topic": "Topic Name",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": {
        "a": "Option A",
        "b": "Option B",
        "c": "Option C",
        "d": "Option D"
      },
      "correct_answer": "b",
      "correct_answer_text": "Option B",
      "explanation": "Bengali explanation of why this answer is correct."
    }
  ]
}
```

To add a new topic, add an entry to `src/data/index.js` with an icon from [Lucide](https://lucide.dev/icons/) and an accent color.

## 🌐 Deployment

Deployed via **Vercel** — connect the GitHub repo and Vercel auto-detects Vite. No configuration needed.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/s-shahriar/ict-quiz)
