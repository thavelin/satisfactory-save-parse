"""Push parsed Satisfactory save data to Notion databases."""

from notion_client import Client


def push_to_notion(data: dict, token: str, config: dict) -> dict:
    """
    config = {
        "stats_page_id": "...",       # Optional: page to write game stats block
        "production_db_id": "...",    # Optional: Notion database for production buildings
        "inventory_db_id": "...",     # Optional: Notion database for inventory items
        "map_db_id": "...",           # Optional: Notion database for resource nodes
    }
    Returns { "pushed": [...sections], "errors": [...] }
    """
    client = Client(auth=token)
    pushed = []
    errors = []

    if config.get("stats_page_id"):
        try:
            _push_stats(client, config["stats_page_id"], data.get("stats", {}))
            pushed.append("stats")
        except Exception as e:
            errors.append({"section": "stats", "error": str(e)})

    if config.get("production_db_id"):
        try:
            count = _push_production(client, config["production_db_id"], data.get("production", []))
            pushed.append(f"production ({count} buildings)")
        except Exception as e:
            errors.append({"section": "production", "error": str(e)})

    if config.get("inventory_db_id"):
        try:
            count = _push_inventory(client, config["inventory_db_id"], data.get("inventory", {}).get("combined_totals", []))
            pushed.append(f"inventory ({count} items)")
        except Exception as e:
            errors.append({"section": "inventory", "error": str(e)})

    if config.get("map_db_id"):
        try:
            count = _push_map(client, config["map_db_id"], data.get("map_data", {}).get("resource_nodes", []))
            pushed.append(f"map ({count} nodes)")
        except Exception as e:
            errors.append({"section": "map", "error": str(e)})

    return {"pushed": pushed, "errors": errors}


def _push_stats(client: Client, page_id: str, stats: dict):
    play_time = stats.get("play_time_formatted", "?")
    session = stats.get("session_name", "?")
    save_date = stats.get("save_date", "?")
    phase = stats.get("current_phase") or "Unknown"
    schematic = stats.get("active_schematic") or "None"
    points = stats.get("total_points")
    coupons = stats.get("resource_sink_coupons")

    blocks = [
        _heading2(f"Save: {session}"),
        _table_block([
            ["Field", "Value"],
            ["Session", session],
            ["Play Time", play_time],
            ["Save Date", save_date[:10] if save_date else "?"],
            ["Game Phase", phase],
            ["Active Research", schematic],
            ["AWESOME Points", str(points) if points is not None else "?"],
            ["Coupons", str(coupons) if coupons is not None else "?"],
        ]),
    ]

    client.blocks.children.append(page_id, children=blocks)


def _push_production(client: Client, db_id: str, buildings: list[dict]) -> int:
    count = 0
    for b in buildings:
        try:
            client.pages.create(
                parent={"database_id": db_id},
                properties={
                    "Name": _title(b.get("type", "Unknown")),
                    "Recipe": _rich_text(b.get("recipe") or "None"),
                    "Clock Speed %": _number(b.get("clock_speed_pct", 100)),
                    "Producing": _checkbox(b.get("is_producing", False)),
                    "Standby": _checkbox(b.get("is_standby", False)),
                },
            )
            count += 1
        except Exception:
            pass
    return count


def _push_inventory(client: Client, db_id: str, totals: list[dict]) -> int:
    count = 0
    for entry in totals:
        try:
            client.pages.create(
                parent={"database_id": db_id},
                properties={
                    "Item": _title(entry.get("item", "Unknown")),
                    "Quantity": _number(entry.get("quantity", 0)),
                },
            )
            count += 1
        except Exception:
            pass
    return count


def _push_map(client: Client, db_id: str, nodes: list[dict]) -> int:
    count = 0
    for node in nodes:
        try:
            pos = node.get("position") or {}
            client.pages.create(
                parent={"database_id": db_id},
                properties={
                    "Resource": _title(node.get("resource", "Unknown")),
                    "Purity": _select(node.get("purity", "Unknown")),
                    "X": _number(pos.get("x")),
                    "Y": _number(pos.get("y")),
                    "Z": _number(pos.get("z")),
                },
            )
            count += 1
        except Exception:
            pass
    return count


# --- Notion block/property helpers ---

def _title(text: str) -> dict:
    return {"title": [{"text": {"content": str(text)[:2000]}}]}

def _rich_text(text: str) -> dict:
    return {"rich_text": [{"text": {"content": str(text)[:2000]}}]}

def _number(value) -> dict:
    return {"number": float(value) if value is not None else None}

def _checkbox(value: bool) -> dict:
    return {"checkbox": bool(value)}

def _select(value: str) -> dict:
    return {"select": {"name": str(value)}}

def _heading2(text: str) -> dict:
    return {
        "object": "block",
        "type": "heading_2",
        "heading_2": {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }

def _table_block(rows: list[list[str]]) -> dict:
    return {
        "object": "block",
        "type": "table",
        "table": {
            "table_width": len(rows[0]),
            "has_column_header": True,
            "has_row_header": False,
            "children": [
                {
                    "object": "block",
                    "type": "table_row",
                    "table_row": {
                        "cells": [
                            [{"type": "text", "text": {"content": str(cell)}}]
                            for cell in row
                        ]
                    },
                }
                for row in rows
            ],
        },
    }
