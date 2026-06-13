# KnightLife ♞

**Play chess against Stockfish. No clutter. Just the board.**

[![Live site](https://img.shields.io/badge/Live-chessentials.onrender.com-b91c1c?style=for-the-badge)](https://chessentials.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Stockfish](https://img.shields.io/badge/Engine-Stockfish-528DD8?style=flat-square)](https://stockfishchess.org/)
[![License: CC0-1.0](https://img.shields.io/badge/License-CC0%201.0-lightgrey?style=flat-square)](LICENSE)

KnightLife is a personal chess lab by [Ailyn Diaz](https://github.com/ailynux) — a lean Flask app wired to **Stockfish** with a gothic UI, opening study tools, and puzzles. It grew out of [Chessentials](./docs/versions/v1.0-chessentials/README.md) (v1); same love for the game, rebuilt from the ground up.

---

## Features

### Play
- Play **white or black** against Stockfish at five difficulty levels (1200–2100)
- **Real-time eval bar** from your perspective, with plain-language mood text
- **Hints**, **undo**, **restart**, and **promotion picker**
- **Legal move hints** on hover/drag (toggle in Customize Board)
- **Board themes** and **piece sets** (saved locally)

### Learn
- **Opening Vault** — 48+ lines across 8 styles, up to 12 moves deep; load any opening on the board in one click
- **Strategy** — weekly quiz + six strategy cards
- **Tactics** — accordion lessons
- **Endgame** — pathways + FEN puzzles with streak tracking

### Built lean
- One CSS file, no Tailwind CDN, no frontend framework bloat
- Mobile-first layout with slide-in navigation
- Preferences and stats in `localStorage` — no account required

---

## Quick start (local)

### Prerequisites
- Python 3.9+
- Stockfish — either bundled binary or `brew install stockfish` on macOS

### Run

```bash
git clone https://github.com/ailynux/Chessentials.git
cd Chessentials

python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Open **http://localhost:5000** (hard refresh with `Cmd+Shift+R` if styles look stale).

> **macOS note:** If port 5000 is taken by AirPlay, set `PORT=5001 python app.py` and use `http://localhost:5001`.

---

## Deploy (Render / Linux)

Render runs Linux. The repo includes `stockfish/stockfish-ubuntu-x86-64-sse41-popcnt` — `app.py` picks it automatically.

| Setting | Value |
|---------|--------|
| **Build command** | `pip install -r requirements.txt` |
| **Start command** | `gunicorn -w 1 -b 0.0.0.0:$PORT --timeout 120 app:app` |
| **Branch** | `main` |

Optional env override: `STOCKFISH_PATH=/path/to/stockfish`

Docker is supported via the included `Dockerfile` (also uses 1 Gunicorn worker).

---

## Project structure

```
Chessentials/
├── app.py                 # Flask routes + Stockfish integration
├── requirements.txt
├── Dockerfile
├── templates/             # Jinja2 pages (base layout + routes)
├── static/
│   ├── chessentials.css   # Single stylesheet (gothic theme)
│   ├── script.js          # Board, AI, eval, hints
│   ├── prefs.js           # Themes, piece sets, localStorage
│   ├── pages.js           # Quiz, openings UI, puzzles
│   ├── openings.js        # Opening vault data
│   ├── nav.js             # Mobile drawer
│   └── about.js           # About page terminal animation
├── stockfish/             # Platform binaries (Linux for Render)
└── docs/versions/         # Archived READMEs per release
```

---

## API (internal)

| Route | Method | Purpose |
|-------|--------|---------|
| `/move` | POST | Stockfish best move + eval for FEN |
| `/hint` | POST | Hint move for current position |
| `/evaluate` | POST | Position evaluation |
| `/set_skill_level` | POST | Engine difficulty (1–20) |
| `/reset` | POST | Reset engine state |

All engine calls are serialized with a thread lock — safe under Gunicorn.

---

## Version history

| Version | Name | Docs |
|---------|------|------|
| **v2.0** (current) | KnightLife | This README · [Changelog](./docs/versions/v2.0-knightlife/CHANGELOG.md) |
| v1.0 | Chessentials | [Archived README](./docs/versions/v1.0-chessentials/README.md) |

See [docs/versions/README.md](./docs/versions/README.md) for the full index.

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3, Flask 3, Gunicorn |
| Engine | Stockfish (bundled binary + `stockfish` PyPI) |
| Frontend | Vanilla JS, Chessboard.js, chess.js |
| Pieces | Lichess SVG sets + Wikipedia classic fallback |
| Fonts | Cinzel (Google Fonts) |

---

## License

[CC0 1.0 Universal](./LICENSE) — use, fork, and modify freely.

---

## Connect

Built by **Ailyn Diaz**

[![GitHub](https://img.shields.io/badge/GitHub-ailynux-181717?style=for-the-badge&logo=github)](https://github.com/ailynux)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-ailyndiaz01-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/ailyndiaz01)
[![Exercism](https://img.shields.io/badge/Exercism-ailynux-302683?style=for-the-badge&logo=exercism)](https://exercism.org/profiles/ailynux)
[![LeetCode](https://img.shields.io/badge/LeetCode-ailynux-FFA116?style=for-the-badge&logo=leetcode&logoColor=black)](https://leetcode.com/u/ailynux/)

**We're just here to play chess.**
