"""Command-line entry point for the house model pipeline."""

import argparse

from .project import OUTPUT_DIR, ROOT


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["build", "check", "open", "scene", "status"])
    args = parser.parse_args()

    if args.command == "build":
        from .ifc import export_ifc

        export_ifc()
    elif args.command == "check":
        from .geometry import validate_house
        from .project import read_house

        validate_house(read_house())
        print("Hausdaten sind gültig.")
    elif args.command == "scene":
        from .blender import render_scene

        render_scene()
    elif args.command == "open":
        from .blender import open_model

        open_model()
    else:
        from .blender import status

        OUTPUT_DIR.mkdir(exist_ok=True)
        print(f"Projekt: {ROOT}")
        print(f"Ausgabe: {OUTPUT_DIR}")
        status()


if __name__ == "__main__":
    main()
