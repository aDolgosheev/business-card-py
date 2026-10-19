import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.contact import ContactRequest, ContactResponse, save_message
from app.db import init_db
from app.profile import load_profile

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

STATIC_DIR = Path(__file__).with_name("static")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Сайт-визитка", lifespan=lifespan)


def problem(detail: str, **extra: Any) -> JSONResponse:
    """Ответ об ошибке в том же формате, что ProblemDetail у Spring: его ждёт фронтенд."""
    body = {"title": "Bad Request", "status": 400, "detail": detail, **extra}
    return JSONResponse(body, status_code=400, media_type="application/problem+json")


@app.exception_handler(RequestValidationError)
async def handle_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors: dict[str, str] = {}
    for error in exc.errors():
        if error["type"] == "json_invalid" or error["loc"] == ("body",):
            return problem("Некорректное тело запроса")
        field = str(error["loc"][-1])
        message = error["msg"] if error["type"] in {"required", "too_long", "email"} \
            else "Некорректное значение"
        errors.setdefault(field, message)
    return problem("Проверьте поля формы", errors=errors)


@app.get("/api/profile")
def get_profile() -> dict[str, Any]:
    return load_profile()


@app.post("/api/contact", status_code=status.HTTP_201_CREATED)
def send_contact(request: ContactRequest) -> ContactResponse:
    return save_message(request)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


# Статику монтируем последней, чтобы она не перекрывала /api.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
