import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'sat_sav_parse'))
import sav_parse

from .helpers import get_prop, clean_class_name, building_display_name, path_name


def extract_production(parsed_save) -> list[dict]:
    buildings = []

    for level in parsed_save.levels:
        headers = level.actorAndComponentObjectHeaders
        objects = level.objects
        for header, obj in zip(headers, objects):
            if not isinstance(header, sav_parse.ActorHeader):
                continue
            display = building_display_name(header.typePath)
            if display is None:
                continue

            recipe_ref = get_prop(obj.properties, 'mCurrentRecipe')
            recipe_name = clean_class_name(path_name(recipe_ref)) if recipe_ref else None

            potential = get_prop(obj.properties, 'mCurrentPotential')
            clock_speed = round((potential or 1.0) * 100, 1)

            is_producing = get_prop(obj.properties, 'mIsProducing')
            is_standby = get_prop(obj.properties, 'mIsProductionPaused')

            buildings.append({
                "instance": header.instanceName,
                "type": display,
                "recipe": recipe_name,
                "clock_speed_pct": clock_speed,
                "is_producing": bool(is_producing),
                "is_standby": bool(is_standby),
                "position": {
                    "x": round(header.position[0], 1),
                    "y": round(header.position[1], 1),
                    "z": round(header.position[2], 1),
                } if header.position else None,
            })

    buildings.sort(key=lambda b: (b['type'], b['recipe'] or ''))
    return buildings
