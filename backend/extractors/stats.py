from .helpers import get_prop, path_name


def extract_stats(parsed_save) -> dict:
    info = parsed_save.saveFileInfo
    stats = {
        "session_name": info.sessionName,
        "save_name": info.saveName,
        "play_time_seconds": info.playDurationInSeconds,
        "play_time_formatted": _fmt_time(info.playDurationInSeconds),
        "save_date": str(info.saveDatetime),
        "build_version": info.buildVersion,
        "is_creative_mode": bool(info.isCreativeModeEnabled),
        "is_modded": bool(info.isModdedSave),
        "current_phase": None,
        "active_schematic": None,
        "total_points": None,
        "resource_sink_coupons": None,
        "creatures_killed": [],
    }

    for level in parsed_save.levels:
        for obj in level.objects:
            iname = getattr(obj, 'instanceName', '') or ''

            if 'GamePhaseManager' in iname:
                phase_ref = get_prop(obj.properties, 'mCurrentGamePhase')
                if phase_ref:
                    stats['current_phase'] = path_name(phase_ref).split('.')[-1].replace('_C', '')

            elif 'schematicManager' in iname:
                schematic = get_prop(obj.properties, 'mActiveSchematic')
                if schematic:
                    stats['active_schematic'] = path_name(schematic).split('.')[-1].replace('_C', '')

            elif 'ResourceSinkSubsystem' in iname:
                points = get_prop(obj.properties, 'mTotalPoints')
                if points is not None:
                    stats['total_points'] = points
                coupons = get_prop(obj.properties, 'mNumResourceSinkCoupons')
                if coupons is not None:
                    stats['resource_sink_coupons'] = coupons

            elif 'StatisticsSubsystem' in iname:
                kills = get_prop(obj.properties, 'mCreaturesKilledCount')
                if kills:
                    stats['creatures_killed'] = _parse_creature_kills(kills)

    return stats


def _fmt_time(seconds: int) -> str:
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h}h {m}m {s}s"


def _parse_creature_kills(kills) -> list[dict]:
    result = []
    try:
        for entry in kills:
            creature_ref, count = entry[0], entry[1]
            name = path_name(creature_ref).split('.')[-1].replace('_C', '')
            result.append({"creature": name, "count": count})
    except (TypeError, IndexError):
        pass
    return result
