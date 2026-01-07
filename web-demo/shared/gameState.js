const {
  BOARD_SIZE,
  PLAYERS,
  GAME_PHASES,
  GAME_STATUS,
  INITIAL_PIECES,
  PAWN_DIRECTION
} = require('./constants');

/**
 * Creates initial game state
 */
function createInitialGameState() {
  return {
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    currentPlayer: PLAYERS.PLAYER1,
    phase: GAME_PHASES.PLACEMENT,
    round: 1,
    status: GAME_STATUS.IN_PROGRESS,
    player1: {
      pieces: [...INITIAL_PIECES],  // Available pieces to place
      onBoard: [],                  // Pieces currently on board with positions
      captured: [],                 // Captured pieces that can be re-placed
      pawnDirections: {}            // Track pawn direction by position key
    },
    player2: {
      pieces: [...INITIAL_PIECES],
      onBoard: [],
      captured: [],
      pawnDirections: {}
    },
    moveHistory: [],
    winner: null,
    winningLine: null  // Array of positions forming the winning line
  };
}

/**
 * Get player data by player key
 */
function getPlayerData(gameState, player) {
  return gameState[player];
}

/**
 * Get opponent player key
 */
function getOpponent(player) {
  return player === PLAYERS.PLAYER1 ? PLAYERS.PLAYER2 : PLAYERS.PLAYER1;
}

/**
 * Get piece at specific board position
 */
function getPieceAt(gameState, row, col) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return null;
  }
  return gameState.board[row][col];
}

/**
 * Check if position is empty
 */
function isEmptySquare(gameState, row, col) {
  return getPieceAt(gameState, row, col) === null;
}

/**
 * Check if position belongs to opponent
 */
function isOpponentPiece(gameState, row, col, currentPlayer) {
  const piece = getPieceAt(gameState, row, col);
  if (!piece) return false;
  return piece.player !== currentPlayer;
}

/**
 * Place piece on board
 */
function placePiece(gameState, player, pieceType, row, col) {
  const playerData = getPlayerData(gameState, player);

  // Create piece object
  const piece = {
    type: pieceType,
    player: player,
    row: row,
    col: col
  };

  // For pawns, set initial direction
  if (pieceType === 'pawn') {
    const posKey = `${row},${col}`;
    playerData.pawnDirections[posKey] = PAWN_DIRECTION[player.toUpperCase()];
  }

  // Remove from available pieces or captured pieces
  const availableIndex = playerData.pieces.indexOf(pieceType);
  if (availableIndex !== -1) {
    playerData.pieces.splice(availableIndex, 1);
  } else {
    const capturedIndex = playerData.captured.indexOf(pieceType);
    if (capturedIndex !== -1) {
      playerData.captured.splice(capturedIndex, 1);
    }
  }

  // Add to board
  gameState.board[row][col] = piece;
  playerData.onBoard.push(piece);

  return gameState;
}

/**
 * Move piece on board
 */
function movePiece(gameState, fromRow, fromCol, toRow, toCol) {
  const piece = getPieceAt(gameState, fromRow, fromCol);
  if (!piece) return gameState;

  const currentPlayer = piece.player;
  const playerData = getPlayerData(gameState, currentPlayer);
  const opponent = getOpponent(currentPlayer);
  const opponentData = getPlayerData(gameState, opponent);

  // Check if capturing opponent's piece
  const targetPiece = getPieceAt(gameState, toRow, toCol);
  if (targetPiece && targetPiece.player === opponent) {
    // Remove from opponent's onBoard
    opponentData.onBoard = opponentData.onBoard.filter(p =>
      !(p.row === toRow && p.col === toCol)
    );

    // Add to opponent's captured pieces
    opponentData.captured.push(targetPiece.type);

    // Remove pawn direction if it was a pawn
    if (targetPiece.type === 'pawn') {
      const posKey = `${toRow},${toCol}`;
      delete opponentData.pawnDirections[posKey];
    }
  }

  // Handle pawn direction reversal
  if (piece.type === 'pawn') {
    const oldPosKey = `${fromRow},${fromCol}`;
    const newPosKey = `${toRow},${toCol}`;

    // Check if pawn reached opposite end
    const currentDirection = playerData.pawnDirections[oldPosKey];
    if (
      (currentDirection === 1 && toRow === BOARD_SIZE - 1) ||
      (currentDirection === -1 && toRow === 0)
    ) {
      // Reverse direction
      playerData.pawnDirections[newPosKey] = -currentDirection;
    } else {
      playerData.pawnDirections[newPosKey] = currentDirection;
    }

    delete playerData.pawnDirections[oldPosKey];
  }

  // Clear old position
  gameState.board[fromRow][fromCol] = null;

  // Update piece position
  piece.row = toRow;
  piece.col = toCol;

  // Place at new position
  gameState.board[toRow][toCol] = piece;

  return gameState;
}

/**
 * Switch to next player
 */
function switchPlayer(gameState) {
  gameState.currentPlayer = getOpponent(gameState.currentPlayer);

  // Update round and phase
  if (gameState.currentPlayer === PLAYERS.PLAYER1) {
    gameState.round++;
  }

  // Switch to strategy phase after round 3
  if (gameState.round >= 4 && gameState.phase === GAME_PHASES.PLACEMENT) {
    gameState.phase = GAME_PHASES.STRATEGY;
  }

  return gameState;
}

/**
 * Add move to history
 */
function addMoveToHistory(gameState, action) {
  gameState.moveHistory.push({
    ...action,
    round: gameState.round,
    player: gameState.currentPlayer
  });
  return gameState;
}

/**
 * Get pawn direction at position
 */
function getPawnDirection(gameState, player, row, col) {
  const playerData = getPlayerData(gameState, player);
  const posKey = `${row},${col}`;
  return playerData.pawnDirections[posKey] || PAWN_DIRECTION[player.toUpperCase()];
}

module.exports = {
  createInitialGameState,
  getPlayerData,
  getOpponent,
  getPieceAt,
  isEmptySquare,
  isOpponentPiece,
  placePiece,
  movePiece,
  switchPlayer,
  addMoveToHistory,
  getPawnDirection
};
