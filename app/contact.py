import logging
import re
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_core import PydanticCustomError

from app.db import connect

log = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _required(value: str, max_len: int, empty_msg: str, long_msg: str) -> str:
    value = value.strip()
    if not value:
        raise PydanticCustomError("required", empty_msg)
    if len(value) > max_len:
        raise PydanticCustomError("too_long", long_msg)
    return value


class ContactRequest(BaseModel):
    # Без этого валидаторы не срабатывают на отсутствующих полях, и пустой {} проходит.
    model_config = ConfigDict(validate_default=True)

    name: str = ""
    email: str = ""
    message: str = ""

    @field_validator("name")
    @classmethod
    def check_name(cls, v: str) -> str:
        return _required(v, 100, "Укажите имя", "Имя не длиннее 100 символов")

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        v = _required(v, 200, "Укажите email", "Email не длиннее 200 символов")
        if not EMAIL_RE.match(v):
            raise PydanticCustomError("email", "Некорректный email")
        return v

    @field_validator("message")
    @classmethod
    def check_message(cls, v: str) -> str:
        return _required(v, 2000, "Напишите сообщение", "Сообщение не длиннее 2000 символов")


class ContactResponse(BaseModel):
    id: int
    createdAt: datetime


def save_message(request: ContactRequest) -> ContactResponse:
    created_at = datetime.now(UTC)
    with connect() as conn:
        cursor = conn.execute(
            "INSERT INTO contact_messages (name, email, message, created_at) VALUES (?, ?, ?, ?)",
            (request.name, request.email, request.message, created_at.isoformat()),
        )
    log.info("Новое сообщение #%s от %s <%s>", cursor.lastrowid, request.name, request.email)
    return ContactResponse(id=cursor.lastrowid, createdAt=created_at)
