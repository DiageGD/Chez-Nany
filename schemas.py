from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date, time

REOPENING_DATE = date(2026, 9, 3)

class ReservationCreate(BaseModel):
    client_firstname: str = Field(..., min_length=2, max_length=50, example="Jean")
    client_lastname: str = Field(..., min_length=2, max_length=50, example="Dupont")
    client_email: EmailStr = Field(..., example="jean.dupont@example.com")
    client_phone: str = Field(..., min_length=8, max_length=20, example="0612345678")
    reservation_date: date = Field(..., example="2026-09-03")
    reservation_time: time = Field(..., example="19:30:00")
    people_count: int = Field(..., ge=1, le=10, description="Nombre de personnes (1 à 10)")
    is_terrace: bool = Field(default=False)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("reservation_date")
    @classmethod
    def validate_reservation_date(cls, v: date) -> date:
        if v < REOPENING_DATE:
            raise ValueError(
                f"Le restaurant est actuellement fermé. Les réservations ouvrent à partir du {REOPENING_DATE.strftime('%d/%m/%Y')}."
            )
        return v


class ReservationResponse(ReservationCreate):
    id: int
    status: str

    class Config:
        from_attributes = True

class ClientAuth(BaseModel):
    client_email: EmailStr
    client_phone: str

class TableCreate(BaseModel):
    capacity: int = Field(..., ge=1, le=20)
    is_terrace: bool = False
    is_active: bool = True