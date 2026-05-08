from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from threading import Lock
from uuid import uuid4
from .models import JobRecord


class JobStore:
  def __init__(self, db_path: str = "./tmp/jobs.db") -> None:
    self._lock = Lock()
    self._jobs: dict[str, JobRecord] = {}
    self._db_path = db_path
    self._init_db()

  def _init_db(self) -> None:
    Path(self._db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(self._db_path)
    conn.execute(
      """
      CREATE TABLE IF NOT EXISTS jobs (
        job_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        logs TEXT NOT NULL,
        result TEXT,
        error TEXT,
        created_at REAL,
        updated_at REAL
      )
      """
    )
    conn.commit()
    conn.close()

  def _save_db(self, job: JobRecord) -> None:
    conn = sqlite3.connect(self._db_path)
    conn.execute(
      """
      INSERT INTO jobs (job_id, status, logs, result, error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id) DO UPDATE SET
        status=excluded.status,
        logs=excluded.logs,
        result=excluded.result,
        error=excluded.error,
        updated_at=excluded.updated_at
      """,
      (
        job.job_id,
        job.status,
        json.dumps(job.logs),
        json.dumps(job.result) if job.result is not None else None,
        job.error,
        job.created_at,
        job.updated_at,
      ),
    )
    conn.commit()
    conn.close()

  def _load_db(self, job_id: str) -> JobRecord | None:
    conn = sqlite3.connect(self._db_path)
    row = conn.execute(
      "SELECT job_id,status,logs,result,error,created_at,updated_at FROM jobs WHERE job_id=?",
      (job_id,),
    ).fetchone()
    conn.close()
    if not row:
      return None
    return JobRecord(
      job_id=row[0],
      status=row[1],
      logs=json.loads(row[2] or "[]"),
      result=json.loads(row[3]) if row[3] else None,
      error=row[4],
      created_at=row[5],
      updated_at=row[6],
    )

  def create(self) -> JobRecord:
    with self._lock:
      now = time.time()
      job = JobRecord(job_id=uuid4().hex, created_at=now, updated_at=now)
      self._jobs[job.job_id] = job
      self._save_db(job)
      return job

  def get(self, job_id: str) -> JobRecord | None:
    with self._lock:
      cached = self._jobs.get(job_id)
      if cached:
        return cached
      loaded = self._load_db(job_id)
      if loaded:
        self._jobs[job_id] = loaded
      return loaded

  def update(self, job_id: str, **patch) -> JobRecord | None:
    with self._lock:
      current = self._jobs.get(job_id)
      if not current:
        current = self._load_db(job_id)
        if not current:
          return None
      data = current.model_dump()
      data.update(patch)
      data["updated_at"] = time.time()
      updated = JobRecord(**data)
      self._jobs[job_id] = updated
      self._save_db(updated)
      return updated

  def append_log(self, job_id: str, line: str) -> JobRecord | None:
    with self._lock:
      current = self._jobs.get(job_id)
      if not current:
        current = self._load_db(job_id)
        if not current:
          return None
      data = current.model_dump()
      logs = list(data.get("logs", []))
      logs.append(line)
      data["logs"] = logs
      data["updated_at"] = time.time()
      updated = JobRecord(**data)
      self._jobs[job_id] = updated
      self._save_db(updated)
      return updated


job_store = JobStore()
