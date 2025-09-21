from pydantic import BaseModel
from typing import List, Optional

class BulkUpdateSchema(BaseModel):
    ids: List[int]
    action: str # "CLOSE", "ASSIGN", "PRIORITY"
    value: str # "CERRADO", "juan@...", "ALTO"
