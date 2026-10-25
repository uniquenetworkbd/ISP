from pydantic import BaseModel, ConfigDict


class ZoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status: str


class POPRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    zone_id: int
    name: str
    status: str


class TopologyResponse(BaseModel):
    zones: list[ZoneRead]
    pops: list[POPRead]
