# How PDF 2048 Works

PDF 2048 is a small 2048 game that runs inside a PDF. It does not use a web page, canvas, or HTML game engine. The PDF page graphics form the static board, while AcroForm text fields act as the changing display.

## Static board and text overlays

The page is a custom 900 by 506 point landscape page tuned for Chrome desktop PDF viewing. The 4 by 4 board is drawn directly into the PDF page with fixed background rectangles and grid lines.

Each board position also has a read-only field named `cell_row_col`, such as `cell_0_0`. These fields have a fixed background and no visible border. Their only job is to display an ASCII number:

- Empty tile: empty string
- Numbered tile: `2`, `4`, `8`, and so on

The runtime never changes a field's `fillColor`. This keeps the grid visible when Chrome refreshes a field appearance after its value changes.

## Form controls

The PDF contains these controls:

- `score`: current score
- `message`: READY, RUNNING, CLEAR!, or FAILED
- `start`: starts or retries the game
- `up`, `down`, `left`, `right`: perform one move

The buttons contain small JavaScript actions. Every action first makes sure the shared runtime exists, then calls the relevant game function.

## Game state

The runtime keeps these values in the PDF JavaScript context:

- 4 by 4 numeric board
- score
- current status

The READY board is empty. START creates a new board and places two random tiles, then changes the status to RUNNING. Direction buttons are ignored until the game is running.

## Moving and merging

For each move, the selected rows or columns are read in the direction of travel. Zeros are removed, equal neighboring values merge once, and zeros are added back to make four positions.

For example:

```text
[2, 2, 2, 2] -> [4, 4, 0, 0]
```

The two merges add 8 to the score. A newly created merge is not merged again during the same button press.

If the board did not change, no new tile is created. If the board did change, one new tile is placed in an empty position. New tiles are usually 2 and occasionally 4.

## WIN and GAME_OVER

If a move creates a tile of 2048 or higher, the state becomes WIN immediately and the message field displays CLEAR!. The final board and score remain visible, and direction buttons stop changing the game. START / RETRY begins a fresh game.

If the board has no empty cells and no adjacent equal values, the state becomes GAME_OVER and the message field displays FAILED. The final board and score remain visible, and START / RETRY can be used to restart.

The MVP intentionally uses a small message field instead of a long status field or a board-clearing end screen. This preserves the final board so the winning or losing position can still be inspected.

## Why Chrome desktop PDF viewer

PDF JavaScript support varies between applications. Some viewers disable document JavaScript, some support button actions but not all form updates, and mobile or in-app viewers are often more restricted.

This project targets Chrome desktop PDF viewer because it supports the AcroForm button actions and text field updates needed for the experiment. Mobile PDF viewers and in-app PDF previews should be treated as unsupported or unreliable.
