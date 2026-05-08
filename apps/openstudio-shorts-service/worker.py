from __future__ import annotations

from rq import Connection, Worker
from app.queue import get_redis, QUEUE_NAME


def main() -> None:
  redis_conn = get_redis()
  with Connection(redis_conn):
    worker = Worker([QUEUE_NAME])
    worker.work()


if __name__ == "__main__":
  main()
