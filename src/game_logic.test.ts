import assert from 'node:assert/strict';
import {
  applyMove,
  boardFromRows,
  boardContains,
  hasAvailableMoves,
  moveBoard,
  startGame,
} from './game_logic.js';

function constantRandom(value: number): () => number {
  return () => value;
}

function runTests(): void {
  const initial = startGame(constantRandom(0));
  assert.equal(initial.status, 'RUNNING');
  assert.equal(initial.score, 0);
  assert.equal(initial.board.flat().filter((value) => value !== 0).length, 2);
  assert.equal(initial.board.flat().every((value) => value === 0 || value === 2), true);

  const pair = moveBoard(boardFromRows(
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ), 'LEFT');
  assert.deepEqual(pair.board[0], [4, 0, 0, 0]);
  assert.equal(pair.scoreDelta, 4);

  const fourPair = moveBoard(boardFromRows(
    [2, 2, 2, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ), 'LEFT');
  assert.deepEqual(fourPair.board[0], [4, 4, 0, 0]);
  assert.equal(fourPair.scoreDelta, 8);

  const largePair = moveBoard(boardFromRows(
    [4, 4, 4, 4],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ), 'LEFT');
  assert.deepEqual(largePair.board[0], [8, 8, 0, 0]);
  assert.equal(largePair.scoreDelta, 16);

  const directional = boardFromRows(
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  );
  assert.deepEqual(moveBoard(directional, 'UP').board[0], [4, 0, 0, 0]);
  assert.deepEqual(moveBoard(directional, 'DOWN').board[3], [4, 0, 0, 0]);

  const winning = {
    board: boardFromRows(
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ),
    score: 100,
    status: 'RUNNING' as const,
  };
  const winResult = applyMove(winning, 'LEFT', constantRandom(0));
  assert.equal(winResult.status, 'WIN');
  assert.equal(boardContains(winResult.board), true);
  assert.equal(winResult.score, 2148);

  const gameOverBoard = boardFromRows(
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  );
  assert.equal(hasAvailableMoves(gameOverBoard), false);
  const gameOver = applyMove(
    {board: gameOverBoard, score: 50, status: 'RUNNING'},
    'LEFT',
    constantRandom(0),
  );
  assert.equal(gameOver.status, 'GAME_OVER');
  assert.equal(gameOver.score, 50);

  const blocked = applyMove(
    {board: boardFromRows(
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ), score: 10, status: 'READY'},
    'RIGHT',
  );
  assert.equal(blocked.status, 'READY');
  assert.equal(blocked.score, 10);

  console.log('Verified 2048 game logic.');
}

runTests();
