"""Start Blender workers or connect to the running Blender MCP add-on."""

import asyncio
import os
import shutil
import subprocess
import sys

from .project import OUTPUT_DIR, ROOT


async def blender_call(tool: str, arguments: dict) -> None:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    command = ROOT / ".venv" / "bin" / "blender-mcp"
    params = StdioServerParameters(
        command=str(command), env={**os.environ, "BLENDER_MCP_DISABLE_TELEMETRY": "1"}
    )
    async with stdio_client(params) as streams:
        async with ClientSession(*streams) as session:
            await session.initialize()
            result = await session.call_tool(
                tool, {"user_prompt": "Äckerchenhaus bearbeiten", **arguments}
            )
            if result.isError:
                raise RuntimeError("Blender MCP meldet einen Fehler.")
            for item in result.content:
                if item.type == "text":
                    print(item.text)


def render_scene() -> None:
    binary = shutil.which("blender")
    if binary is None:
        raise SystemExit("Blender wurde nicht im PATH gefunden.")
    source = (
        f"import sys; sys.path.insert(0, {str(ROOT / 'src')!r}); "
        "import addon_utils; addon_utils.enable('bl_ext.blender_org.bonsai', default_set=True); "
        "from aeckerchenhaus.scene import build_scene; "
        f"build_scene({str(OUTPUT_DIR)!r})"
    )
    subprocess.run(
        [binary, "--background", "--python-exit-code", "1", "--python-expr", source], check=True
    )


def open_model() -> None:
    path = OUTPUT_DIR / "haus.blend"
    if not path.exists():
        raise SystemExit("Zuerst 'uv run aeckerchenhaus scene' ausführen.")
    asyncio.run(
        blender_call(
            "execute_blender_code",
            {"code": f"import bpy\nbpy.ops.wm.open_mainfile(filepath={str(path)!r})"},
        )
    )


def status() -> None:
    if not sys.stdout.isatty():
        return
    asyncio.run(blender_call("get_scene_info", {}))
