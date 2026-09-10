# NilavuArt — AI-Powered Art Learning Platform

Upload your artwork, get instant computer-vision-based feedback, track your
progress over time, and receive practice exercises targeted at your weakest
skills.

## Features

- **Upload artwork** (JPG/PNG/WEBP) through a simple web UI.
- **AI feedback** using classic computer vision (OpenCV) heuristics — no paid
  API required:
  - Brightness
  - Contrast
  - Color balance
  - Saturation
  - Line/edge quality
  - Composition (rule-of-thirds check)
- **Progress tracking** — a chart of your scores over every upload.
- **Recommended exercises** — matched to whichever metric scored lowest on
  your most recent piece.
- **Optional vision narratives** — with explicit consent, a configured
  OpenAI-compatible vision model provides strengths, growth areas, next steps,
  and a practice exercise. OpenCV remains the fallback.

## Architecture

```
backend/    FastAPI + SQLite + OpenCV (Python)
frontend/   React + Vite (JavaScript)
```

- `backend/cv_analysis.py` — all the computer-vision scoring logic, heavily
  commented so it's easy to follow and modify.
- `backend/exercises.py` — a small seeded exercise library + tag-based
  recommendation logic.
- `backend/database.py` — SQLAlchemy models (`Artwork`, `Feedback`, `Exercise`).
- `backend/main.py` — FastAPI routes: upload, list artworks, progress, exercises.
- `frontend/src` — React components (upload form, feedback card, gallery,
  progress chart, exercise recommendations).

## Running locally

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` and uploaded images are
served from `http://localhost:8000/uploads/...`. A SQLite database file
(`nilavuart.db`) is created automatically on first run.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/uploads` requests to
the backend on port 8000.

## Optional vision-model narratives

The app works without an API key. To enable narrative critiques, set these
environment variables before starting the backend:

```powershell
$env:OPENAI_API_KEY="your-key"
$env:OPENAI_VISION_MODEL="gpt-4.1-mini"
uvicorn main:app --reload --port 8000
```

`OPENAI_VISION_MODEL` is configurable because model availability differs by
account. `OPENAI_BASE_URL` can point to another API with a compatible Chat
Completions interface. Never put the API key in frontend code or commit it to
GitHub. The upload form asks for consent before sending a resized image to the
provider, and provider failures fall back to local OpenCV feedback.

## Hosting on Render

The repository includes a `Dockerfile` and `render.yaml` that build the React
frontend and serve it from FastAPI as one website.

1. Create a GitHub repository and push this project to it.
2. Sign in at [render.com](https://render.com) using GitHub.
3. Select **New + → Blueprint** and choose the repository.
4. Render detects `render.yaml`; approve the `nilavuart` web service.
5. Enter the Cloudinary values requested by the Blueprint:
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
   `CLOUDINARY_API_SECRET`.
6. Optionally add the secret `OPENAI_API_KEY` for vision narratives.
7. Wait for the build to finish, then open the generated `onrender.com` URL.

The Blueprint provisions Render Postgres for artwork records and feedback.
Cloudinary stores uploaded images, so both survive service restarts and
redeployments. Local development continues to use SQLite and local uploads
when no Cloudinary credentials are configured.

The free service may also sleep while inactive, making its first request take
up to a minute. No API key is required for the current OpenCV analysis.

## How the CV feedback works (no ML model needed)

Each uploaded image is decoded with OpenCV and scored 0-100 on six metrics
using simple statistical rules, for example:

- **Brightness** — mean pixel value of the grayscale image.
- **Contrast** — standard deviation of grayscale pixel values.
- **Color balance** — how far apart the mean of the blue/green/red channels are.
- **Saturation** — mean of the "S" channel in HSV color space.
- **Line quality** — density of edges detected by the Canny edge detector.
- **Composition** — fraction of detected edges that fall near the classic
  rule-of-thirds grid lines.

The three lowest-scoring metrics become "weak tags", which drive both the
written suggestions and the recommended practice exercises.

## Blog post idea

**"How I Used Computer Vision to Help Young Artists Improve"**

Suggested outline for a high-schooler writing this up:

1. **The problem** — art students often lack immediate, objective feedback
   between class critiques.
2. **Why classic CV instead of a big ML model** — explainability, no API
   costs, runs entirely offline, and every score can be traced back to a
   simple, teachable formula (mean brightness, standard deviation, Canny
   edges, HSV saturation, rule-of-thirds edge clustering).
3. **Walk through one metric in depth** — e.g. the rule-of-thirds composition
   check: show a diagram of the grid, explain the edge-detection step, and
   how "closeness to a third-line" becomes a score.
4. **Turning scores into suggestions** — the weakest three metrics per
   artwork drive both the tips shown and the exercises recommended.
5. **Full-stack architecture** — a quick diagram of React ⇄ FastAPI ⇄ SQLite,
   good for explaining how the pieces fit together.
6. **What I'd improve next** — e.g. adding an optional LLM-based qualitative
   critique layer, style-specific rules (photorealism vs. cartooning), or a
   mobile app.
7. **Lessons learned building it as a student** — debugging OpenCV,
   picking sensible score thresholds by testing on real drawings, etc.
