# api/routers/recommend.py
from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Optional, List, Dict
import random

from ..db import engine
from ..models import ClosetItem

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

# --------- Request / Response models ---------

class Req(BaseModel):
    occasion: str  # casual | business | formal | athleisure
    temp_c: Optional[float] = None
    raining: Optional[bool] = None
    user_id: str = "demo"  # single-user skeleton

class OutfitItem(BaseModel):
    id: str
    name: str
    category: str

class Outfit(BaseModel):
    occasion: str
    items: List[OutfitItem]
    notes: Optional[str] = None

# --------- Simple rules / helpers ---------

NEUTRALS = {"black", "white", "gray", "grey", "navy", "beige", "tan", "khaki", "denim", "brown", "cream"}

FORMALITY_BY_OCCASION: Dict[str, List[str]] = {
    "casual": ["casual", "athleisure", None, ""],
    "athleisure": ["athleisure", "casual", None, ""],
    "business": ["business", "formal", None, ""],
    "formal": ["formal", None, ""],
}

def csv_colors_to_set(csv_str: Optional[str]) -> set:
    if not csv_str:
        return set()
    return {c.strip().lower() for c in csv_str.split(",") if c.strip()}

def is_neutral_item(item: ClosetItem) -> bool:
    return any(c in NEUTRALS for c in csv_colors_to_set(item.colors))

def formality_ok(item: ClosetItem, occasion: str) -> bool:
    target = FORMALITY_BY_OCCASION.get(occasion.lower(), ["casual", "athleisure", None, ""])
    return (item.formality or "") in target

def pick_one(items: List[ClosetItem]) -> Optional[ClosetItem]:
    return random.choice(items) if items else None

# --------- Recommendation endpoint ---------

@router.post("", response_model=Outfit)
def recommend(req: Req):
    """
    Rule-based v0:
      - Filter by occasion
      - Choose top + bottom + shoes
      - Add outerwear if cold (< 12°C) or raining
      - Prefer at least one neutral piece
    """
    with Session(engine) as s:
        all_items = s.exec(
            select(ClosetItem).where(ClosetItem.user_id == req.user_id)
        ).all()

    # 1) Filter by formality for the occasion
    pool = [i for i in all_items if formality_ok(i, req.occasion)]

    # 2) Group by category
    groups: Dict[str, List[ClosetItem]] = {}
    for i in pool:
        groups.setdefault(i.category.lower(), []).append(i)

    tops = groups.get("top", [])
    bottoms = groups.get("bottom", [])
    shoes = groups.get("shoes", []) or groups.get("shoe", [])
    outerwear = groups.get("outerwear", []) or groups.get("jacket", []) or groups.get("coat", [])

    # 3) If we can’t make a basic outfit, return empty with note
    if not tops or not bottoms:
        return Outfit(occasion=req.occasion, items=[], notes="Add at least one top and one bottom to your closet.")

    # 4) Build some candidate combos and score them
    candidates = []
    for t in tops:
        for b in bottoms:
            # Basic color sanity: avoid 2 very bright, non-neutral clashing colors (super simple)
            t_colors = csv_colors_to_set(t.colors)
            b_colors = csv_colors_to_set(b.colors)
            neutral_score = int(is_neutral_item(t)) + int(is_neutral_item(b))

            chosen_shoes = pick_one(shoes) if shoes else None
            if chosen_shoes:
                neutral_score += int(is_neutral_item(chosen_shoes))

            add_outer = False
            if (req.temp_c is not None and req.temp_c < 12) or (req.raining is True):
                # only add if we have one that matches formality
                ow = pick_one(outerwear)
                if ow:
                    add_outer = True
                    neutral_score += int(is_neutral_item(ow))

            combo = [t, b]
            if chosen_shoes:
                combo.append(chosen_shoes)
            if add_outer:
                combo.append(ow)  # type: ignore[name-defined]

            # Simple preference: more neutrals = higher score
            # Tie-breaker: random small jitter so choices vary
            score = neutral_score + random.random() * 0.1
            candidates.append((score, combo))

    if not candidates:
        return Outfit(occasion=req.occasion, items=[], notes="Not enough items that match the occasion.")

    best = max(candidates, key=lambda x: x[0])[1]

    return Outfit(
        occasion=req.occasion,
        items=[OutfitItem(id=i.id, name=i.name, category=i.category) for i in best],
        notes="Added outerwear for weather." if any(i.category.lower() in {"outerwear", "jacket", "coat"} for i in best) else None,
    )
