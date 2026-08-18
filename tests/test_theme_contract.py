import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ThemeContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.about = json.loads((ROOT / "about.json").read_text())
        cls.common = (ROOT / "common/common.scss").read_text()
        cls.desktop = (ROOT / "desktop/desktop.scss").read_text()
        cls.mobile = (ROOT / "mobile/mobile.scss").read_text()
        cls.script = (
            ROOT
            / "javascripts/discourse/api-initializers/savant-category-presentation.js"
        ).read_text()

    def test_theme_is_standalone_dark_first(self):
        self.assertFalse(self.about["component"])
        self.assertEqual(self.about["theme_version"], "0.6.4")
        dark = self.about["color_schemes"]["Savant Forum Dark"]
        self.assertEqual(dark["secondary"], "0b0b0e")
        self.assertEqual(dark["primary"], "f4f4f5")

    def test_no_external_theme_or_runtime_dependency(self):
        self.assertNotIn("extends", self.about)
        self.assertNotIn("https://", self.script)
        self.assertNotIn("fetch(", self.script)

    def test_popovers_have_explicit_selected_contrast(self):
        self.assertIn("--sp-popover", self.common)
        self.assertIn("--sp-selected", self.common)
        self.assertIn('.is-highlighted', self.common)
        self.assertIn('[aria-selected="true"]', self.common)
        self.assertIn(".user-menu .quick-access-panel", self.common)

    def test_compact_utility_menu_is_accessible(self):
        self.assertIn('aria-label", "Navigation menu', self.script)
        self.assertIn('aria-haspopup", "true', self.script)
        self.assertIn('aria-expanded", "false', self.script)
        self.assertIn('event.key !== "Escape"', self.script)
        self.assertIn("sp-utility-menu__grid", self.common)
        self.assertIn("utilityIcon(icon)", self.script)
        self.assertIn("svg_icons", self.about)

    def test_live_qa_resolves_posters_and_compacts_search(self):
        self.assertIn('store?.getById?.("user", userId)', self.script)
        self.assertIn("poster?.user", self.script)
        self.assertIn("poster?.username", self.script)
        self.assertIn("camelLastPosterUser", self.script)
        self.assertIn(".welcome-banner__title", self.common)
        self.assertIn("display: none;", self.common)

    def test_category_information_contract(self):
        self.assertIn("serializedCategoriesById()", self.script)
        self.assertIn('document.querySelector("#data-preloaded")', self.script)
        self.assertIn("serializedById.get(Number(row.dataset.categoryId))", self.script)
        self.assertIn("addCategoryStats(row, category)", self.script)
        self.assertIn("post_count", self.script)
        self.assertIn("poster?.avatar_template", self.script)
        self.assertIn("sp-category-stat__value", self.common)

    def test_archived_and_legacy_content_rules_survive(self):
        self.assertIn("archived_category_slug", self.common)
        self.assertIn("[data-savant-color]", self.common)
        self.assertIn("[data-savant-align=", self.common)
        self.assertIn("[data-savant-size=", self.common)
        self.assertIn("[data-savant-font=", self.common)

    def test_responsive_surfaces_exist(self):
        self.assertIn("@media (min-width: 1000px)", self.desktop)
        self.assertIn(".sp-utility-menu__panel", self.mobile)
        self.assertIn(".sp-category-stats", self.mobile)


if __name__ == "__main__":
    unittest.main()
