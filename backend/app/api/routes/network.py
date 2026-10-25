from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.db import get_db
from app.models import POP, Zone, User
from app.schemas.network import POPRead, TopologyResponse, ZoneRead

router = APIRouter()


@router.get("/zones", response_model=dict[str, list[ZoneRead]])
def list_zones(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> dict[str, list[ZoneRead]]:
    zones = db.scalars(select(Zone).order_by(Zone.id)).all()
    return {"items": [ZoneRead.model_validate(zone) for zone in zones]}


@router.get("/pops", response_model=dict[str, list[POPRead]])
def list_pops(
    zone_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> dict[str, list[POPRead]]:
    query = select(POP).order_by(POP.id)
    if zone_id is not None:
        query = query.where(POP.zone_id == zone_id)
    pops = db.scalars(query).all()
    return {"items": [POPRead.model_validate(pop) for pop in pops]}


@router.get("/topology", response_model=TopologyResponse)
def topology(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> TopologyResponse:
    zones = db.scalars(select(Zone).order_by(Zone.id)).all()
    pops = db.scalars(select(POP).order_by(POP.id)).all()
    return TopologyResponse(
        zones=[ZoneRead.model_validate(zone) for zone in zones],
        pops=[POPRead.model_validate(pop) for pop in pops],
    )
