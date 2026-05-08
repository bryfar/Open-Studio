# OpenShorts FastAPI Service

Backend service for OpenStudio dedicated modules:

- Clip Generator
- AI Shorts

## Run

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
docker compose up -d redis
uvicorn main:app --reload --host 0.0.0.0 --port 8000
python worker.py
```

## Endpoints

- `GET /health`
- `POST /api/clip-generator/analyze`
- `POST /api/clip-generator/generate`
- `POST /api/ai-shorts/analyze`
- `POST /api/ai-shorts/generate`
- `POST /api/publish`
- `GET /api/jobs/{job_id}`

## Notes

- Jobs persist in SQLite (`tmp/jobs.db`) via job store.
- Queue execution is externalized with Redis + dedicated RQ worker.
- Artifacts are exposed under `/artifacts/*`.
- If `S3_ENABLED=true`, artifacts are uploaded to the configured S3 bucket and include `s3_url`.
- FFmpeg is used for real clip artifact generation when available.
- Provider integrations currently include:
  - Gemini request (real call if key exists)
  - fal.ai / ElevenLabs / Upload-Post auth-validated adapters
