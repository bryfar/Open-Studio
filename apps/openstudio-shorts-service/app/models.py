from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


JobStatus = Literal["queued", "processing", "complete", "failed"]


class JobRecord(BaseModel):
  job_id: str
  status: JobStatus = "queued"
  logs: list[str] = Field(default_factory=list)
  result: dict[str, Any] | None = None
  error: str | None = None
  created_at: float | None = None
  updated_at: float | None = None


class ClipGenerateRequest(BaseModel):
  job_id: str
  target_platform: str = "youtube"


class AIAnalyzeRequest(BaseModel):
  url: str | None = None
  description: str | None = None
  num_scripts: int = 3
  style: str = "ugc"
  language: str = "en"
  actor_gender: str = "female"


class AIGenerateRequest(BaseModel):
  job_id: str
  selected_script: int = 0
  video_mode: Literal["lowcost", "premium"] = "lowcost"
  voice_id: str | None = None
  actor_description: str | None = None


class PublishRequest(BaseModel):
  job_id: str
  platforms: list[str]
  schedule_at: str | None = None
