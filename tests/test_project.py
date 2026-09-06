import unittest

from aeckerchenhaus.geometry import components, prism, validate_house
from aeckerchenhaus.project import ROOT, WEB_DIR, read_house


class ProjectPathsTest(unittest.TestCase):
    def test_finds_project_and_web_app(self):
        self.assertTrue((ROOT / "pyproject.toml").is_file())
        self.assertTrue((WEB_DIR / "package.json").is_file())

    def test_starter_house_is_valid(self):
        house = read_house()
        validate_house(house)
        self.assertEqual(components(house), [])

    def test_prism_is_closed(self):
        vertices, faces = prism([[0, 0], [2, 0], [2, 1], [0, 1]], 0, 1)
        self.assertEqual(len(vertices), 8)
        self.assertEqual(len(faces), 6)


if __name__ == "__main__":
    unittest.main()
