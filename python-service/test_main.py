"""
Tests for the Market Data Explorer Python FastAPI service.
"""

import io
import os
import tempfile

import pandas as pd
import pyarrow as pa
import pyarrow.feather as feather
import pytest
from fastapi.testclient import TestClient

from main import app, _current_df

client = TestClient(app)


def _create_test_feather() -> bytes:
    """Create a minimal valid Feather file in memory."""
    df = pd.DataFrame({
        "date": pd.to_datetime(["2026-06-01 09:15:00+05:30", "2026-06-01 09:16:00+05:30",
                                "2026-06-01 09:15:00+05:30", "2026-06-01 09:16:00+05:30",
                                "2026-06-01 09:15:00+05:30"]),
        "open": [100.0, 101.0, 200.0, 201.0, 300.0],
        "high": [102.0, 103.0, 202.0, 203.0, 302.0],
        "low": [99.0, 100.0, 199.0, 200.0, 299.0],
        "close": [101.0, 102.0, 201.0, 202.0, 301.0],
        "volume": [1000, 1100, 2000, 2100, 3000],
        "oi": [500, 550, 600, 650, 700],
        "symbol": ["NIFTY26JUN25000CE", "NIFTY26JUN25000CE",
                    "NIFTY26JUN25000PE", "NIFTY26JUN25000PE",
                    "NIFTY26JUNFUT"],
        "name": ["NIFTY", "NIFTY", "NIFTY", "NIFTY", "NIFTY"],
        "expiry": [pd.Timestamp("2026-06-26").date(), pd.Timestamp("2026-06-26").date(),
                   pd.Timestamp("2026-06-26").date(), pd.Timestamp("2026-06-26").date(),
                   pd.Timestamp("2026-06-30").date()],
        "strike": [25000.0, 25000.0, 25000.0, 25000.0, 0.0],
        "instrument_type": ["CE", "CE", "PE", "PE", "FUT"],
    })
    buf = io.BytesIO()
    feather.write_feather(df, buf)
    buf.seek(0)
    return buf.read()


class TestHealthEndpoint:
    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestUploadEndpoint:
    def test_upload_valid_feather(self):
        content = _create_test_feather()
        response = client.post(
            "/upload",
            files={"file": ("test.feather", content, "application/octet-stream")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rows"] == 5
        assert "columns" in data

    def test_upload_invalid_extension(self):
        response = client.post(
            "/upload",
            files={"file": ("test.csv", b"a,b,c\n1,2,3", "text/csv")},
        )
        assert response.status_code == 400
        assert "feather" in response.json()["detail"].lower()

    def test_upload_invalid_feather_content(self):
        response = client.post(
            "/upload",
            files={"file": ("bad.feather", b"not a feather file", "application/octet-stream")},
        )
        assert response.status_code == 400


class TestMetadataEndpoint:
    def setup_method(self):
        """Upload a test file before each test."""
        content = _create_test_feather()
        client.post("/upload", files={"file": ("test.feather", content, "application/octet-stream")})

    def test_metadata_returns_instruments(self):
        response = client.get("/metadata")
        assert response.status_code == 200
        data = response.json()
        assert set(data["instruments"]) == {"CE", "PE", "FUT"}

    def test_metadata_expiries_by_instrument(self):
        response = client.get("/metadata")
        data = response.json()
        assert "expiries_by_instrument" in data
        # FUT has different expiry from CE/PE
        assert len(data["expiries_by_instrument"]["FUT"]) == 1
        assert len(data["expiries_by_instrument"]["CE"]) == 1

    def test_metadata_contract_counts(self):
        response = client.get("/metadata")
        data = response.json()
        assert data["contract_counts"]["CE"] == 2
        assert data["contract_counts"]["PE"] == 2
        assert data["contract_counts"]["FUT"] == 1


class TestFilterEndpoint:
    def setup_method(self):
        content = _create_test_feather()
        client.post("/upload", files={"file": ("test.feather", content, "application/octet-stream")})

    def test_filter_by_instrument(self):
        response = client.post("/filter", json={"instrument": "CE"})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert all(r["instrument_type"] == "CE" for r in data["data"])

    def test_filter_by_expiry(self):
        response = client.post("/filter", json={"expiry": "2026-06-30"})
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["instrument_type"] == "FUT"

    def test_filter_combined(self):
        response = client.post("/filter", json={
            "instrument": "CE",
            "expiry": "2026-06-26",
            "strike": 25000.0,
        })
        data = response.json()
        assert data["total"] == 2

    def test_filter_no_match(self):
        response = client.post("/filter", json={"instrument": "CE", "expiry": "2026-12-31"})
        data = response.json()
        assert data["total"] == 0

    def test_filter_pagination(self):
        response = client.post("/filter", json={"instrument": "CE", "page": 1, "page_size": 1})
        data = response.json()
        assert len(data["data"]) == 1
        assert data["total"] == 2
        assert data["total_pages"] == 2


class TestPreviewEndpoint:
    def setup_method(self):
        content = _create_test_feather()
        client.post("/upload", files={"file": ("test.feather", content, "application/octet-stream")})

    def test_preview_basic(self):
        response = client.get("/preview")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert len(data["data"]) == 5

    def test_preview_pagination(self):
        response = client.get("/preview?page=1&page_size=2")
        data = response.json()
        assert len(data["data"]) == 2
        assert data["total_pages"] == 3

    def test_preview_search(self):
        response = client.get("/preview?search=FUT")
        data = response.json()
        assert data["total"] == 1

    def test_no_file_uploaded(self):
        """Test that endpoints return 400 when no file is uploaded."""
        import main
        main._current_df = None
        response = client.get("/preview")
        assert response.status_code == 400
