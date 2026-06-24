"""
Market Data Explorer — Python FastAPI Service
Handles Feather file I/O, metadata extraction, and data filtering.
"""

import os
import shutil
from datetime import date, datetime
from pathlib import Path
from typing import Any, Optional

import pandas as pd
import pyarrow.feather as feather
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Market Data Explorer — Python Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Chrome Private Network Access (PNA) support for localhost dev
@app.middleware("http")
async def add_pna_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory reference to the current loaded DataFrame
_current_df: Optional[pd.DataFrame] = None
_current_filename: Optional[str] = None


def _get_current_df() -> pd.DataFrame:
    """Return the currently loaded DataFrame, or raise 400 if none loaded."""
    global _current_df
    if _current_df is None:
        raise HTTPException(status_code=400, detail="No file uploaded yet. Please upload a .feather file first.")
    return _current_df


def _serialize_date(val: Any) -> str:
    """Convert date/datetime objects to ISO string for JSON serialization."""
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, date):
        return val.isoformat()
    return str(val)


def _df_to_records(df: pd.DataFrame) -> list[dict]:
    """Convert a DataFrame to a list of JSON-serializable dicts."""
    records = []
    for _, row in df.iterrows():
        record = {}
        for col in df.columns:
            val = row[col]
            if pd.isna(val):
                record[col] = None
            elif isinstance(val, (datetime, date, pd.Timestamp)):
                record[col] = _serialize_date(val)
            elif hasattr(val, 'item'):
                # Convert numpy types to Python native
                record[col] = val.item()
            else:
                record[col] = val
        records.append(record)
    return records


