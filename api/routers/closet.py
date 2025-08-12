from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlmodel import Session, select
from ..db import engine
from ..models import ClosetItem

router = APIRouter(prefix="/closet", tags=["closet"])

class ClosetItemIn(BaseModel):
    user_id: str = "demo"            # single-user skeleton
    name: str
    category: str                    # top|bottom|outerwear|shoes|accessory
    subcategory: Optional[str] = None
    colors: Optional[str] = None
    formality: Optional[str] = None
    warmth: int = 3
    waterproof: bool = False
    image_url: Optional[str] = None

@router.get("", response_model=List[ClosetItem])
def list_items(user_id: str = "demo"):
    with Session(engine) as s:
        return s.exec(select(ClosetItem).where(ClosetItem.user_id == user_id)).all()

@router.post("", response_model=ClosetItem)
def create_item(data: ClosetItemIn):
    item = ClosetItem(**data.model_dump())
    with Session(engine) as s:
        s.add(item)
        s.commit()
        s.refresh(item)
        return item

@router.delete("/{item_id}")
def delete_item(item_id: str, user_id: str = "demo"):
    with Session(engine) as s:
        obj = s.get(ClosetItem, item_id)
        if not obj or obj.user_id != user_id:
            raise HTTPException(status_code=404, detail="Not found")
        s.delete(obj)
        s.commit()
        return {"ok": True}
