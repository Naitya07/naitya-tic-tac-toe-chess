const { AI_DIFFICULTY, ACTION_TYPES, GAME_PHASES } = require('./constants');
const {
  getPlayerData,
  getOpponent,
  getPieceAt,
  createInitialGameState
} = require('./gameState');
const {
  getValidMovesForPiece,
  getValidPlacements,
  isValidMove,
  isValidPlacement
} = require('./moveValidator');
const { checkWinner, findWinningLine } = require('./winDetector');

/**
 * Main AI decision function
 * Returns an action: { type: 'place'|'move', ... }
 */
function getAIMove(gameState, aiPlayer, difficulty = AI_DIFFICULTY.MEDIUM) {
  switch (difficulty) {
    case AI_DIFFICULTY.EASY:
      return getEasyMove(gameState, aiPlayer);
    case AI_DIFFICULTY.MEDIUM:
      return getMediumMove(gameState, aiPlayer);
    case AI_DIFFICULTY.HARD:
      return getHardMove(gameState, aiPlayer);
    default:
      return getMediumMove(gameState, aiPlayer);
  }
}

/**
 * Easy AI: Random valid move
 */
function getEasyMove(gameState, aiPlayer) {
  const allPossibleActions = getAllPossibleActions(gameState, aiPlayer);

  if (allPossibleActions.length === 0) {
    return null; // No valid moves (draw)
  }

  // Pick random action
  const randomIndex = Math.floor(Math.random() * allPossibleActions.length);
  return allPossibleActions[randomIndex];
}

/**
 * Medium AI: Block wins + basic strategy
 */
function getMediumMove(gameState, aiPlayer) {
  const opponent = getOpponent(aiPlayer);

  // 1. Check if AI can win in this move
  const winningMove = findWinningMove(gameState, aiPlayer);
  if (winningMove) {
    return winningMove;
  }

  // 2. Check if need to block opponent's winning move
  const blockingMove = findWinningMove(gameState, opponent);
  if (blockingMove) {
    // Convert opponent's winning move to AI's move
    return blockingMove;
  }

  // 3. Try to capture opponent's piece
  const captureMove = findCaptureMove(gameState, aiPlayer);
  if (captureMove) {
    return captureMove;
  }

  // 4. Try to build towards a line
  const strategicMove = findStrategicMove(gameState, aiPlayer);
  if (strategicMove) {
    return strategicMove;
  }

  // 5. Fall back to random move
  return getEasyMove(gameState, aiPlayer);
}

/**
 * Hard AI: Minimax with lookahead
 */
function getHardMove(gameState, aiPlayer) {
  const depth = 3; // Lookahead depth
  const result = minimax(gameState, depth, true, aiPlayer, -Infinity, Infinity);
  return result.action;
}

/**
 * Minimax algorithm with alpha-beta pruning
 */
function minimax(gameState, depth, isMaximizing, aiPlayer, alpha, beta) {
  // Check terminal conditions
  const winResult = checkWinner(gameState);
  if (winResult.hasWinner) {
    if (winResult.winner === aiPlayer) {
      return { score: 1000, action: null };
    } else {
      return { score: -1000, action: null };
    }
  }

  if (depth === 0) {
    return { score: evaluateBoard(gameState, aiPlayer), action: null };
  }

  const currentPlayer = isMaximizing ? aiPlayer : getOpponent(aiPlayer);
  const allActions = getAllPossibleActions(gameState, currentPlayer);

  if (allActions.length === 0) {
    return { score: 0, action: null }; // Draw
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    let bestAction = null;

    for (const action of allActions) {
      const newState = simulateAction(gameState, action, currentPlayer);
      const result = minimax(newState, depth - 1, false, aiPlayer, alpha, beta);

      if (result.score > maxScore) {
        maxScore = result.score;
        bestAction = action;
      }

      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }

    return { score: maxScore, action: bestAction };
  } else {
    let minScore = Infinity;
    let bestAction = null;

    for (const action of allActions) {
      const newState = simulateAction(gameState, action, currentPlayer);
      const result = minimax(newState, depth - 1, true, aiPlayer, alpha, beta);

      if (result.score < minScore) {
        minScore = result.score;
        bestAction = action;
      }

      beta = Math.min(beta, result.score);
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }

    return { score: minScore, action: bestAction };
  }
}

/**
 * Evaluate board state for AI (heuristic)
 */
function evaluateBoard(gameState, aiPlayer) {
  const opponent = getOpponent(aiPlayer);
  let score = 0;

  // Count pieces on board
  const aiData = getPlayerData(gameState, aiPlayer);
  const oppData = getPlayerData(gameState, opponent);

  score += aiData.onBoard.length * 10;
  score -= oppData.onBoard.length * 10;

  // Evaluate potential lines
  score += evaluateLines(gameState, aiPlayer) * 5;
  score -= evaluateLines(gameState, opponent) * 5;

  // Center control bonus
  score += evaluateCenterControl(gameState, aiPlayer) * 3;

  return score;
}

