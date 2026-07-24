import {
  BOARD_SIZE,
  TARGET_TILE,
  TERMINAL_BLINK_FRAMES,
  TERMINAL_BLINK_INTERVAL_MS,
} from './constants.js';
import type {Direction} from './game_logic.js';

function quote(value: string): string {
  return JSON.stringify(value);
}

function buildRuntime(): string {
  return `
if (typeof pdf2048Ready === 'undefined') {
  var pdf2048Ready = true;
  var pdf2048State = 'READY';
  var pdf2048Score = 0;
  var pdf2048Board = [];
  var pdf2048Document = this;
  var pdf2048BlinkTimer = null;
  var pdf2048BlinkFrame = 0;

  function pdf2048SetField(name, value) {
    var field = this.getField(name);
    if (field) {
      field.value = String(value);
    }
  }

  function pdf2048SetStartCaption(caption) {
    var field = pdf2048Document.getField('start');
    if (field && typeof field.buttonSetCaption === 'function') {
      try {
        field.buttonSetCaption(caption);
      } catch (error) {
        // Some PDF viewers expose button actions without dynamic captions.
      }
    }
  }

  function pdf2048ClearBlinkTimer() {
    if (pdf2048BlinkTimer !== null && typeof app !== 'undefined' &&
        typeof app.clearInterval === 'function') {
      try {
        app.clearInterval(pdf2048BlinkTimer);
      } catch (error) {
        // Ignore viewers that do not expose timer cleanup.
      }
    }
    pdf2048BlinkTimer = null;
  }

  function pdf2048EmptyBoard() {
    var board = [];
    for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
      board[row] = [];
      for (var col = 0; col < ${BOARD_SIZE}; col += 1) {
        board[row][col] = 0;
      }
    }
    return board;
  }

  function pdf2048CloneBoard(board) {
    var copy = [];
    for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
      copy[row] = board[row].slice();
    }
    return copy;
  }

  function pdf2048EmptyCells(board) {
    var cells = [];
    for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
      for (var col = 0; col < ${BOARD_SIZE}; col += 1) {
        if (board[row][col] === 0) {
          cells.push({row: row, col: col});
        }
      }
    }
    return cells;
  }

  function pdf2048AddRandomTile(board) {
    var cells = pdf2048EmptyCells(board);
    if (cells.length === 0) {
      return false;
    }
    var cell = cells[Math.floor(Math.random() * cells.length)];
    board[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  function pdf2048MergeLine(line) {
    var compact = [];
    var merged = [];
    var scoreDelta = 0;
    for (var index = 0; index < line.length; index += 1) {
      if (line[index] !== 0) {
        compact.push(line[index]);
      }
    }
    for (var compactIndex = 0; compactIndex < compact.length; compactIndex += 1) {
      if (compact[compactIndex] === compact[compactIndex + 1]) {
        var value = compact[compactIndex] * 2;
        merged.push(value);
        scoreDelta += value;
        compactIndex += 1;
      } else {
        merged.push(compact[compactIndex]);
      }
    }
    while (merged.length < ${BOARD_SIZE}) {
      merged.push(0);
    }
    return {line: merged, scoreDelta: scoreDelta};
  }

  function pdf2048ReadLine(board, direction, index) {
    var line = [];
    if (direction === 'LEFT' || direction === 'RIGHT') {
      line = board[index].slice();
    } else {
      for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
        line.push(board[row][index]);
      }
    }
    if (direction === 'RIGHT' || direction === 'DOWN') {
      line.reverse();
    }
    return line;
  }

  function pdf2048WriteLine(board, direction, index, line) {
    var values = line.slice();
    if (direction === 'RIGHT' || direction === 'DOWN') {
      values.reverse();
    }
    if (direction === 'LEFT' || direction === 'RIGHT') {
      board[index] = values;
      return;
    }
    for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
      board[row][index] = values[row];
    }
  }

  function pdf2048BoardsEqual(first, second) {
    for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
      for (var col = 0; col < ${BOARD_SIZE}; col += 1) {
        if (first[row][col] !== second[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  function pdf2048MoveBoard(board, direction) {
    var nextBoard = pdf2048CloneBoard(board);
    var scoreDelta = 0;
    for (var index = 0; index < ${BOARD_SIZE}; index += 1) {
      var result = pdf2048MergeLine(pdf2048ReadLine(board, direction, index));
      scoreDelta += result.scoreDelta;
      pdf2048WriteLine(nextBoard, direction, index, result.line);
    }
    return {
      board: nextBoard,
      scoreDelta: scoreDelta,
      moved: !pdf2048BoardsEqual(board, nextBoard)
    };
  }

  function pdf2048HasAvailableMoves(board) {
    for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
      for (var col = 0; col < ${BOARD_SIZE}; col += 1) {
        if (board[row][col] === 0) {
          return true;
        }
        if (col + 1 < ${BOARD_SIZE} && board[row][col] === board[row][col + 1]) {
          return true;
        }
        if (row + 1 < ${BOARD_SIZE} && board[row][col] === board[row + 1][col]) {
          return true;
        }
      }
    }
    return false;
  }

  function pdf2048ContainsTarget(board) {
    for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
      for (var col = 0; col < ${BOARD_SIZE}; col += 1) {
        if (board[row][col] >= ${TARGET_TILE}) {
          return true;
        }
      }
    }
    return false;
  }

  function pdf2048DisplayMessage() {
    if (pdf2048State === 'WIN') {
      return 'CLEAR!';
    }
    if (pdf2048State === 'GAME_OVER') {
      return 'FAILED';
    }
    return pdf2048State;
  }

  function pdf2048RenderBoard(showValues) {
    for (var row = 0; row < ${BOARD_SIZE}; row += 1) {
      for (var col = 0; col < ${BOARD_SIZE}; col += 1) {
        var value = pdf2048Board[row][col];
        var visibleValue = showValues && value !== 0 ? value : '';
        pdf2048SetField.call(this, 'cell_' + row + '_' + col, visibleValue);
      }
    }
  }

  function pdf2048Render() {
    pdf2048RenderBoard.call(this, true);
    pdf2048SetField.call(this, 'score', pdf2048Score);
    pdf2048SetField.call(this, 'message', pdf2048DisplayMessage());
  }

  function pdf2048RenderBlinkFrame() {
    pdf2048BlinkFrame += 1;
    pdf2048RenderBoard.call(pdf2048Document, pdf2048BlinkFrame % 2 === 0);
    pdf2048SetField.call(pdf2048Document, 'score', pdf2048Score);
    pdf2048SetField.call(pdf2048Document, 'message', pdf2048DisplayMessage());
    if (pdf2048BlinkFrame >= ${TERMINAL_BLINK_FRAMES}) {
      pdf2048ClearBlinkTimer();
      pdf2048Render.call(pdf2048Document);
    }
  }

  function pdf2048StartTerminalBlink() {
    pdf2048ClearBlinkTimer();
    pdf2048BlinkFrame = 0;
    pdf2048Render.call(pdf2048Document);
    if (typeof app !== 'undefined' && typeof app.setInterval === 'function') {
      try {
        pdf2048BlinkTimer = app.setInterval(
          'pdf2048RenderBlinkFrame();',
          ${TERMINAL_BLINK_INTERVAL_MS}
        );
      } catch (error) {
        pdf2048BlinkTimer = null;
      }
    }
  }

  function startGame2048() {
    pdf2048ClearBlinkTimer();
    pdf2048Board = pdf2048EmptyBoard();
    pdf2048Score = 0;
    pdf2048State = 'RUNNING';
    pdf2048SetStartCaption('RESTART');
    pdf2048AddRandomTile(pdf2048Board);
    pdf2048AddRandomTile(pdf2048Board);
    pdf2048Render.call(this);
  }

  function resetGame2048() {
    pdf2048ClearBlinkTimer();
    pdf2048Board = pdf2048EmptyBoard();
    pdf2048Score = 0;
    pdf2048State = 'READY';
    pdf2048SetStartCaption('START');
    pdf2048Render.call(this);
  }

  function move2048(direction) {
    if (pdf2048State !== 'RUNNING') {
      return;
    }
    var result = pdf2048MoveBoard(pdf2048Board, direction);
    if (!result.moved) {
      if (!pdf2048HasAvailableMoves(pdf2048Board)) {
        pdf2048State = 'GAME_OVER';
        pdf2048StartTerminalBlink();
      }
      return;
    }
    pdf2048Board = result.board;
    pdf2048Score += result.scoreDelta;
    if (pdf2048ContainsTarget(pdf2048Board)) {
      pdf2048State = 'WIN';
      pdf2048StartTerminalBlink();
      return;
    }
    pdf2048AddRandomTile(pdf2048Board);
    if (!pdf2048HasAvailableMoves(pdf2048Board)) {
      pdf2048State = 'GAME_OVER';
      pdf2048StartTerminalBlink();
      return;
    }
    pdf2048Render.call(this);
  }
}
`;
}

export function buildStartScript(): string {
  return `${buildRuntime()}
startGame2048.call(this);
`;
}

export function buildDirectionScript(direction: Direction): string {
  return `${buildRuntime()}
move2048.call(this, ${quote(direction)});
`;
}

export function buildResetScript(): string {
  return `${buildRuntime()}
resetGame2048.call(this);
`;
}
