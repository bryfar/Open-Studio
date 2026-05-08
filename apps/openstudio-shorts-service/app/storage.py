from __future__ import annotations

import os
from pathlib import Path
import boto3


def s3_enabled() -> bool:
  return os.getenv("S3_ENABLED", "false").lower() == "true"


def upload_file_to_s3(local_path: str, key_prefix: str = "openshorts") -> str | None:
  if not s3_enabled():
    return None
  bucket = os.getenv("S3_BUCKET")
  region = os.getenv("AWS_REGION", "us-east-1")
  endpoint_url = os.getenv("S3_ENDPOINT_URL")
  if not bucket:
    return None

  file_path = Path(local_path)
  key = f"{key_prefix}/{file_path.name}"

  client = boto3.client(
    "s3",
    region_name=region,
    endpoint_url=endpoint_url or None,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
  )
  extra = {"ContentType": "video/mp4"} if file_path.suffix.lower() == ".mp4" else {}
  client.upload_file(str(file_path), bucket, key, ExtraArgs=extra)

  public_base = os.getenv("S3_PUBLIC_BASE_URL")
  if public_base:
    return f"{public_base.rstrip('/')}/{key}"
  if endpoint_url:
    return f"{endpoint_url.rstrip('/')}/{bucket}/{key}"
  return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
