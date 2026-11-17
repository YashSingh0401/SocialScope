"""Canonical input contract shared by future importers and connectors."""

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Engagement(BaseModel):
    model_config = ConfigDict(extra="forbid")
    # Unknown metrics remain null; zero means an observed zero.
    likes: int | None = Field(default=None, ge=0)
    shares: int | None = Field(default=None, ge=0)
    replies: int | None = Field(default=None, ge=0)
    views: int | None = Field(default=None, ge=0)


class Interaction(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    kind: Literal["reply", "share", "mention"]
    target_type: Literal["event", "actor"]
    target_source_id: str = Field(min_length=1)
    target_platform: str = Field(min_length=1)


class CanonicalEvent(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    platform: str = Field(min_length=1, max_length=64)
    source_id: str = Field(min_length=1, max_length=512)
    actor_ref: str | None = Field(default=None, min_length=1)
    timestamp: datetime
    text: str = Field(min_length=1, max_length=100_000)
    language: str | None = Field(default=None, min_length=2, max_length=32)
    hashtags: list[str] = Field(default_factory=list)
    urls: list[str] = Field(default_factory=list)
    engagement: Engagement = Field(default_factory=Engagement)
    interactions: list[Interaction] = Field(default_factory=list)

    @field_validator("timestamp")
    @classmethod
    def normalize_timestamp(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must include a timezone")
        return value.astimezone(timezone.utc)
