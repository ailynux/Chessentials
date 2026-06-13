# KnightLife v2.0 — Changelog

## Overview

Major redesign and rebrand from **Chessentials** to **KnightLife**. Same Stockfish backend; new UI, features, and identity.

## Added

- **KnightLife** branding, favicon, and gothic black/red theme
- Single lean stylesheet (`static/chessentials.css`) — removed Tailwind CDN and legacy CSS files
- Jinja2 base layout (`base.html`, `_header.html`, `_footer.html`)
- **Opening Vault** — 48+ categorized openings, up to 12 moves deep, “Try This Opening” handoff to board
- **Legal move hints** — hover/drag dots with on/off toggle (saved in localStorage)
- **Eval bar** — player-relative advantage + mood text
- **Board customization** — themes (Gothic, Classic, Blood, Frost) and piece sets
- **Win counter** and puzzle streaks (localStorage)
- **About page** — workspace hero image, typewriter terminal, stack cards
- **Mobile nav** — slide-in drawer, sticky header
- **Strategy / Tactics / Endgame** page improvements (quiz, pathways, puzzles)
- Thread-safe Stockfish engine lock for concurrent API calls
- Cross-platform Stockfish binary resolution (macOS / Linux / Windows)

## Changed

- Site title and nav: Chessentials → KnightLife (Chessentials credited in footer/About)
- Production: Gunicorn single worker, `$PORT` for Render/Linux

## Removed

- Tailwind CSS build pipeline from runtime UI
- Broken portfolio link from footer
- Old multi-file CSS (`styles.css`, `build.css`, `src.css`)

## Archived

- Original v1 README → [docs/versions/v1.0-chessentials/README.md](../v1.0-chessentials/README.md)
