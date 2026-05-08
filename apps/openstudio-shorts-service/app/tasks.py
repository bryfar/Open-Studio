from __future__ import annotations

import asyncio
from pathlib import Path
from app.job_store import job_store
from app.pipelines import (
  analyze_ai_shorts_pipeline,
  analyze_clip_pipeline,
  generate_ai_shorts_pipeline,
  generate_clip_pipeline,
)
from app.storage import upload_file_to_s3


def run_clip_analyze_task(job_id: str, source_path: str, filename: str, target_platform: str, gemini_key: str | None):
  job_store.update(job_id, status="processing")
  job_store.append_log(job_id, "Worker started clip analyze.")
  try:
    class _Upload:
      def __init__(self, path: str, name: str):
        self.filename = name
        self.file = open(path, "rb")

    upload = _Upload(source_path, filename)
    result = asyncio.run(analyze_clip_pipeline(upload, target_platform, gemini_key))
    result["source_path"] = source_path
    job_store.update(job_id, status="complete", result=result)
    job_store.append_log(job_id, "Clip analyze complete.")
  except Exception as err:
    job_store.update(job_id, status="failed", error=str(err))
    job_store.append_log(job_id, f"Clip analyze failed: {err}")


def run_clip_generate_task(job_id: str, analyzed_result: dict, target_platform: str, output_dir: str):
  job_store.update(job_id, status="processing")
  job_store.append_log(job_id, "Worker started clip generate.")
  try:
    result = asyncio.run(generate_clip_pipeline(analyzed_result, target_platform, output_dir))
    for artifact in result.get("artifacts", []):
      local_path = artifact.get("path")
      artifact["url"] = f"/artifacts/{job_id}/{Path(local_path).name}"
      s3_url = upload_file_to_s3(local_path, key_prefix=f"clips/{job_id}")
      if s3_url:
        artifact["s3_url"] = s3_url
    job_store.update(job_id, status="complete", result=result)
    job_store.append_log(job_id, "Clip generation complete.")
  except Exception as err:
    job_store.update(job_id, status="failed", error=str(err))
    job_store.append_log(job_id, f"Clip generate failed: {err}")


def run_ai_analyze_task(job_id: str, payload: dict, gemini_key: str | None):
  job_store.update(job_id, status="processing")
  job_store.append_log(job_id, "Worker started AI analyze.")
  try:
    result = asyncio.run(analyze_ai_shorts_pipeline(payload, gemini_key))
    job_store.update(job_id, status="complete", result=result)
    job_store.append_log(job_id, "AI analyze complete.")
  except Exception as err:
    job_store.update(job_id, status="failed", error=str(err))
    job_store.append_log(job_id, f"AI analyze failed: {err}")


def run_ai_generate_task(
  job_id: str,
  selected_script: dict,
  video_mode: str,
  fal_key: str | None,
  elevenlabs_key: str | None,
  output_dir: str,
):
  job_store.update(job_id, status="processing")
  job_store.append_log(job_id, "Worker started AI generate.")
  try:
    result = asyncio.run(
      generate_ai_shorts_pipeline(
        selected_script=selected_script,
        video_mode=video_mode,
        fal_key=fal_key,
        elevenlabs_key=elevenlabs_key,
        output_dir=output_dir,
      )
    )
    for artifact in result.get("artifacts", []):
      local_path = artifact.get("path")
      artifact["url"] = f"/artifacts/{job_id}/{Path(local_path).name}"
      s3_url = upload_file_to_s3(local_path, key_prefix=f"ai-shorts/{job_id}")
      if s3_url:
        artifact["s3_url"] = s3_url
    if result.get("video_url"):
      result["video_url"] = f"/artifacts/{job_id}/{Path(result['video_url']).name}"
    job_store.update(job_id, status="complete", result=result)
    job_store.append_log(job_id, "AI generate complete.")
  except Exception as err:
    job_store.update(job_id, status="failed", error=str(err))
    job_store.append_log(job_id, f"AI generate failed: {err}")