/**
 * Evaluate potential winning lines
 */
function evaluateLines(gameState, player) {
  let lineScore = 0;
  const { BOARD_SIZE } = require('./constants');

  // Check all possible lines (rows, columns, diagonals)
  const allLines = [];

  // Rows
  for (let row = 0; row < BOARD_SIZE; row++) {
    allLines.push(Array.from({ length: BOARD_SIZE }, (_, i) => ({ row, col: i })));
  }

  // Columns
  for (let col = 0; col < BOARD_SIZE; col++) {
    allLines.push(Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col })));
  }

  // Diagonals
  allLines.push(Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col: i })));
  allLines.push(Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col: BOARD_SIZE - 1 - i })));

  for (const line of allLines) {
    let playerCount = 0;
    let emptyCount = 0;

    for (const pos of line) {
      const piece = getPieceAt(gameState, pos.row, pos.col);
      if (piece && piece.player === player) {
        playerCount++;
      } else if (!piece) {
        emptyCount++;
      }
    }

    // Only count lines that don't have opponent pieces
    if (playerCount > 0 && emptyCount + playerCount === BOARD_SIZE) {
      lineScore += playerCount * playerCount; // Exponential reward for more pieces in a line
    }
  }

  return lineScore;
}

/**
 * Evaluate center control
 */
function evaluateCenterControl(gameState, player) {
  const { BOARD_SIZE } = require('./constants');
  let centerScore = 0;

  // Center squares (for 4x4 board, the center 2x2 area)
  const centerSquares = [
    { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 1 }, { row: 2, col: 2 }
  ];

  for (const square of centerSquares) {
    const piece = getPieceAt(gameState, square.row, square.col);
    if (piece && piece.player === player) {
      centerScore++;
    }
  }

  return centerScore;
}

/**
 * Find a move that would win the game
 */
function findWinningMove(gameState, player) {
  const allActions = getAllPossibleActions(gameState, player);

  for (const action of allActions) {
    const newState = simulateAction(gameState, action, player);
    const winResult = checkWinner(newState);

    if (winResult.hasWinner && winResult.winner === player) {
      return action;
    }
  }

  return null;
}

/**
 * Find a move that captures opponent's piece
 */
function findCaptureMove(gameState, player) {
  const playerData = getPlayerData(gameState, player);

  // Look for moves that capture
  for (const piece of playerData.onBoard) {
    const validMoves = getValidMovesForPiece(gameState, player, piece.row, piece.col);

    for (const move of validMoves) {
      const targetPiece = getPieceAt(gameState, move.row, move.col);
      if (targetPiece && targetPiece.player !== player) {
        return {
          type: ACTION_TYPES.MOVE,
          fromRow: piece.row,
          fromCol: piece.col,
          toRow: move.row,
          toCol: move.col
        };
      }
    }
  }

  return null;
}

/**
 * Find a strategic move (build towards a line)
 */
function findStrategicMove(gameState, player) {
  const allActions = getAllPossibleActions(gameState, player);
  let bestAction = null;
  let bestScore = -Infinity;

  for (const action of allActions) {
    const newState = simulateAction(gameState, action, player);
    const score = evaluateLines(newState, player);

    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  return bestAction;
}

/**
 * Get all possible actions for a player
 */
function getAllPossibleActions(gameState, player) {
  const actions = [];
  const playerData = getPlayerData(gameState, player);

  // Get all possible placements
  const availablePieces = [...playerData.pieces, ...playerData.captured];
  for (const pieceType of availablePieces) {
    const placements = getValidPlacements(gameState, player, pieceType);
    for (const placement of placements) {
      actions.push({
        type: ACTION_TYPES.PLACE,
        pieceType: pieceType,
        row: placement.row,
        col: placement.col
      });
    }
  }

  // Get all possible moves (only in strategy phase)
  if (gameState.phase !== GAME_PHASES.PLACEMENT) {
    for (const piece of playerData.onBoard) {
      const validMoves = getValidMovesForPiece(gameState, player, piece.row, piece.col);
      for (const move of validMoves) {
        actions.push({
          type: ACTION_TYPES.MOVE,
          fromRow: piece.row,
          fromCol: piece.col,
          toRow: move.row,
          toCol: move.col
        });
      }
    }
  }

  return actions;
}

/**
 * Simulate an action on a game state (without modifying original)
 */
function simulateAction(gameState, action, player) {
  // Deep clone the game state
  const newState = JSON.parse(JSON.stringify(gameState));

  const { placePiece, movePiece } = require('./gameState');

  if (action.type === ACTION_TYPES.PLACE) {
    placePiece(newState, player, action.pieceType, action.row, action.col);
  } else if (action.type === ACTION_TYPES.MOVE) {
    movePiece(newState, action.fromRow, action.fromCol, action.toRow, action.toCol);
  }

  return newState;
}

module.exports = {
  getAIMove,
  getAllPossibleActions,
  simulateAction
};
