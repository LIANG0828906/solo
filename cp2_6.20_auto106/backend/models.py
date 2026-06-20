from pydantic import BaseModel
from typing import Dict, List, Optional


class Consumable(BaseModel):
    id: str
    code: str
    name: str
    currentStock: int
    safetyThreshold: int
    unit: str
    category: str
    lastCheckTime: str
    purchaseCycle: int
    dailyConsumption: float


class StockRecord(BaseModel):
    id: str
    consumableId: str
    consumableName: str
    type: str
    quantity: int
    timestamp: str
    operator: str
    remark: str


class StockCheckRequest(BaseModel):
    consumableId: str
    type: str
    quantity: int
    remark: Optional[str] = None


consumables_db: Dict[str, Consumable] = {}
records_db: List[StockRecord] = []
