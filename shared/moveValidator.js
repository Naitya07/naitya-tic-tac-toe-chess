const {
  BOARD_SIZE,
  PIECE_TYPES,
  GAME_PHASES,
  ACTION_TYPES
} = require('./constants');

const {
  getPieceAt,
  isEmptySquare,
  isOpponentPiece,
  getPlayerData,
  getPawnDirection
} = require('./gameState');

/**
 * Validate if a placement action is legal
 */
function isValidPlacement(gameState, player, pieceType, row, col) {
  // Check if position is within bounds
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return { valid: false, reason: 'Position out of bounds' };
  }

  // Check if square is empty
  if (!isEmptySquare(gameState, row, col)) {
    return { valid: false, reason: 'Square is occupied' };
  }

  const playerData = getPlayerData(gameState, player);

  // Check if piece is available to place
  const hasInAvailable = playerData.pieces.includes(pieceType);
  const hasInCaptured = playerData.captured.includes(pieceType);

  if (!hasInAvailable && !hasInCaptured) {
    return { valid: false, reason: 'Piece not available' };
  }

  // In placement phase, only allow placement
  if (gameState.phase === GAME_PHASES.PLACEMENT) {
    return { valid: true };
  }

  // In strategy phase, placement is allowed
  return { valid: true };
}

/**
 * Validate if a move action is legal
 */
function isValidMove(gameState, player, fromRow, fromCol, toRow, toCol) {
  // Cannot move during placement phase
  if (gameState.phase === GAME_PHASES.PLACEMENT) {
    return { valid: false, reason: 'Cannot move during placement phase' };
  }

  // Check if positions are within bounds
  if (
    fromRow < 0 || fromRow >= BOARD_SIZE ||
    fromCol < 0 || fromCol >= BOARD_SIZE ||
    toRow < 0 || toRow >= BOARD_SIZE ||
    toCol < 0 || toCol >= BOARD_SIZE
  ) {
    return { valid: false, reason: 'Position out of bounds' };
  }

  // Check if there's a piece at from position
  const piece = getPieceAt(gameState, fromRow, fromCol);
  if (!piece) {
    return { valid: false, reason: 'No piece at source position' };
  }

  // Check if piece belongs to current player
  if (piece.player !== player) {
    return { valid: false, reason: 'Cannot move opponent\'s piece' };
  }

  // Check if destination is not occupied by own piece
  const destPiece = getPieceAt(gameState, toRow, toCol);
  if (destPiece && destPiece.player === player) {
    return { valid: false, reason: 'Cannot capture own piece' };
  }

  // Validate piece-specific movement
  const moveValidation = validatePieceMovement(
    gameState,
    piece.type,
    player,
    fromRow,
    fromCol,
    toRow,
    toCol
  );

  return moveValidation;
}

/**
 * Validate piece-specific movement rules
 */
function validatePieceMovement(gameState, pieceType, player, fromRow, fromCol, toRow, toCol) {
  switch (pieceType) {
    case PIECE_TYPES.PAWN:
      return validatePawnMove(gameState, player, fromRow, fromCol, toRow, toCol);
    case PIECE_TYPES.ROOK:
      return validateRookMove(gameState, fromRow, fromCol, toRow, toCol);
    case PIECE_TYPES.KNIGHT:
      return validateKnightMove(fromRow, fromCol, toRow, toCol);
    case PIECE_TYPES.BISHOP:
      return validateBishopMove(gameState, fromRow, fromCol, toRow, toCol);
    default:
      return { valid: false, reason: 'Unknown piece type' };
  }
}

/**
 * Validate pawn movement
 */
function validatePawnMove(gameState, player, fromRow, fromCol, toRow, toCol) {
  const direction = getPawnDirection(gameState, player, fromRow, fromCol);
  const rowDiff = toRow - fromRow;
  const colDiff = Math.abs(toCol - fromCol);

  // Pawn can move forward one square
  if (rowDiff === direction && colDiff === 0) {
    if (isEmptySquare(gameState, toRow, toCol)) {
      return { valid: true };
    }
    return { valid: false, reason: 'Pawn cannot move to occupied square' };
  }

  // Pawn can capture diagonally
  if (rowDiff === direction && colDiff === 1) {
    if (isOpponentPiece(gameState, toRow, toCol, player)) {
      return { valid: true };
    }
    return { valid: false, reason: 'Pawn can only move diagonally to capture' };
  }

  return { valid: false, reason: 'Invalid pawn movement' };
}

/**
 * Validate rook movement (straight lines)
 */
function validateRookMove(gameState, fromRow, fromCol, toRow, toCol) {
  // Rook moves in straight lines (horizontal or vertical)
  if (fromRow !== toRow && fromCol !== toCol) {
    return { valid: false, reason: 'Rook must move in straight line' };
  }

  // Check path is clear
  if (!isPathClear(gameState, fromRow, fromCol, toRow, toCol)) {
    return { valid: false, reason: 'Path is blocked' };
  }

  return { valid: true };
}

/**
 * Validate knight movement (L-shape)
 */
function validateKnightMove(fromRow, fromCol, toRow, toCol) {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  // Knight moves in L-shape: 2 squares in one direction, 1 in the other
  if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
    return { valid: true };
  }

  return { valid: false, reason: 'Invalid knight movement' };
}

/**
 * Validate bishop movement (diagonal)
 */
function validateBishopMove(gameState, fromRow, fromCol, toRow, toCol) {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  // Bishop moves diagonally
  if (rowDiff !== colDiff) {
    return { valid: false, reason: 'Bishop must move diagonally' };
  }

  // Check path is clear
  if (!isPathClear(gameState, fromRow, fromCol, toRow, toCol)) {
    return { valid: false, reason: 'Path is blocked' };
  }

  return { valid: true };
}

/**
 * Check if path between two positions is clear (for rook and bishop)
 */
function isPathClear(gameState, fromRow, fromCol, toRow, toCol) {
  const rowDir = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
  const colDir = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

  let currentRow = fromRow + rowDir;
  let currentCol = fromCol + colDir;

  while (currentRow !== toRow || currentCol !== toCol) {
    if (!isEmptySquare(gameState, currentRow, currentCol)) {
      return false;
    }
    currentRow += rowDir;
    currentCol += colDir;
  }

  return true;
}

/**
 * Get all valid moves for a piece at a position
 */
function getValidMovesForPiece(gameState, player, row, col) {
  const piece = getPieceAt(gameState, row, col);
  if (!piece || piece.player !== player) {
    return [];
  }

  const validMoves = [];

  for (let toRow = 0; toRow < BOARD_SIZE; toRow++) {
    for (let toCol = 0; toCol < BOARD_SIZE; toCol++) {
      const validation = isValidMove(gameState, player, row, col, toRow, toCol);
      if (validation.valid) {
        validMoves.push({ row: toRow, col: toCol });
      }
    }
  }

  return validMoves;
}

/**
 * Get all valid placements for a player
 */
function getValidPlacements(gameState, player, pieceType) {
  const validPlacements = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const validation = isValidPlacement(gameState, player, pieceType, row, col);
      if (validation.valid) {
        validPlacements.push({ row, col });
      }
    }
  }

  return validPlacements;
}

module.exports = {
  isValidPlacement,
  isValidMove,
  validatePieceMovement,
  getValidMovesForPiece,
  getValidPlacements,
  isPathClear
};
