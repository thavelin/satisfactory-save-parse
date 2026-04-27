import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'sat_sav_parse'))
import sav_parse

from .helpers import get_prop, clean_class_name, path_name, RESOURCE_PURITIES

RESOURCE_NODE_KEYWORDS = ('BP_ResourceNode', 'BP_FrackingCore', 'BP_ResourceNodeGeyser')
MARKER_KEYWORDS = ('MapMarker', 'FGMapMarker', 'ActorFunctionCaller')


def extract_map_data(parsed_save) -> dict:
    resource_nodes: list[dict] = []
    map_markers: list[dict] = []

    for level in parsed_save.levels:
        headers = level.actorAndComponentObjectHeaders
        objects = level.objects
        for header, obj in zip(headers, objects):
            if not isinstance(header, sav_parse.ActorHeader):
                continue
            type_path = header.typePath or ''

            if any(kw in type_path for kw in RESOURCE_NODE_KEYWORDS):
                resource_nodes.append(_parse_node(header, obj))

            elif any(kw in type_path for kw in MARKER_KEYWORDS):
                marker = _parse_marker(header, obj)
                if marker:
                    map_markers.append(marker)

    return {
        "resource_nodes": resource_nodes,
        "map_markers": map_markers,
        "node_summary": _summarize_nodes(resource_nodes),
    }


def _parse_node(header, obj) -> dict:
    resource_ref = get_prop(obj.properties, 'mResourceClass') or get_prop(obj.properties, 'mExtractableResource')
    purity_val = get_prop(obj.properties, 'mPurityEnum') or get_prop(obj.properties, 'mPurity') or 3

    if isinstance(purity_val, str):
        purity_map = {'impure': 0, 'normal': 1, 'pure': 2}
        purity_int = purity_map.get(purity_val.lower(), 3)
    else:
        try:
            purity_int = int(purity_val)
        except (TypeError, ValueError):
            purity_int = 3

    resource_name = clean_class_name(path_name(resource_ref)) if resource_ref else 'Unknown'

    return {
        "instance": header.instanceName,
        "resource": resource_name,
        "purity": RESOURCE_PURITIES.get(purity_int, 'Unknown'),
        "position": {
            "x": round(header.position[0], 1),
            "y": round(header.position[1], 1),
            "z": round(header.position[2], 1),
        } if header.position else None,
    }


def _parse_marker(header, obj) -> dict | None:
    name = get_prop(obj.properties, 'mDisplayName') or get_prop(obj.properties, 'mMarkerName')
    if not name:
        return None
    marker_type = get_prop(obj.properties, 'mMapMarkerType')
    color = get_prop(obj.properties, 'mColor') or get_prop(obj.properties, 'mMarkerColor')
    return {
        "instance": header.instanceName,
        "name": str(name),
        "type": str(marker_type) if marker_type else "Custom",
        "color": _parse_color(color),
        "position": {
            "x": round(header.position[0], 1),
            "y": round(header.position[1], 1),
            "z": round(header.position[2], 1),
        } if header.position else None,
    }


def _parse_color(color) -> str | None:
    if color is None:
        return None
    try:
        if isinstance(color, dict):
            r = int(color.get('R', color.get('r', 255)))
            g = int(color.get('G', color.get('g', 255)))
            b = int(color.get('B', color.get('b', 255)))
            return f"#{r:02x}{g:02x}{b:02x}"
        if isinstance(color, (list, tuple)) and len(color) >= 3:
            return f"#{int(color[0]):02x}{int(color[1]):02x}{int(color[2]):02x}"
    except (TypeError, ValueError):
        pass
    return None


def _summarize_nodes(nodes: list[dict]) -> list[dict]:
    counts: dict[str, dict[str, int]] = {}
    for node in nodes:
        res = node['resource']
        purity = node['purity']
        if res not in counts:
            counts[res] = {'Impure': 0, 'Normal': 0, 'Pure': 0, 'Unknown': 0}
        counts[res][purity] = counts[res].get(purity, 0) + 1
    return [
        {"resource": res, **purities, "total": sum(purities.values())}
        for res, purities in sorted(counts.items())
    ]
