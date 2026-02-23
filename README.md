# DISPATCH

> Turn your thoughts into organized tasks — just type naturally.

A conversational productivity app powered by Flask + Gemini AI.

---

## ✦ Features

- **Natural language input** — "chem lab due next Thursday at 5pm" becomes a tagged, scheduled task automatically
- **Contextual editing** — "actually make that 6pm" updates your last task
- **Duplicate detection** — smart pop-up when a task might already exist
- **File attachments** — attach docs/images to tasks via the chat
- **Dashboard view** — timeline organized by Overdue / Today / This Week / Later / Undated
- **Calendar view** — custom monthly grid with task indicators
- **Drag & drop** — reorder tasks manually
- **Polling** — dashboard updates every 2.5s when chat is active

---

## 🚀 Quick Start

### 1. Clone and set up environment

```bash
git clone <your-repo>
cd dispatched
cp .env.example .env
# Edit .env and fill in your GEMINI_API_KEY and a random SECRET_KEY
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

Open http://localhost:8000

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | Random string for session signing |
| `DATABASE_URL` | SQLite (default) or PostgreSQL URL |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `UPLOAD_FOLDER` | Path for file uploads (default: `./uploads`) |
| `FLASK_ENV` | `development` or `production` |

---

## ☁️ Deploy to Railway / Render / Heroku

### Railway

1. Push to GitHub
2. New project → Deploy from GitHub repo
3. Add environment variables in Railway dashboard
4. Railway auto-detects `Procfile` → deploys with `gunicorn`

### Render

1. New Web Service → connect GitHub repo
2. Build command: `pip install -r requirements.txt`
3. Start command: `gunicorn backend.app:app`
4. Add env vars in Render dashboard

### Heroku

```bash
heroku create your-app-name
heroku config:set SECRET_KEY=xxx GEMINI_API_KEY=xxx
git push heroku main
```

For PostgreSQL on any platform, set `DATABASE_URL` to a `postgresql://` connection string.

---

## 📁 Project Structure

```
dispatched/
├── backend/
│   ├── app.py              # Flask entry point
│   ├── config.py           # Config + env vars
│   ├── models/             # SQLAlchemy models
│   │   ├── user.py
│   │   ├── message.py
│   │   └── task.py
│   ├── services/
│   │   ├── gemini_parser.py    # AI parsing
│   │   └── date_calculator.py  # "next Thursday" → date
│   └── routes/
│       ├── auth.py
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
| AI | Google Gemini 1.5 Flash |
| Database | SQLite (dev) / PostgreSQL (prod) |
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
- Click calendar days to see all tasks for that day
