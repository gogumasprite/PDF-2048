import {BOARD_SIZE, TARGET_TILE} from './constants.js';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameStatus = 'READY' | 'RUNNING' | 'WIN' | 'GAME_OVER';
export type Board = number[][];
export type RandomSource = () => number;

export type GameState = {
  board: Board;
  score: number;
  status: GameStatus;
};

export type MoveResult = {
  board: Board;
  scoreDelta: number;
  moved: boolean;
};

export function createEmptyBoard(): Board {
  return Array.from({length: BOARD_SIZE}, () => Array(BOARD_SIZE).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function boardFromRows(...rows: number[][]): Board {
  if (rows.length !== BOARD_SIZE || rows.some((row) => row.length !== BOARD_SIZE)) {
    throw new Error(`Expected a ${BOARD_SIZE} by ${BOARD_SIZE} board.`);
  }
  return rows.map((row) => [...row]);
}

function boardsEqual(first: Board, second: Board): boolean {
  return first.every((row, rowIndex) =>
    row.every((value, colIndex) => value === second[rowIndex][colIndex]),
  );
}

function mergeLine(line: number[]): {line: number[]; scoreDelta: number} {
  const compact = line.filter((value) => value !== 0);
  const merged: number[] = [];
  let scoreDelta = 0;

  for (let index = 0; index < compact.length; index += 1) {
    if (compact[index] === compact[index + 1]) {
      const value = compact[index] * 2;
      merged.push(value);
      scoreDelta += value;
      index += 1;
    } else {
      merged.push(compact[index]);
    }
  }

  while (merged.length < BOARD_SIZE) {
    merged.push(0);
  }
  return {line: merged, scoreDelta};
}

function readLine(board: Board, direction: Direction, index: number): number[] {
  if (direction === 'LEFT') {
    return [...board[index]];
  }
  if (direction === 'RIGHT') {
    return [...board[index]].reverse();
  }
  if (direction === 'UP') {
    return board.map((row) => row[index]);
  }
  return board.map((row) => row[index]).reverse();
}

function writeLine(
  board: Board,
  direction: Direction,
  index: number,
  line: number[],
): void {
  const values = direction === 'RIGHT' || direction === 'DOWN' ? [...line].reverse() : line;
  if (direction === 'LEFT' || direction === 'RIGHT') {
    board[index] = [...values];
    return;
  }
  values.forEach((value, rowIndex) => {
    board[rowIndex][index] = value;
  });
}

export function moveBoard(board: Board, direction: Direction): MoveResult {
  const nextBoard = cloneBoard(board);
  let scoreDelta = 0;

  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const result = mergeLine(readLine(board, direction, index));
    scoreDelta += result.scoreDelta;
    writeLine(nextBoard, direction, index, result.line);
  }

  return {
    board: nextBoard,
    scoreDelta,
    moved: !boardsEqual(board, nextBoard),
  };
}

export function boardContains(board: Board, target: number = TARGET_TILE): boolean {
  return board.some((row) => row.includes(target));
}

export function hasAvailableMoves(board: Board): boolean {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === 0) {
        return true;
      }
      if (col + 1 < BOARD_SIZE && board[row][col] === board[row][col + 1]) {
        return true;
      }
      if (row + 1 < BOARD_SIZE && board[row][col] === board[row + 1][col]) {
        return true;
      }
    }
  }
  return false;
}

export function addRandomTile(
  board: Board,
  random: RandomSource = Math.random,
): {board: Board; added: boolean} {
  const emptyCells: Array<{row: number; col: number}> = [];
  board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === 0) {
        emptyCells.push({row: rowIndex, col: colIndex});
      }
    });
  });

  if (emptyCells.length === 0) {
    return {board: cloneBoard(board), added: false};
  }

  const nextBoard = cloneBoard(board);
  const cell = emptyCells[Math.floor(random() * emptyCells.length)];
  nextBoard[cell.row][cell.col] = random() < 0.9 ? 2 : 4;
  return {board: nextBoard, added: true};
}

export function createReadyState(): GameState {
  return {board: createEmptyBoard(), score: 0, status: 'READY'};
}

export function startGame(random: RandomSource = Math.random): GameState {
  const first = addRandomTile(createEmptyBoard(), random);
  const second = addRandomTile(first.board, random);
  return {board: second.board, score: 0, status: 'RUNNING'};
}

export function applyMove(
  state: GameState,
  direction: Direction,
  random: RandomSource = Math.random,
): GameState {
  if (state.status !== 'RUNNING') {
    return {board: cloneBoard(state.board), score: state.score, status: state.status};
  }

  const result = moveBoard(state.board, direction);
  if (!result.moved) {
    return {
      board: cloneBoard(state.board),
      score: state.score,
      status: hasAvailableMoves(state.board) ? 'RUNNING' : 'GAME_OVER',
    };
  }

  const score = state.score + result.scoreDelta;
  if (boardContains(result.board)) {
    return {board: result.board, score, status: 'WIN'};
  }

  const spawned = addRandomTile(result.board, random);
  return {
    board: spawned.board,
    score,
    status: !hasAvailableMoves(spawned.board) ? 'GAME_OVER' : 'RUNNING',
  };
}
