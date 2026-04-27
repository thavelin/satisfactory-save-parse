import re
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'sat_sav_parse'))
import sav_parse


def get_prop(properties, name):
    """Safe wrapper around sav_parse.getPropertyValue."""
    try:
        return sav_parse.getPropertyValue(properties, name)
    except Exception:
        return None


def clean_class_name(path: str) -> str:
    """Convert a UE4 class path like .../Recipe_IronPlate.Recipe_IronPlate_C to 'Iron Plate'."""
    if not path:
        return "Unknown"
    name = path.split('.')[-1]
    if name.endswith('_C'):
        name = name[:-2]
    for prefix in ('Recipe_', 'Desc_', 'Build_', 'BP_'):
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    name = re.sub(r'(?<=[a-z0-9])(?=[A-Z])', ' ', name)
    name = re.sub(r'(?<=[A-Z])(?=[A-Z][a-z])', ' ', name)
    return name.strip()


def path_name(ref) -> str:
    """Extract pathName string from an ObjectReference or raw string."""
    if ref is None:
        return ""
    if isinstance(ref, str):
        return ref
    if hasattr(ref, 'pathName'):
        return ref.pathName
    if isinstance(ref, (list, tuple)) and len(ref) > 1:
        return str(ref[1])
    return str(ref)


def parse_inventory_stacks(stacks) -> list[dict]:
    """Parse mInventoryStacks into [{item, quantity}]."""
    result = []
    if not stacks:
        return result
    for stack in stacks:
        try:
            item_data = stack[0]
            if len(item_data) >= 2 and item_data[0][0] == "Item" and item_data[1][0] == "NumItems":
                item_path = item_data[0][1][0]
                quantity = item_data[1][1]
                if item_path and quantity and quantity > 0:
                    result.append({
                        "item": clean_class_name(item_path),
                        "item_path": item_path,
                        "quantity": quantity,
                    })
        except (IndexError, TypeError, KeyError):
            continue
    return result


BUILDING_TYPE_MAP = {
    'AssemblerMk1': 'Assembler',
    'ConstructorMk1': 'Constructor',
    'FoundryMk1': 'Foundry',
    'ManufacturerMk1': 'Manufacturer',
    'OilRefinery': 'Oil Refinery',
    'Blender': 'Blender',
    'PackagerMk1': 'Packager',
    'HadronCollider': 'Particle Accelerator',
    'Converter': 'Converter',
    'QuantumEncoder': 'Quantum Encoder',
    'MinerMk1': 'Miner Mk.1',
    'MinerMk2': 'Miner Mk.2',
    'MinerMk3': 'Miner Mk.3',
    'OilPump': 'Oil Extractor',
    'WaterPump': 'Water Extractor',
    'GeneratorNuclear': 'Nuclear Power Plant',
    'GeneratorCoal': 'Coal Generator',
    'GeneratorFuel': 'Fuel Generator',
    'GeneratorBiomass': 'Biomass Burner',
    'GeneratorGeoThermal': 'Geothermal Generator',
    'SmelterMk1': 'Smelter',
    'SmelterMk2': 'Smelter Mk.2',
}

PRODUCTION_BUILDING_KEYWORDS = set(BUILDING_TYPE_MAP.keys())


def building_display_name(type_path: str) -> str | None:
    """Return a display name for a production building typePath, or None if not a production building."""
    if not type_path:
        return None
    class_part = type_path.split('/')[-1].split('.')[0]
    for key, display in BUILDING_TYPE_MAP.items():
        if key in class_part:
            return display
    if '/Buildable/Factory/' in type_path and 'Build_' in class_part:
        raw = class_part.replace('Build_', '').replace('_C', '')
        return clean_class_name(raw)
    return None


RESOURCE_PURITIES = {0: 'Impure', 1: 'Normal', 2: 'Pure', 3: 'Unknown'}
