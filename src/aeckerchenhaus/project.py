"""Project paths and loading of the house parameters."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "output"
WEB_DIR = ROOT / "web"
HOUSE_FILE = ROOT / "haus.json"


def read_house() -> dict:
    return json.loads(HOUSE_FILE.read_text(encoding="utf-8"))
