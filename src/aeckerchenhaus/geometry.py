"""Geometry independent of Blender and IFC state, using metres."""

from math import isfinite


def prism(outline: list[list[float]], z: float, height: float) -> tuple[list, list]:
    """Extrude a counter-clockwise 2D polygon into a closed mesh."""
    bottom = [(x, y, z) for x, y in outline]
    vertices = bottom + [(x, y, z + height) for x, y in outline]
    count = len(outline)
    faces = [list(reversed(range(count))), list(range(count, count * 2))]
    faces += [[i, (i + 1) % count, (i + 1) % count + count, i + count] for i in range(count)]
    return vertices, faces


def validate_house(house: dict) -> None:
    if house.get("units") != "m":
        raise ValueError("Alle Maße müssen in Metern angegeben sein.")
    if not house.get("levels"):
        raise ValueError("Mindestens ein Geschoss wird benötigt.")
    ids = [item["id"] for key in ("levels", "rooms", "walls", "openings") for item in house[key]]
    if len(ids) != len(set(ids)):
        raise ValueError("IDs von Geschossen, Räumen und Bauteilen müssen eindeutig sein.")
    for room in house["rooms"]:
        outline = room.get("outline", [])
        if len(outline) < 3 or not all(isfinite(value) for point in outline for value in point):
            raise ValueError(f"Ungültiger Raumumriss: {room['id']}")


def components(house: dict) -> list[dict]:
    """Return generic room floor meshes; walls, openings and roof are added later."""
    validate_house(house)
    return [
        {
            "id": f"floor-{room['id']}",
            "name": f"{room['name']} Boden",
            "ifc_class": "IfcSlab",
            "level": room["level"],
            "material": room.get("floor_material", "boden"),
            "geometry": prism(room["outline"], room.get("elevation", -0.02), 0.02),
        }
        for room in house["rooms"]
    ]