# ── Upload Endpoint ──────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a .feather file. Validates format, stores it, and loads into memory.
    Returns the total row count.
    """
    global _current_df, _current_filename

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    if not file.filename.endswith(".feather"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .feather files are accepted.")

    # Save the uploaded file
    file_path = UPLOAD_DIR / file.filename
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Validate and load with PyArrow
    try:
        df = feather.read_feather(str(file_path))
    except Exception as e:
        # Clean up invalid file
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Invalid Feather file: {str(e)}")

    # Validate expected columns
    required_columns = {"instrument_type", "expiry", "strike", "name"}
    missing = required_columns - set(df.columns)
    if missing:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing)}. Found columns: {', '.join(df.columns)}"
        )

    _current_df = df
    _current_filename = file.filename

    return {
        "rows": len(df),
        "columns": df.columns.tolist(),
        "filename": file.filename,
    }


# ── Metadata Endpoint ────────────────────────────────────────────────────────

@app.get("/metadata")
async def get_metadata():
    """
    Return metadata about the uploaded dataset:
    - Instruments, names, expiries (grouped by instrument), strikes (grouped by instrument)
    - Contract counts per instrument type
    """
    df = _get_current_df()

    instruments = sorted(df["instrument_type"].unique().tolist())
    names = sorted(df["name"].unique().tolist())

    # Group expiries by instrument type (key requirement: FUT/CE/PE have different expiries)
    expiries_by_instrument: dict[str, list[str]] = {}
    for inst in instruments:
        inst_df = df[df["instrument_type"] == inst]
        exp_list = sorted(inst_df["expiry"].unique().tolist())
        expiries_by_instrument[inst] = [_serialize_date(e) for e in exp_list]

    # All unique expiries (flat)
    all_expiries = sorted(df["expiry"].unique().tolist())
    all_expiries_str = [_serialize_date(e) for e in all_expiries]

    # Group strikes by instrument type (FUT has strike=0)
    strikes_by_instrument: dict[str, list[float]] = {}
    for inst in instruments:
        inst_df = df[df["instrument_type"] == inst]
        strike_list = sorted(inst_df["strike"].unique().tolist())
        # Filter out 0.0 strikes for FUT since they're meaningless
        if inst == "FUT":
            strike_list = [s for s in strike_list if s != 0.0]
        strikes_by_instrument[inst] = strike_list

    # All unique strikes (excluding 0.0 from FUT)
    all_strikes = sorted(df[df["strike"] > 0]["strike"].unique().tolist())

    # Contract counts
    contract_counts: dict[str, int] = {}
    for inst in instruments:
        contract_counts[inst] = int(df[df["instrument_type"] == inst].shape[0])

    # Strikes by name (for the Symbol filter)
    strikes_by_name: dict[str, list[float]] = {}
    for name in names:
        name_df = df[(df["name"] == name) & (df["strike"] > 0)]
        strikes_by_name[name] = sorted(name_df["strike"].unique().tolist())

    return {
        "instruments": instruments,
        "names": names,
        "expiries": all_expiries_str,
        "expiries_by_instrument": expiries_by_instrument,
        "strikes": all_strikes,
        "strikes_by_instrument": strikes_by_instrument,
        "strikes_by_name": strikes_by_name,
        "contract_counts": contract_counts,
        "total_rows": len(df),
        "filename": _current_filename,
    }


# ── Filter Endpoint ──────────────────────────────────────────────────────────

class FilterRequest(BaseModel):
    instrument: Optional[str] = None
    expiry: Optional[str] = None
    strike: Optional[float] = None
    name: Optional[str] = None
    page: int = 1
    page_size: int = 50
    sort_by: Optional[str] = None
    sort_order: str = "asc"  # "asc" or "desc"


@app.post("/filter")
async def filter_data(req: FilterRequest):
    """
    Filter the dataset by instrument type, expiry, strike, and/or name.
    Returns paginated, sorted results.
    """
    df = _get_current_df()
    filtered = df.copy()

    # Apply filters
    if req.instrument:
        filtered = filtered[filtered["instrument_type"] == req.instrument]

    if req.expiry:
        try:
            expiry_date = pd.to_datetime(req.expiry).date()
            # Handle both date and datetime.date expiry columns
            filtered = filtered[filtered["expiry"].apply(
                lambda x: x == expiry_date if isinstance(x, date) else pd.to_datetime(x).date() == expiry_date
            )]
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail=f"Invalid expiry date format: {req.expiry}")

    if req.strike is not None:
        filtered = filtered[filtered["strike"] == req.strike]

    if req.name:
        filtered = filtered[filtered["name"] == req.name]

    total_filtered = len(filtered)

    # Sorting
    if req.sort_by and req.sort_by in filtered.columns:
        ascending = req.sort_order.lower() == "asc"
        filtered = filtered.sort_values(by=req.sort_by, ascending=ascending)

    # Pagination
    start = (req.page - 1) * req.page_size
    end = start + req.page_size
    page_df = filtered.iloc[start:end]

    return {
        "data": _df_to_records(page_df),
        "total": total_filtered,
        "page": req.page,
        "page_size": req.page_size,
        "total_pages": max(1, (total_filtered + req.page_size - 1) // req.page_size),
    }


# ── Preview Endpoint ─────────────────────────────────────────────────────────

@app.get("/preview")
async def preview_data(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc"),
    search: Optional[str] = Query(None),
):
    """
    Return paginated preview of the full dataset.
    Supports sorting and a global search across all string columns.
    """
    df = _get_current_df()
    result = df.copy()

    # Global search across string columns
    if search and search.strip():
        search_lower = search.strip().lower()
        str_cols = result.select_dtypes(include=["object"]).columns
        mask = pd.Series(False, index=result.index)
        for col in str_cols:
            mask = mask | result[col].astype(str).str.lower().str.contains(search_lower, na=False)
        result = result[mask]

    total = len(result)

    # Sorting
    if sort_by and sort_by in result.columns:
        ascending = sort_order.lower() == "asc"
        result = result.sort_values(by=sort_by, ascending=ascending)

    # Pagination
    start = (page - 1) * page_size
    end = start + page_size
    page_df = result.iloc[start:end]

    return {
        "data": _df_to_records(page_df),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


# ── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "has_data": _current_df is not None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
