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
    is_v2: bool = False

class ChatRequest(BaseModel):
    message: str
    session_id: str
    project_id: Optional[str] = None
    is_v2: bool = False

class GenerateCodeRequest(BaseModel):
    prompt: str
    session_id: str
    project_id: Optional[str] = None
    model: Optional[str] = None
    is_v2: bool = False
    fullstack_mode: bool = False
