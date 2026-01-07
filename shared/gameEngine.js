/**
 * Main Game Engine - Orchestrates all game logic
 */

const {
  createInitialGameState,
  placePiece,
  movePiece,
  switchPlayer,
  addMoveToHistory,
  getPlayerData
} = require('./gameState');

const {
  isValidPlacement,
  isValidMove
} = require('./moveValidator');

const { updateGameStatus } = require('./winDetector');
const { ACTION_TYPES, GAME_STATUS } = require('./constants');

/**
 * Create a new game
 */
function createGame(player1Name = 'Player 1', player2Name = 'Player 2') {
  const gameState = createInitialGameState();
  gameState.player1Name = player1Name;
  gameState.player2Name = player2Name;
  return gameState;
}

/**
 * Execute an action (place or move)
 * Returns { success: boolean, gameState: object, error: string|null }
 */
function executeAction(gameState, action) {
  // Check if game is already over
  if (gameState.status !== GAME_STATUS.IN_PROGRESS) {
    return {
      success: false,
      gameState: gameState,
      error: 'Game is already over'
    };
  }

  const currentPlayer = gameState.currentPlayer;

  if (action.type === ACTION_TYPES.PLACE) {
    // Validate placement
    const validation = isValidPlacement(
      gameState,
      currentPlayer,
      action.pieceType,
      action.row,
      action.col
    );

    if (!validation.valid) {
      return {
        success: false,
        gameState: gameState,
        error: validation.reason
      };
    }

    // Execute placement
    placePiece(gameState, currentPlayer, action.pieceType, action.row, action.col);

  } else if (action.type === ACTION_TYPES.MOVE) {
    // Validate move
    const validation = isValidMove(
      gameState,
      currentPlayer,
      action.fromRow,
      action.fromCol,
      action.toRow,
      action.toCol
    );

    if (!validation.valid) {
      return {
        success: false,
        gameState: gameState,
        error: validation.reason
      };
    }

    // Execute move
    movePiece(gameState, action.fromRow, action.fromCol, action.toRow, action.toCol);

  } else {
    return {
      success: false,
      gameState: gameState,
      error: 'Invalid action type'
    };
  }

  // Add to move history
  addMoveToHistory(gameState, action);

  // Check win/draw conditions
  updateGameStatus(gameState);

  // Switch player if game is still in progress
  if (gameState.status === GAME_STATUS.IN_PROGRESS) {
    switchPlayer(gameState);
  }

  return {
    success: true,
    gameState: gameState,
    error: null
  };
}

/**
 * Get game summary for display
 */
function getGameSummary(gameState) {
  return {
    currentPlayer: gameState.currentPlayer,
    phase: gameState.phase,
    round: gameState.round,
    status: gameState.status,
    winner: gameState.winner,
    winningLine: gameState.winningLine,
    player1: {
      name: gameState.player1Name,
      availablePieces: gameState.player1.pieces,
      capturedPieces: gameState.player1.captured,
      piecesOnBoard: gameState.player1.onBoard.length
    },
    player2: {
      name: gameState.player2Name,
      availablePieces: gameState.player2.pieces,
      capturedPieces: gameState.player2.captured,
      piecesOnBoard: gameState.player2.onBoard.length
    }
  };
}

/**
 * Restart game with same players
 */
function restartGame(gameState) {
  const player1Name = gameState.player1Name;
  const player2Name = gameState.player2Name;
  return createGame(player1Name, player2Name);
}

module.exports = {
  createGame,
  executeAction,
  getGameSummary,
  restartGame
};
