# StylePort — Layered Portal

Approved identity: a browser frame with three overlapping style sheets. The app
artwork is the approved raster master; the clean SVG symbol is its scalable
production interpretation. Toolbar artwork is deliberately simplified for 16 px.

## Assets

- `app/`: transparent PNG app tiles, 16–1024 px. For the Dock, app listings,
  website app imagery and avatars. Do not enlarge beyond 1024 px.
- `logo/*-light.*`: midnight ink for light backgrounds.
- `logo/*-dark.*`: near-white ink for dark backgrounds.
- `logo/*-mono.svg`: one-color marks. All SVGs contain real vector paths;
  outlined wordmarks do not require an installed font.
- `toolbar/`: active, no-match and disabled SVG/PNG files for light/dark themes.
  The disabled state has a slash. Never shrink the app tile into a toolbar.
- `fonts/`: Manrope variable TTF and WOFF2, with SIL OFL.
- `asset-preview.png`: contact sheet, not a logo source.

## Brand rules

Manrope 800 for the wordmark and major headlines; 600–700 for labels; 400–500 for
body copy. Website fallback: `Manrope, system-ui, sans-serif`. Keep native system
typography in app controls for readability and platform fit.

Midnight #111522; mint #5EEAD4; violet #8B5CF6; coral #FB7185; white #F5F7FC.
Keep clear space of at least one quarter of the symbol width. Minimum full symbol
size: 32 px; lockup width: 180 px. At 16–24 px use the simplified toolbar mark.
Never stretch, rotate or add shadows to supplied logos.

Credit: **A RelayByte app by Kyle Reddoch**, linked to https://relaybyte.dev.
RelayByte is a brand; Kyle Reddoch is the developer. Retain Stylus GPL attribution
in legal/notices content; this artwork does not change the app's license.

## Rebuild

Run `python3 tools/build-styleport-icons.py` from the app repository with Pillow,
fontTools, Node, sharp and the project's ttf2woff2 dependency available. Set
`NODE_PATH` if sharp is supplied by a shared runtime. The script regenerates exports,
the macOS AppIcon set, WebExtension icons, native app artwork and ZIP download.
Then run the normal Safari release build to synchronize extension resources.

Approved artwork is preserved in `brand/source/`. Font source and license:
https://github.com/google/fonts/tree/main/ofl/manrope (SIL Open Font License 1.1).
The website is separate: copy exports there, preview locally, and obtain approval
before publishing.
