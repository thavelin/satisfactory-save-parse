import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'sat_sav_parse'))
import sav_parse

from .helpers import get_prop, clean_class_name, parse_inventory_stacks

STORAGE_KEYWORDS = (
    'StorageContainerMk1', 'StorageContainerMk2',
    'IndustrialStorageContainerMk1', 'IndustrialStorageContainerMk2',
    'StorageIntegrated', 'CentralStorage', 'DimensionalDepot',
)

PLAYER_KEYWORDS = ('Char_Player', 'BP_PlayerState')


def extract_inventory(parsed_save) -> dict:
    storage: list[dict] = []
    player_inventories: list[dict] = []
    combined: dict[str, int] = {}

    for level in parsed_save.levels:
        headers = level.actorAndComponentObjectHeaders
        objects = level.objects
        for header, obj in zip(headers, objects):
            iname = header.instanceName or ''
            type_path = getattr(header, 'typePath', '') or ''

            stacks = get_prop(obj.properties, 'mInventoryStacks')
            if stacks is None:
                continue
            items = parse_inventory_stacks(stacks)
            if not items:
                continue

            for it in items:
                combined[it['item']] = combined.get(it['item'], 0) + it['quantity']

            is_player = any(kw in iname for kw in PLAYER_KEYWORDS)
            is_storage = any(kw in type_path for kw in STORAGE_KEYWORDS)

            if is_player:
                player_inventories.append({
                    "instance": iname,
                    "items": items,
                })
            elif is_storage:
                label = clean_class_name(type_path.split('/')[-1].split('.')[0])
                storage.append({
                    "instance": iname,
                    "label": label,
                    "items": items,
                    "total_slots": _count_slots(stacks),
                    "used_slots": len(items),
                })

    return {
        "storage_containers": storage,
        "player_inventories": player_inventories,
        "combined_totals": [
            {"item": k, "quantity": v}
            for k, v in sorted(combined.items(), key=lambda x: -x[1])
        ],
    }


def _count_slots(stacks) -> int:
    try:
        return len(stacks)
    except TypeError:
        return 0
