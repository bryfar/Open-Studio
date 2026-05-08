from __future__ import annotations

import asyncio
import shutil
import subprocess
from pathlib import Path
from fastapi import UploadFile
from .providers import (
  gemini_generate,
  fal_generate_stub,
  elevenlabs_tts_stub,
)


async def analyze_clip_pipeline(file: UploadFile, target_platform: str, gemini_key: str | None) -> dict:
  prompt = (
    "Analyze this long-form content and propose 3 viral moments for "
    f"{target_platform}. Return concise bullet points."
  )
  analysis = await gemini_generate(prompt, gemini_key)
  return {
    "filename": file.filename,
    "source_path": "",
    "target_platform": target_platform,
    "analysis": analysis,
    "moments": [
      {"start": 12, "end": 38, "hook": "Strong opening statement"},
      {"start": 54, "end": 80, "hook": "Contrarian insight"},
      {"start": 101, "end": 130, "hook": "Actionable checklist"},
    ],
  }


async def generate_clip_pipeline(existing_analysis: dict, target_platform: str, output_dir: str) -> dict:
  await asyncio.sleep(0.3)
  moments = existing_analysis.get("moments", [])
  source_path = existing_analysis.get("source_path")
  output_path = Path(output_dir)
  output_path.mkdir(parents=True, exist_ok=True)
  clips = [
    {
      "index": idx + 1,
      "start": m["start"],
      "end": m["end"],
      "duration": m["end"] - m["start"],
      "target_platform": target_platform,
    }
    for idx, m in enumerate(moments)
  ]
  rendered = []
  for clip in clips:
    clip_name = f"clip_{clip['index']}.mp4"
    clip_path = output_path / clip_name
    if source_path and Path(source_path).exists():
      ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        str(clip["start"]),
        "-i",
        source_path,
        "-t",
        str(clip["duration"]),
        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-c:a",
        "aac",
        str(clip_path),
      ]
      try:
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
      except Exception:
        shutil.copy(source_path, clip_path)
    rendered.append({"name": clip_name, "path": str(clip_path)})
  return {"clips": clips, "count": len(clips), "artifacts": rendered}


async def analyze_ai_shorts_pipeline(payload: dict, gemini_key: str | None) -> dict:
  source = payload.get("url") or payload.get("description") or "general product"
  prompt = (
    "Generate short-form ad concepts with hook-problem-solution-cta for: "
    f"{source}. Language={payload.get('language', 'en')}, style={payload.get('style', 'ugc')}."
  )
  ideas = await gemini_generate(prompt, gemini_key)
  num_scripts = int(payload.get("num_scripts", 3))
  scripts = [
    {
      "title": f"Script {i + 1}",
      "duration_seconds": 30 + (i % 2) * 8,
      "style": payload.get("style", "ugc"),
      "target_platform": "tiktok",
      "full_narration": f"Hook {i + 1}. Problem. Solution. CTA.",
      "actor_description": f"{payload.get('actor_gender', 'female')} creator with confident tone",
    }
    for i in range(max(1, min(num_scripts, 8)))
  ]
  return {"analysis": ideas, "scripts": scripts}


async def generate_ai_shorts_pipeline(
  selected_script: dict,
  video_mode: str,
  fal_key: str | None,
  elevenlabs_key: str | None,
  output_dir: str | None = None,
) -> dict:
  fal = await fal_generate_stub(selected_script.get("actor_description", ""), fal_key)
  tts = await elevenlabs_tts_stub(selected_script.get("full_narration", ""), elevenlabs_key)
  await asyncio.sleep(0.4)
  artifacts = []
  if output_dir:
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    video_path = out_dir / "ai_short.mp4"
    meta_path = out_dir / "ai_short.txt"
    try:
      subprocess.run(
        [
          "ffmpeg",
          "-y",
          "-f",
          "lavfi",
          "-i",
          "color=c=black:s=1080x1920:d=4",
          "-vf",
          "drawtext=text='AI SHORT':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2",
          str(video_path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
      )
    except Exception:
      video_path.write_bytes(b"")
    meta_path.write_text(selected_script.get("full_narration", ""), encoding="utf-8")
    artifacts = [{"name": "ai_short.mp4", "path": str(video_path)}, {"name": "ai_short.txt", "path": str(meta_path)}]
  return {
    "video_mode": video_mode,
    "script": selected_script,
    "providers": {"fal": fal, "elevenlabs": tts},
    "video_url": str(video_path) if output_dir else None,
    "artifacts": artifacts,
  }
