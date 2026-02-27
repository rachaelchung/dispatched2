# DISPATCH

> Turn your thoughts into organized tasks — just type naturally.

A conversational productivity app powered by Flask + OpenAI.

---

## ✦ Features

- **Natural language input** — "chem lab due next Thursday at 5pm" is scheduled automatically
- **Contextual editing** — "actually make that 6pm" updates your last task
- **Duplicate detection** — smart pop-up when a task might already exist
- **File attachments** — attach docs/images to tasks via the chat
- **Dashboard view** — timeline organized by Overdue / Today / Days of the Week / Later / Undated
- **Calendar view** — custom monthly grid with task indicators
- **Polling** — dashboard updates every 2.5s when chat is active

---

## 🚀 Quick Start

### 1. Clone and set up environment

```bash
git clone <your-repo>
cd dispatched2
cp .env.example .env
# Edit .env and fill in your OPENAI_API_KEY and a random SECRET_KEY
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run locally

```bash
python -m backend.app
# or
flask --app backend.app run --debug --port 8000
```

Open http://127.0.0.1:8000

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | Random string for session signing |
| `DATABASE_URL` | SQLite |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `UPLOAD_FOLDER` | Path for file uploads (default: `./uploads`) |
| `FLASK_ENV` | `development` or `production` |

---

## ☁️ Use on Render

Find the link to the working site here: https://dispatched2.onrender.com/

## 📁 Project Structure

```
dispatched/
├── backend/
│   ├── app.py              # Flask entry point
│   ├── config.py           # Config + env vars
│   ├── models/             # SQLAlchemy models
│   │   ├── chat.py
│   │   ├── user.py
│   │   ├── message.py
│   │   └── task.py
│   ├── services/
│   │   ├── gemini_parser.py    # AI parsing
│   │   └── date_calculator.py  # "next Thursday" → date
│   │   └── manual.py  # fallback in case the AI fails
│   └── routes/
│       ├── auth.py
│       ├── chats.py
│       ├── messages.py
│       └── tasks.py
├── frontend/
│   ├── index.html          # Landing page
│   ├── app.html            # Main app
│   ├── css/
│   │   ├── landing.css
│   │   ├── app.css
│   │   ├── chat.css
│   │   ├── dashboard.css
│   │   └── calendar.css
│   └── js/
│       ├── app.js
│       ├── chat.js
│       ├── dashboard.js
│       └── calendar.js
├── requirements.txt
├── Procfile
└── .env.example
```

---

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Backend | Flask 3 (Python 3.10+) |
| Frontend | HTML + CSS + Vanilla JS |
| AI | OpenAI gpt-4o-mini |
| Database | SQLite |
| Auth | Flask-Login + bcrypt |
| Real-time | Polling every 2.5s |
| Deployment | Gunicorn + Procfile |

---

## 💡 Usage Tips

- Type anything conversationally: `"pick up meds tomorrow"`, `"group project meeting Thursday 3pm"`
- Correct yourself: `"actually, make that Friday"` — Dispatch updates the last task
- Multiple tasks at once: `"call mom and also submit the form by EOD"`
- Add files by clicking 📎 before sending
- Drag task cards to reorder within sections
- Click calendar to see all tasks
