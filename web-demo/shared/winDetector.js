const { BOARD_SIZE, WIN_LENGTH, GAME_STATUS } = require('./constants');
const { getPieceAt } = require('./gameState');

/**
 * Check if there's a winner
 * Returns { hasWinner: boolean, winner: player|null, winningLine: array|null }
 */
function checkWinner(gameState) {
  // Check all possible winning lines
  const winningLine = findWinningLine(gameState);

  if (winningLine) {
    const winner = getPieceAt(gameState, winningLine[0].row, winningLine[0].col).player;
    return {
      hasWinner: true,
      winner: winner,
      winningLine: winningLine
    };
  }

  return {
    hasWinner: false,
    winner: null,
    winningLine: null
  };
}

/**
 * Find winning line on the board
 */
function findWinningLine(gameState) {
  // Check horizontal lines
  for (let row = 0; row < BOARD_SIZE; row++) {
    const line = checkLine(gameState,
      Array.from({ length: BOARD_SIZE }, (_, i) => ({ row, col: i }))
    );
    if (line) return line;
  }

  // Check vertical lines
  for (let col = 0; col < BOARD_SIZE; col++) {
    const line = checkLine(gameState,
      Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col }))
    );
    if (line) return line;
  }

  // Check diagonal (top-left to bottom-right)
  const diag1 = checkLine(gameState,
    Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col: i }))
  );
  if (diag1) return diag1;

  // Check diagonal (top-right to bottom-left)
  const diag2 = checkLine(gameState,
    Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col: BOARD_SIZE - 1 - i }))
  );
  if (diag2) return diag2;

  return null;
}

/**
 * Check if a specific line has WIN_LENGTH pieces of the same player
 */
function checkLine(gameState, positions) {
  if (positions.length < WIN_LENGTH) return null;

  const firstPiece = getPieceAt(gameState, positions[0].row, positions[0].col);
  if (!firstPiece) return null;

  const player = firstPiece.player;

  // Check if all positions have pieces from the same player
  for (let i = 1; i < positions.length; i++) {
    const piece = getPieceAt(gameState, positions[i].row, positions[i].col);
    if (!piece || piece.player !== player) {
      return null;
    }
  }

  // All positions have pieces from the same player
  return positions;
}

/**
 * Check if game is a draw (no valid moves available)
 */
function checkDraw(gameState, currentPlayer) {
  const { getPlayerData } = require('./gameState');
  const { getValidMovesForPiece, getValidPlacements } = require('./moveValidator');

  const playerData = getPlayerData(gameState, currentPlayer);

  // Check if player can place any piece
  const availablePieces = [...playerData.pieces, ...playerData.captured];
  for (const pieceType of availablePieces) {
    const placements = getValidPlacements(gameState, currentPlayer, pieceType);
    if (placements.length > 0) {
      return false; // Can place a piece, not a draw
    }
  }

  // Check if player can move any piece
  for (const piece of playerData.onBoard) {
    const moves = getValidMovesForPiece(gameState, currentPlayer, piece.row, piece.col);
    if (moves.length > 0) {
      return false; // Can move a piece, not a draw
    }
  }

  // No valid moves available
  return true;
}

/**
 * Update game status based on win/draw conditions
 */
function updateGameStatus(gameState) {
  const winResult = checkWinner(gameState);

  if (winResult.hasWinner) {
    gameState.winner = winResult.winner;
    gameState.winningLine = winResult.winningLine;
    gameState.status = winResult.winner === 'player1'
      ? GAME_STATUS.PLAYER1_WON
      : GAME_STATUS.PLAYER2_WON;
    return gameState;
  }

  // Check for draw
  if (checkDraw(gameState, gameState.currentPlayer)) {
    gameState.status = GAME_STATUS.DRAW;
    return gameState;
  }

  return gameState;
}

module.exports = {
  checkWinner,
  checkDraw,
  updateGameStatus,
  findWinningLine
};
