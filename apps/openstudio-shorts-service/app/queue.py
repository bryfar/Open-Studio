from __future__ import annotations

import os
from redis import Redis
from rq import Queue


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_NAME = os.getenv("RQ_QUEUE_NAME", "openshorts")


def get_redis() -> Redis:
  return Redis.from_url(REDIS_URL)


def get_queue() -> Queue:
  return Queue(QUEUE_NAME, connection=get_redis())
