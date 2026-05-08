from __future__ import annotations

import os
import shutil
from pathlib import Path
from fastapi import Body, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from rq import Retry

from app.job_store import job_store
from app.models import (
  AIAnalyzeRequest,
  AIGenerateRequest,
  ClipGenerateRequest,
  PublishRequest,
)
from app.providers import upload_post_stub
from app.queue import get_queue
from app.tasks import (
  run_ai_analyze_task,
  run_ai_generate_task,
  run_clip_analyze_task,
  run_clip_generate_task,
)

app = FastAPI(title="OpenShorts Service", version="0.1.0")
TMP_DIR = Path(os.getenv("TEMP_DIR", "./tmp"))
UPLOAD_DIR = TMP_DIR / "uploads"
ARTIFACTS_DIR = TMP_DIR / "artifacts"
for d in (TMP_DIR, UPLOAD_DIR, ARTIFACTS_DIR):
  d.mkdir(parents=True, exist_ok=True)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
app.mount("/artifacts", StaticFiles(directory=str(ARTIFACTS_DIR), html=False), name="artifacts")


def _must_job(job_id: str):
  job = job_store.get(job_id)
  if not job:
    raise HTTPException(status_code=404, detail="Job not found")
  return job


@app.get("/health")
async def health():
  return {"ok": True}


@app.post("/api/clip-generator/analyze")
async def clip_analyze(
  file: UploadFile = File(...),
  target_platform: str = "youtube",
  x_gemini_key: str | None = Header(default=None),
):
  saved_path = UPLOAD_DIR / f"{target_platform}_{file.filename or 'input.mp4'}"
  with saved_path.open("wb") as out:
    shutil.copyfileobj(file.file, out)

  job = job_store.create()
  job_store.append_log(job.job_id, "Queued clip analyze job.")
  queue = get_queue()
  queue.enqueue(
    run_clip_analyze_task,
    job.job_id,
    str(saved_path),
    file.filename or "input.mp4",
    target_platform,
    x_gemini_key,
    retry=Retry(max=2, interval=[10, 30]),
    job_id=job.job_id,
  )
  return {"job_id": job.job_id}


@app.post("/api/clip-generator/generate")
async def clip_generate(payload: ClipGenerateRequest):
  analyzed_job = _must_job(payload.job_id)
  if analyzed_job.status != "complete" or not analyzed_job.result:
    raise HTTPException(status_code=400, detail="Analyze job must be complete before generate.")
  job = job_store.create()
  job_store.append_log(job.job_id, "Queued clip generation job.")
  queue = get_queue()
  queue.enqueue(
    run_clip_generate_task,
    job.job_id,
    analyzed_job.result,
    payload.target_platform,
    str(ARTIFACTS_DIR / job.job_id),
    retry=Retry(max=2, interval=[10, 30]),
    job_id=job.job_id,
  )
  return {"job_id": job.job_id}


@app.post("/api/ai-shorts/analyze")
async def ai_analyze(
  payload: AIAnalyzeRequest,
  x_gemini_key: str | None = Header(default=None),
):
  job = job_store.create()
  job_store.append_log(job.job_id, "Queued AI Shorts analyze job.")
  queue = get_queue()
  queue.enqueue(
    run_ai_analyze_task,
    job.job_id,
    payload.model_dump(),
    x_gemini_key,
    retry=Retry(max=2, interval=[10, 30]),
    job_id=job.job_id,
  )
  return {"job_id": job.job_id}


@app.post("/api/ai-shorts/generate")
async def ai_generate(
  payload: AIGenerateRequest,
  x_fal_key: str | None = Header(default=None),
  x_elevenlabs_key: str | None = Header(default=None),
):
  analyze_job = _must_job(payload.job_id)
  if analyze_job.status != "complete" or not analyze_job.result:
    raise HTTPException(status_code=400, detail="Analyze job must be complete before generate.")
  scripts = analyze_job.result.get("scripts", [])
  if not scripts:
    raise HTTPException(status_code=400, detail="No scripts available from analyze step.")
  script_idx = max(0, min(payload.selected_script, len(scripts) - 1))
  selected_script = scripts[script_idx]
  job = job_store.create()
  job_store.append_log(job.job_id, "Queued AI Shorts generation job.")
  queue = get_queue()
  queue.enqueue(
    run_ai_generate_task,
    job.job_id,
    selected_script,
    payload.video_mode,
    x_fal_key,
    x_elevenlabs_key,
    str(ARTIFACTS_DIR / job.job_id),
    retry=Retry(max=2, interval=[10, 30]),
    job_id=job.job_id,
  )
  return {"job_id": job.job_id}


@app.post("/api/publish")
async def publish(payload: PublishRequest, x_upload_post_key: str | None = Header(default=None)):
  _must_job(payload.job_id)
  result = await upload_post_stub(payload.job_id, payload.platforms, x_upload_post_key)
  if not result.get("ok"):
    raise HTTPException(status_code=400, detail=result.get("detail", "Publish failed"))
  return result


@app.get("/api/jobs/{job_id}")
async def job_status(job_id: str):
  job = _must_job(job_id)
  return job.model_dump()


@app.post("/api/transcribe")
async def transcribe(payload: dict = Body(...)):
  language = payload.get("language", "es")
  # MVP ASR deterministic segments; reemplazable por whisper/faster-whisper.
  segments = [
    {"start": 0.0, "end": 2.8, "text": "Hook inicial para captar atención."},
    {"start": 2.8, "end": 6.2, "text": "Problema principal del usuario ideal."},
    {"start": 6.2, "end": 10.4, "text": "Solución clara con beneficio concreto."},
    {"start": 10.4, "end": 13.6, "text": "Llamado a la acción final."},
  ]
  return {"ok": True, "language": language, "segments": segments}
