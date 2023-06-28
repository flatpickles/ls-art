(readme could be the design-doc eventually, for now this is freeform)

Todo:

-   Color parameters! Three-element numeric array...
-   Rework tech design for parameter sections - `section` string defined for each parameter

-   Build basic panels & UI for architecture validation
-   Validate canvas-sketch usage with current spec
-   Read through old notes and absorb in design doc

-   Param UI
    -   Option to reset to default/preset value
    -   Lock parameter value (?)
    -   Numeric params
        -   Option to randomize within range
        -   Type in value (when slider is visible?)

MVP stretch goals:

-   Link previews
-   API:
    -   Project list (names, dates, metadata)
    -   Link preview images
-   Easy "export snapshot" (photo) option
-   Key commands
    -   Hide/show panels
    -   Project switching
    -   Min/max range slider
    -   Undo/redo for parameter changes
-   Webcam & microphone inputs

Long-term goals:

-   Cloud preset storage
    -   Share presets with _just_ a link
-   LFOs and/or other sorts of param sidechaining
-   Midi control:
    -   Included in global configuration
    -   Enable project switching (fast switching)
-   Fast switching:
    -   Optional (global config)
    -   Multiple canvases already instantiated
    -   Optional transition effects:
        -   Simple crossfade
        -   Alpha overlay for custom cutouts, wipes, etc
        -   Maybe a base Sketch class function called when transition begins?
