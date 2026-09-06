import unittest

from aeckerchenhaus.geometry import prism


class ProjectPathsTest(unittest.TestCase):
    def test_prism_is_closed(self):
        vertices, faces = prism([[0, 0], [2, 0], [2, 1], [0, 1]], 0, 1)
        self.assertEqual(len(vertices), 8)
        self.assertEqual(len(faces), 6)


if __name__ == "__main__":
    unittest.main()
