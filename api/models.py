from typing import Optional
from sqlmodel import SQLModel, Field
import uuid

class ClosetItem(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str
    name: str
    category: str
    subcategory: Optional[str] = None
    colors: Optional[str] = None
    formality: Optional[str] = None
    warmth: int = 3
    waterproof: bool = False
    image_url: Optional[str] = None