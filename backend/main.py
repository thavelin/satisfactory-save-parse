import sys
import os
import uuid
import tempfile
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib', 'sat_sav_parse'))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sav_parse
from extractors.stats import extract_stats
from extractors.production import extract_production
from extractors.inventory import extract_inventory
from extractors.map_data import extract_map_data
from notion_push import push_to_notion

app = FastAPI(title="Satisfactory Save Parser")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory result cache keyed by parse ID
_cache: dict[str, dict] = {}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/parse")
async def parse_save(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".sav"):
        raise HTTPException(status_code=400, detail="File must be a .sav file")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    with tempfile.NamedTemporaryFile(suffix=".sav", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        parsed = sav_parse.readFullSaveFile(tmp_path)
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(status_code=422, detail=f"Failed to parse save file: {e}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    parse_id = str(uuid.uuid4())
    result = {
        "id": parse_id,
        "filename": file.filename,
        "parsed_at": datetime.utcnow().isoformat(),
        "stats": extract_stats(parsed),
        "production": extract_production(parsed),
        "inventory": extract_inventory(parsed),
        "map_data": extract_map_data(parsed),
    }

    _cache[parse_id] = result
    return result


@app.get("/api/parse/{parse_id}")
def get_result(parse_id: str):
    if parse_id not in _cache:
        raise HTTPException(status_code=404, detail="Parse result not found")
    return _cache[parse_id]


class NotionPushRequest(BaseModel):
    parse_id: str
    notion_token: str
    stats_page_id: str = ""
    production_db_id: str = ""
    inventory_db_id: str = ""
    map_db_id: str = ""


@app.post("/api/notion/push")
def notion_push(req: NotionPushRequest):
    if req.parse_id not in _cache:
        raise HTTPException(status_code=404, detail="Parse result not found — re-upload your save")

    config = {
        "stats_page_id": req.stats_page_id or None,
        "production_db_id": req.production_db_id or None,
        "inventory_db_id": req.inventory_db_id or None,
        "map_db_id": req.map_db_id or None,
    }

    try:
        result = push_to_notion(_cache[req.parse_id], req.notion_token, config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return result
