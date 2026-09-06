"""Blender/Bonsai scene assembly. This module runs inside Blender."""


def build_scene(output_directory: str) -> None:
    from pathlib import Path

    import bpy

    output = Path(output_directory)
    ifc_path = output / "haus.ifc"
    if not ifc_path.exists():
        raise FileNotFoundError("Zuerst den Befehl 'build' ausführen.")
    bpy.ops.bim.load_project(
        filepath=str(ifc_path), should_start_fresh_session=True, use_relative_path=False
    )
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.length_unit = "METERS"
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "haus.blend"))

    glb = Path(__file__).resolve().parents[2] / "web" / "public" / "models" / "haus.glb"
    glb.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", export_apply=True)
