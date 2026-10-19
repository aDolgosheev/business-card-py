import sqlite3

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.main import app

    with TestClient(app) as c:
        yield c


def messages(tmp_path):
    with sqlite3.connect(tmp_path / "test.db") as conn:
        return conn.execute("SELECT name, email, message FROM contact_messages").fetchall()


def test_profile_is_served_from_config(client):
    res = client.get("/api/profile")
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Александр Долгошеев"
    assert "github" in [c["type"] for c in body["contacts"]]
    assert body["projects"][0]["name"]
    assert body["experience"][0]["company"]
    assert body["experience"][0]["highlights"]


def test_index_page_is_served(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "<title>Александр Долгошеев" in res.text


def test_valid_message_is_saved(client, tmp_path):
    res = client.post(
        "/api/contact",
        json={"name": " Иван ", "email": "ivan@example.com", "message": "Есть вакансия"},
    )
    assert res.status_code == 201
    assert isinstance(res.json()["id"], int)
    assert messages(tmp_path) == [("Иван", "ivan@example.com", "Есть вакансия")]


def test_invalid_message_returns_field_errors(client, tmp_path):
    res = client.post(
        "/api/contact", json={"name": "", "email": "not-an-email", "message": "Привет"}
    )
    assert res.status_code == 400
    errors = res.json()["errors"]
    assert errors == {"name": "Укажите имя", "email": "Некорректный email"}
    assert messages(tmp_path) == []


def test_missing_fields_are_reported(client):
    res = client.post("/api/contact", json={})
    assert res.status_code == 400
    assert set(res.json()["errors"]) == {"name", "email", "message"}


def test_malformed_json_returns_bad_request(client):
    res = client.post(
        "/api/contact", content="{oops", headers={"Content-Type": "application/json"}
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Некорректное тело запроса"
