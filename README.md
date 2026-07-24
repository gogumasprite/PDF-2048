# PDF 2048

A playable 2048 game running inside a PDF file.

It uses a 4 by 4 static PDF grid, read-only AcroForm text fields, and embedded PDF JavaScript. The game updates tile values and score when you press the on-PDF buttons.

Works best in Chrome desktop PDF viewer.

## Install

```bash
npm install
```

## Generate the playable PDF

```bash
npm run generate
```

Output:

```text
generated/playable-pdf-2048.pdf
```

If a browser has cached an earlier copy, try the fresh compatibility alias
`generated/playable-pdf-2048-fixed.pdf`.

Open that file in Chrome desktop PDF viewer, click START, and use UP, DOWN, LEFT, and RIGHT. The button changes to RESTART after the game begins. Each button press performs one move. Matching neighboring numbers merge and increase the score.

## Game rules

- A new game starts with two random tiles.
- New tiles are 2 most of the time and 4 occasionally.
- A successful move adds one new tile.
- Creating 2048 shows CLEAR! and stops the game.
- If no legal move remains, the game shows FAILED.
- START begins a new game and changes to RESTART. RESTART starts a new game with two tiles.
- RESET clears the board, score, and message back to READY.
- CLEAR! and FAILED briefly blink the numbered cells before leaving the final board visible.

The PDF uses a static board background. Runtime JavaScript changes only the text values of the cell fields and the score/message fields. It does not depend on runtime fillColor changes. A short PDF timer is used only for the terminal CLEAR!/FAILED blink.

## Test

```bash
npm test
```

The test command checks the core merge and scoring rules, regenerates the PDF, and verifies its page size, AcroForm field set, embedded runtime, and renderer constraints.

## Supported environment

Recommended:

- Chrome desktop PDF viewer

Not supported or unreliable:

- Mobile PDF viewers
- In-app PDF previews
- PDF viewers that disable document JavaScript
- Viewers that support form display but not JavaScript button actions

## Project structure

- `src/game_logic.ts`: pure TypeScript 2048 rules
- `src/game_script.ts`: embedded PDF JavaScript runtime
- `src/generate_2048_pdf.ts`: PDF page, fields, buttons, and verification
- `docs/how-it-works.md`: implementation walkthrough
- `generated/playable-pdf-2048.pdf`: generated playable artifact
