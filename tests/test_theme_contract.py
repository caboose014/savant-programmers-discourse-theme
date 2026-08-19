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
        self.assertEqual(self.about["theme_version"], "0.10.1")
        dark = self.about["color_schemes"]["Savant Forum Dark"]
        self.assertEqual(dark["secondary"], "0b0b0e")
        self.assertEqual(dark["primary"], "f4f4f5")
        self.assertEqual(dark["tertiary"], "ee672b")

    def test_dark_palette_uses_vibrant_category_accents(self):
        settings = (ROOT / "settings.yml").read_text()
        for color in (
            "#ffb21c",
            "#35b6ff",
            "#20c7ff",
            "#ff4fa3",
            "#4cda7b",
            "#a879ff",
            "#ff9a32",
            "#ff625c",
            "#2fd4c8",
        ):
            self.assertIn(color, settings)
        self.assertIn("$sp-orange-dark: #ee672b", self.common)
        self.assertIn("$sp-muted-dark: #c9ccd2", self.common)
        self.assertIn("--category-badge-color: var(--sp-category-accent", self.common)

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
        self.assertIn("#reply-control .composer-actions-trigger:is(", self.common)
        self.assertIn('[aria-expanded="true"]', self.common)
        self.assertIn(":is(.d-icon, .d-button-label)", self.common)

    def test_compact_utility_menu_is_accessible(self):
        self.assertIn('aria-label", "Navigation menu', self.script)
        self.assertIn('aria-haspopup", "true', self.script)
        self.assertIn('aria-expanded", "false', self.script)
        self.assertIn('event.key !== "Escape"', self.script)
        self.assertIn("sp-utility-menu__grid", self.common)
        self.assertIn("utilityIcon(icon)", self.script)
        self.assertIn("svg_icons", self.about)
        self.assertIn('use.setAttribute("href", `#${name}`)', self.script)

    def test_desktop_categories_only_navigation_and_fixed_sidebar(self):
        self.assertIn("ensureDesktopSidebar()", self.script)
        self.assertIn("ensureHomeSidebarLink()", self.script)
        self.assertIn('data-link-name="everything"', self.script)
        self.assertIn('homeLink.setAttribute("href", "/categories")', self.script)
        self.assertIn('label.textContent = "Home"', self.script)
        self.assertIn('setAttribute("href", "#house")', self.script)
        self.assertIn(".sidebar-section-link-suffix", self.script)
        self.assertIn("window.location.pathname === \"/categories\"", self.script)
        self.assertIn("house", self.about["svg_icons"])
        self.assertIn(".header-sidebar-toggle", self.desktop)
        self.assertIn(".nav-item_hot", self.common)
        self.assertIn(
            ".navigation-categories .list-controls .nav-pills", self.common
        )
        self.assertIn(".sp-category-stat-headings", self.common)

    def test_live_qa_resolves_posters_and_compacts_search(self):
        self.assertIn('store?.getById?.("user", userId)', self.script)
        self.assertIn("poster?.user", self.script)
        self.assertIn("poster?.username", self.script)
        self.assertIn("camelLastPosterUser", self.script)
        self.assertIn(".welcome-banner__title", self.common)
        self.assertIn("display: none;", self.common)

    def test_category_information_contract(self):
        self.assertIn("serializedCategoriesById()", self.script)
        self.assertIn("category?.topics ?? []", self.script)
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
        self.assertIn(".category-list .featured-topics", self.mobile)
        self.assertIn(".category-list .latest-topic-list-item", self.mobile)
        self.assertIn("tbody > tr:not(.category-list-item)", self.mobile)
        self.assertIn("grid-template-columns: 2.4rem minmax(0, 1fr) 4.8rem", self.mobile)
        self.assertIn('a[aria-label*="latest poster"]', self.mobile)
        self.assertIn(".sp-utility-menu", self.common)

    def test_full_surface_visual_qa_contract(self):
        self.assertIn(":focus-visible", self.common)
        self.assertIn("#reply-control .composer-popup", self.common)
        self.assertIn(".user-main", self.common)
        self.assertIn(".badge-card", self.common)
        self.assertIn(".group-box", self.common)
        self.assertIn(".search-container", self.common)
        self.assertIn(".sp-ideas-page .topic-list th.posters::after", self.common)
        self.assertIn(".sp-utility-menu {\n    display: none !important;", self.common)

    def test_idea_promotions_native_voting_workflow(self):
        settings = (ROOT / "settings.yml").read_text()
        self.assertIn("idea_promotions_category_path", settings)
        self.assertIn('order=votes&status=open', self.script)
        self.assertIn('order=votes&status=archived', self.script)
        self.assertIn('state=my_votes', self.script)
        self.assertIn("ensureIdeaDefaultView()", self.script)
        self.assertIn("decorateIdeaRows()", self.script)
        self.assertIn("sp-idea-votes", self.script)
        self.assertIn("sp-idea-rank-column", self.script)
        self.assertIn("sp-idea-rank--${rank}", self.script)
        self.assertIn('"Implemented"', self.script)
        self.assertIn("ensureImplementedIdeaTopicState()", self.script)
        self.assertIn('document.querySelector(".topic-status.--archived")', self.script)
        self.assertIn("Voting is closed. The historical vote total is retained.", self.script)
        self.assertIn(".sp-ideas-nav", self.common)
        self.assertIn(".sp-idea-vote-link", self.common)
        self.assertIn(".sp-idea-rank--1", self.common)
        self.assertIn("th.sp-idea-rank-column", self.common)
        self.assertIn(".sp-idea-implemented", self.common)
        self.assertIn(".sp-idea-implemented-notice", self.common)
        self.assertIn(".sp-idea-topic--implemented .voting-wrapper__button", self.common)
        self.assertIn(".sp-ideas-page .topic-list td.sp-idea-votes", self.mobile)


if __name__ == "__main__":
    unittest.main()
