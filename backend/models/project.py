from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class File(BaseModel):
    path: str
    content: str
    language: str = "javascript"

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    files: Optional[List[File]] = []
    steps: Optional[List[str]] = []

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    messages: List[Message] = []
    files: List[File] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str
    session_id: str
    project_id: Optional[str] = None

class GenerateCodeRequest(BaseModel):
    prompt: str
    session_id: str
    project_id: Optional[str] = None
    model: Optional[str] = None  # e.g. "gpt-4o-mini", "gpt-4o", "claude-sonnet-4-5", "gemini-2.0-flash"
