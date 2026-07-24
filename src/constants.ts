export const BOARD_SIZE = 4;
export const TARGET_TILE = 2048;

export const PAGE_WIDTH = 900;
export const PAGE_HEIGHT = 506;

export const GRID_LEFT = 96;
export const GRID_BOTTOM = 70;
export const CELL_SIZE = 72;
export const BOARD_SIZE_PT = BOARD_SIZE * CELL_SIZE;

export const CONTROL_LEFT = 500;
export const OUTPUT_DIRECTORY = 'generated';
export const OUTPUT_FILE = 'playable-pdf-2048.pdf';
export const COMPATIBILITY_OUTPUT_FILE = 'playable-pdf-2048-fixed.pdf';

export const FIELD_NAMES = {
  score: 'score',
  message: 'message',
  start: 'start',
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
} as const;

export const CELL_BACKGROUND = {r: 0.91, g: 0.94, b: 0.87};
export const PAGE_BACKGROUND = {r: 0.95, g: 0.95, b: 0.91};
export const FRAME_COLOR = {r: 0.16, g: 0.25, b: 0.17};
export const GRID_COLOR = {r: 0.42, g: 0.53, b: 0.39};
export const TEXT_COLOR = {r: 0.04, g: 0.10, b: 0.05};
export const BUTTON_COLOR = {r: 0.10, g: 0.32, b: 0.16};
