# Savant Programmers Forum theme

Standalone Discourse theme starter for the modernised Savant Programmers
Forum. It does not depend on a parent theme or an appearance plugin.

## Intended Discourse configuration

- Default landing page: `Categories`.
- Desktop category page style: `Categories with Featured Topics`.
- Subcategories enabled.
- Light and dark colour schemes available to users.

The native category layout remains authoritative for latest-topic titles,
avatars, authors, activity times and counts. This theme changes their visual
hierarchy and density; it does not replace those data paths.

## Included dark-first behaviour

- Wide, single-column forum canvas with a persistent edge-aligned desktop
  sidebar and normal responsive mobile navigation.
- Generated atmospheric equipment-rack background extending behind the full
  interface, without an oversized enclosing content panel.
- Dark-first Savant palette with an optional coordinated light colour scheme.
- Layered graphite/translucent surfaces, restrained borders and deliberately
  softened shadows that preserve background atmosphere without harming text.
- Larger top-level category headings and compact grouped child-category rows
  with rounded outer corners and internal separators.
- Configurable parent-category accents inherited by nested child rows.
- Latest thread title, latest-poster avatar and username, and relative activity
  time derived from the already-loaded featured-topic model; no additional
  network request or plugin is required.
- Archived parent visible on `/categories`, with its child list shown only on
  the dedicated Archived page.
- Compact technical post and code-block styling.
- Mobile reductions and reduced-motion/reduced-data fallbacks.

## Install for review

Import this directory as a theme archive or publish it as its own Git
repository and install it via **Admin → Customize → Themes → Install → From a
git repository**. Do not attach it to Fully or another parent theme.

Before enabling it for all users:

1. Confirm all approved top-level category slugs in the theme settings,
   including `Savant News`, `Staff` and `General`.
2. Select `Savant Forum Light` and `Savant Forum Dark` as appropriate.
3. Review `/categories`, each parent category, a topic, a private Beta category,
   mobile layouts, and both colour modes.
4. Confirm Archived children are hidden only on the general categories page.
5. Disable the theme and verify stock Discourse remains fully usable.

For the intended dark-first experience, select `Savant Forum Dark` as this
theme's default palette. Mark `Savant Forum Light` as user-selectable if members
should be able to opt into it. Discourse stores theme and colour-scheme choices
as separate interface preferences.

## Status

Version 0.3 is a development theme for iterative lab review, not a
production-approved theme. The category enhancer now resolves latest-poster
identity from both modern topic fields and the serialized poster/site-user
collections, while preserving the native featured-topic fallback whenever
those fields are unavailable.

The generated background is original concept artwork and not a representation
of identifiable Savant equipment.

The final visual direction is not based on Material Design Stock Theme. Rework
this starter from a minimal standalone Discourse foundation, using the Epic
Developer Community Unreal Engine forum as the close layout and information-
hierarchy reference while retaining original Savant branding and colour work.
