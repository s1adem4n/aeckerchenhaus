"""Create the neutral IFC exchange model."""

import uuid

import ifcopenshell
import ifcopenshell.api as api

from .geometry import components, validate_house
from .project import OUTPUT_DIR, read_house


def build(house: dict | None = None) -> ifcopenshell.file:
    house = house or read_house()
    validate_house(house)
    model = api.run("project.create_file", version="IFC4")

    def entity(ifc_class: str, key: str, name: str):
        item = api.run("root.create_entity", model, ifc_class=ifc_class, name=name)
        item.GlobalId = ifcopenshell.guid.compress(
            uuid.uuid5(uuid.UUID(house["project_id"]), key).hex
        )
        return item

    project = entity("IfcProject", "project", house["name"])
    units = [
        api.run("unit.add_si_unit", model, unit_type=kind)
        for kind in ("LENGTHUNIT", "AREAUNIT", "VOLUMEUNIT")
    ]
    api.run("unit.assign_unit", model, units=units)
    context = api.run("context.add_context", model, context_type="Model")
    body = api.run(
        "context.add_context",
        model,
        context_type="Model",
        context_identifier="Body",
        target_view="MODEL_VIEW",
        parent=context,
    )
    site = entity("IfcSite", "site", house["name"])
    building = entity("IfcBuilding", "building", "Wohnhaus")
    api.run("aggregate.assign_object", model, relating_object=project, products=[site])
    api.run("aggregate.assign_object", model, relating_object=site, products=[building])

    levels = {}
    for level in house["levels"]:
        storey = entity("IfcBuildingStorey", level["id"], level["name"])
        storey.Elevation = float(level["elevation"])
        api.run("aggregate.assign_object", model, relating_object=building, products=[storey])
        levels[level["id"]] = storey

    for part in components(house):
        item = entity(part["ifc_class"], part["id"], part["name"])
        vertices, faces = part["geometry"]
        representation = api.run(
            "geometry.add_mesh_representation",
            model,
            context=body,
            vertices=[vertices],
            faces=[faces],
        )
        api.run(
            "geometry.assign_representation", model, product=item, representation=representation
        )
        api.run(
            "spatial.assign_container",
            model,
            relating_structure=levels[part["level"]],
            products=[item],
        )
    return model


def export_ifc() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    path = OUTPUT_DIR / "haus.ifc"
    build().write(path)
    print(f"IFC geschrieben: {path}")
