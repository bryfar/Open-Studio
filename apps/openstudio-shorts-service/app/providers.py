from __future__ import annotations

import os
import httpx


async def gemini_generate(prompt: str, api_key: str | None) -> str:
  key = api_key or os.getenv("GEMINI_API_KEY", "")
  if not key:
    return "Gemini key missing; fallback response used."
  url = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent"
  )
  payload = {"contents": [{"parts": [{"text": prompt}]}]}
  async with httpx.AsyncClient(timeout=45) as client:
    res = await client.post(f"{url}?key={key}", json=payload)
    res.raise_for_status()
    data = res.json()
  candidates = data.get("candidates", [])
  if not candidates:
    return "No Gemini candidate."
  return (
    candidates[0]
    .get("content", {})
    .get("parts", [{}])[0]
    .get("text", "Empty Gemini response.")
  )


async def fal_generate_stub(description: str, api_key: str | None) -> dict:
  key = api_key or os.getenv("FAL_KEY", "")
  if not key:
    return {"provider": "fal", "status": "missing_key", "detail": "FAL_KEY missing"}
  async with httpx.AsyncClient(timeout=40) as client:
    res = await client.get(
      "https://fal.run/fal-ai/flux/schnell",
      headers={"Authorization": f"Key {key}"},
    )
  if res.status_code >= 400:
    return {"provider": "fal", "status": "error", "detail": f"fal auth/status {res.status_code}"}
  return {"provider": "fal", "status": "validated", "detail": description}


async def elevenlabs_tts_stub(text: str, api_key: str | None) -> dict:
  key = api_key or os.getenv("ELEVENLABS_API_KEY", "")
  if not key:
    return {"provider": "elevenlabs", "status": "missing_key", "detail": "ELEVENLABS_API_KEY missing"}
  async with httpx.AsyncClient(timeout=40) as client:
    res = await client.get(
      "https://api.elevenlabs.io/v1/voices",
      headers={"xi-api-key": key},
    )
  if res.status_code >= 400:
    return {"provider": "elevenlabs", "status": "error", "detail": f"elevenlabs auth/status {res.status_code}"}
  return {"provider": "elevenlabs", "status": "validated", "chars": len(text)}


async def upload_post_stub(job_id: str, platforms: list[str], api_key: str | None) -> dict:
  key = api_key or os.getenv("UPLOAD_POST_API_KEY", "")
  if not key:
    return {"ok": False, "detail": "UPLOAD_POST_API_KEY missing"}
  async with httpx.AsyncClient(timeout=40) as client:
    res = await client.get(
      "https://app.upload-post.com/api/v1/profile",
      headers={"Authorization": f"Bearer {key}"},
    )
  if res.status_code >= 400:
    return {"ok": False, "detail": f"Upload-Post auth/status {res.status_code}"}
  return {"ok": True, "detail": f"Publish queued for {job_id} -> {', '.join(platforms)}"}
