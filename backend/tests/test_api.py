"""Тести, які не потребують бази: перевіряють, що SQL-файли
знаходяться й розбираються, а API віддає їх перелік."""
from fastapi.testclient import TestClient

from app.main import app
from app.queries import load_widgets

client = TestClient(app)


def test_widgets_are_loaded():
    widgets = load_widgets()
    assert "kpi" in widgets
    assert "filter_options" in widgets
    assert widgets["kpi"].uses_filters is True
    assert widgets["filter_options"].uses_filters is False


def test_list_widgets_endpoint():
    response = client.get("/api/widgets")
    assert response.status_code == 200
    names = [w["name"] for w in response.json()]
    assert names[0] == "filter_options"
    assert "kpi" in names


def test_unknown_widget_returns_404():
    response = client.get("/api/widgets/does_not_exist")
    assert response.status_code == 404
