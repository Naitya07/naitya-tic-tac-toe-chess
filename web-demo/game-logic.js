// Browser-compatible game logic - all-in-one file

// ============================================
// CONSTANTS
// ============================================
const BOARD_SIZE = 4;
const WIN_LENGTH = 4;

const PIECE_TYPES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop'
};

const PLAYERS = {
  PLAYER1: 'player1',
  PLAYER2: 'player2'
};

const GAME_PHASES = {
  PLACEMENT: 'placement',
  STRATEGY: 'strategy'
};

const GAME_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  PLAYER1_WON: 'player1_won',
  PLAYER2_WON: 'player2_won',
  DRAW: 'draw'
};

const ACTION_TYPES = {
  PLACE: 'place',
  MOVE: 'move'
};

const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const PAWN_DIRECTION = {
  PLAYER1: 1,
  PLAYER2: -1
};

const INITIAL_PIECES = [
  PIECE_TYPES.PAWN,
  PIECE_TYPES.ROOK,
  PIECE_TYPES.KNIGHT,
  PIECE_TYPES.BISHOP
];

// ============================================
// GAME STATE
// ============================================
function createInitialGameState() {
  return {
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    currentPlayer: PLAYERS.PLAYER1,
    phase: GAME_PHASES.PLACEMENT,
    round: 1,
    status: GAME_STATUS.IN_PROGRESS,
    player1: {
      pieces: [...INITIAL_PIECES],
      onBoard: [],
      captured: [],
      pawnDirections: {}
    },
    player2: {
      pieces: [...INITIAL_PIECES],
      onBoard: [],
      captured: [],
      pawnDirections: {}
    },
    moveHistory: [],
    winner: null,
    winningLine: null
  };
}

function getPlayerData(gameState, player) {
  return gameState[player];
}

function getOpponent(player) {
  return player === PLAYERS.PLAYER1 ? PLAYERS.PLAYER2 : PLAYERS.PLAYER1;
}

function getPieceAt(gameState, row, col) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return null;
  }
  return gameState.board[row][col];
}

function isEmptySquare(gameState, row, col) {
  return getPieceAt(gameState, row, col) === null;
}

function isOpponentPiece(gameState, row, col, currentPlayer) {
  const piece = getPieceAt(gameState, row, col);
  if (!piece) return false;
  return piece.player !== currentPlayer;
}

function placePiece(gameState, player, pieceType, row, col) {
  const playerData = getPlayerData(gameState, player);

  const piece = {
    type: pieceType,
    player: player,
    row: row,
    col: col
  };

  if (pieceType === 'pawn') {
    const posKey = `${row},${col}`;
    playerData.pawnDirections[posKey] = PAWN_DIRECTION[player.toUpperCase()];
  }

  const availableIndex = playerData.pieces.indexOf(pieceType);
  if (availableIndex !== -1) {
    playerData.pieces.splice(availableIndex, 1);
  } else {
    const capturedIndex = playerData.captured.indexOf(pieceType);
    if (capturedIndex !== -1) {
      playerData.captured.splice(capturedIndex, 1);
    }
  }

  gameState.board[row][col] = piece;
  playerData.onBoard.push(piece);

  return gameState;
}

function movePiece(gameState, fromRow, fromCol, toRow, toCol) {
  const piece = getPieceAt(gameState, fromRow, fromCol);
  if (!piece) return gameState;

  const currentPlayer = piece.player;
  const playerData = getPlayerData(gameState, currentPlayer);
  const opponent = getOpponent(currentPlayer);
  const opponentData = getPlayerData(gameState, opponent);

  const targetPiece = getPieceAt(gameState, toRow, toCol);
  if (targetPiece && targetPiece.player === opponent) {
    opponentData.onBoard = opponentData.onBoard.filter(p =>
      !(p.row === toRow && p.col === toCol)
    );
    opponentData.captured.push(targetPiece.type);

    if (targetPiece.type === 'pawn') {
      const posKey = `${toRow},${toCol}`;
      delete opponentData.pawnDirections[posKey];
    }
  }

  if (piece.type === 'pawn') {
    const oldPosKey = `${fromRow},${fromCol}`;
    const newPosKey = `${toRow},${toCol}`;
    const currentDirection = playerData.pawnDirections[oldPosKey];

    if (
      (currentDirection === 1 && toRow === BOARD_SIZE - 1) ||
      (currentDirection === -1 && toRow === 0)
    ) {
      playerData.pawnDirections[newPosKey] = -currentDirection;
    } else {
      playerData.pawnDirections[newPosKey] = currentDirection;
    }

    delete playerData.pawnDirections[oldPosKey];
  }

  gameState.board[fromRow][fromCol] = null;
  piece.row = toRow;
  piece.col = toCol;
  gameState.board[toRow][toCol] = piece;

  return gameState;
}

function switchPlayer(gameState) {
  gameState.currentPlayer = getOpponent(gameState.currentPlayer);

  if (gameState.currentPlayer === PLAYERS.PLAYER1) {
    gameState.round++;
  }

  if (gameState.round >= 4 && gameState.phase === GAME_PHASES.PLACEMENT) {
    gameState.phase = GAME_PHASES.STRATEGY;
  }

  return gameState;
}

function addMoveToHistory(gameState, action) {
  gameState.moveHistory.push({
    ...action,
    round: gameState.round,
    player: gameState.currentPlayer
  });
  return gameState;
}

function getPawnDirection(gameState, player, row, col) {
  const playerData = getPlayerData(gameState, player);
  const posKey = `${row},${col}`;
  return playerData.pawnDirections[posKey] || PAWN_DIRECTION[player.toUpperCase()];
}

// ============================================
// MOVE VALIDATOR
// ============================================
function isValidPlacement(gameState, player, pieceType, row, col) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return { valid: false, reason: 'Position out of bounds' };
  }

  if (!isEmptySquare(gameState, row, col)) {
    return { valid: false, reason: 'Square is occupied' };
  }

  const playerData = getPlayerData(gameState, player);
  const hasInAvailable = playerData.pieces.includes(pieceType);
  const hasInCaptured = playerData.captured.includes(pieceType);

  if (!hasInAvailable && !hasInCaptured) {
    return { valid: false, reason: 'Piece not available' };
  }

  if (gameState.phase === GAME_PHASES.PLACEMENT) {
    return { valid: true };
  }

  return { valid: true };
}

function isValidMove(gameState, player, fromRow, fromCol, toRow, toCol) {
  if (gameState.phase === GAME_PHASES.PLACEMENT) {
    return { valid: false, reason: 'Cannot move during placement phase' };
  }

  if (
    fromRow < 0 || fromRow >= BOARD_SIZE ||
    fromCol < 0 || fromCol >= BOARD_SIZE ||
    toRow < 0 || toRow >= BOARD_SIZE ||
    toCol < 0 || toCol >= BOARD_SIZE
  ) {
    return { valid: false, reason: 'Position out of bounds' };
  }

  const piece = getPieceAt(gameState, fromRow, fromCol);
  if (!piece) {
    return { valid: false, reason: 'No piece at source position' };
  }

  if (piece.player !== player) {
    return { valid: false, reason: 'Cannot move opponent\'s piece' };
  }

  const destPiece = getPieceAt(gameState, toRow, toCol);
  if (destPiece && destPiece.player === player) {
    return { valid: false, reason: 'Cannot capture own piece' };
  }

  return validatePieceMovement(gameState, piece.type, player, fromRow, fromCol, toRow, toCol);
}

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

function validatePawnMove(gameState, player, fromRow, fromCol, toRow, toCol) {
  const direction = getPawnDirection(gameState, player, fromRow, fromCol);
  const rowDiff = toRow - fromRow;
  const colDiff = Math.abs(toCol - fromCol);

  // Forward movement (1 square forward to empty square)
  if (rowDiff === direction && colDiff === 0) {
    if (isEmptySquare(gameState, toRow, toCol)) {
      return { valid: true };
    }
    return { valid: false, reason: 'Pawn cannot move to occupied square' };
  }

  // Diagonal capture (1 square diagonally to capture)
  if (rowDiff === direction && colDiff === 1) {
    if (isOpponentPiece(gameState, toRow, toCol, player)) {
      return { valid: true };
    }
    return { valid: false, reason: 'Pawn can only move diagonally to capture' };
  }

  // Horizontal movement (1 square left or right)
  if (rowDiff === 0 && colDiff === 1) {
    if (isEmptySquare(gameState, toRow, toCol)) {
      return { valid: true };
    }
    if (isOpponentPiece(gameState, toRow, toCol, player)) {
      return { valid: true };
    }
    return { valid: false, reason: 'Pawn cannot move horizontally to occupied square' };
  }

  return { valid: false, reason: 'Invalid pawn movement' };
}

function validateRookMove(gameState, fromRow, fromCol, toRow, toCol) {
  if (fromRow !== toRow && fromCol !== toCol) {
    return { valid: false, reason: 'Rook must move in straight line' };
  }

  if (!isPathClear(gameState, fromRow, fromCol, toRow, toCol)) {
    return { valid: false, reason: 'Path is blocked' };
  }

  return { valid: true };
}

function validateKnightMove(fromRow, fromCol, toRow, toCol) {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
    return { valid: true };
  }

  return { valid: false, reason: 'Invalid knight movement' };
}

function validateBishopMove(gameState, fromRow, fromCol, toRow, toCol) {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  if (rowDiff !== colDiff) {
    return { valid: false, reason: 'Bishop must move diagonally' };
  }

  if (!isPathClear(gameState, fromRow, fromCol, toRow, toCol)) {
    return { valid: false, reason: 'Path is blocked' };
  }

  return { valid: true };
}

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

// ============================================
// WIN DETECTOR
// ============================================
function checkWinner(gameState) {
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

function findWinningLine(gameState) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    const line = checkLine(gameState,
      Array.from({ length: BOARD_SIZE }, (_, i) => ({ row, col: i }))
    );
    if (line) return line;
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    const line = checkLine(gameState,
      Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col }))
    );
    if (line) return line;
  }

  const diag1 = checkLine(gameState,
    Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col: i }))
  );
  if (diag1) return diag1;

  const diag2 = checkLine(gameState,
    Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col: BOARD_SIZE - 1 - i }))
  );
  if (diag2) return diag2;

  return null;
}

function checkLine(gameState, positions) {
  if (positions.length < WIN_LENGTH) return null;

  const firstPiece = getPieceAt(gameState, positions[0].row, positions[0].col);
  if (!firstPiece) return null;

  const player = firstPiece.player;

  for (let i = 1; i < positions.length; i++) {
    const piece = getPieceAt(gameState, positions[i].row, positions[i].col);
    if (!piece || piece.player !== player) {
      return null;
    }
  }

  return positions;
}

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

  return gameState;
}

// ============================================
// GAME ENGINE
// ============================================
function createGame(player1Name = 'Player 1', player2Name = 'Player 2') {
  const gameState = createInitialGameState();
  gameState.player1Name = player1Name;
  gameState.player2Name = player2Name;
  return gameState;
}

function executeAction(gameState, action) {
  if (gameState.status !== GAME_STATUS.IN_PROGRESS) {
    return {
      success: false,
      gameState: gameState,
      error: 'Game is already over'
    };
  }

  const currentPlayer = gameState.currentPlayer;

  if (action.type === ACTION_TYPES.PLACE) {
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

    placePiece(gameState, currentPlayer, action.pieceType, action.row, action.col);

  } else if (action.type === ACTION_TYPES.MOVE) {
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

    movePiece(gameState, action.fromRow, action.fromCol, action.toRow, action.toCol);

  } else {
    return {
      success: false,
      gameState: gameState,
      error: 'Invalid action type'
    };
  }

  addMoveToHistory(gameState, action);
  updateGameStatus(gameState);

  if (gameState.status === GAME_STATUS.IN_PROGRESS) {
    switchPlayer(gameState);
  }

  return {
    success: true,
    gameState: gameState,
    error: null
  };
}

// ============================================
// AI ENGINE
// ============================================
function getAIMove(gameState, aiPlayer, difficulty = 'medium') {
  switch (difficulty) {
    case 'easy':
      return getEasyMove(gameState, aiPlayer);
    case 'medium':
      return getMediumMove(gameState, aiPlayer);
    case 'hard':
      return getHardMove(gameState, aiPlayer);
    default:
      return getMediumMove(gameState, aiPlayer);
  }
}

function getEasyMove(gameState, aiPlayer) {
  const allPossibleActions = getAllPossibleActions(gameState, aiPlayer);

  if (allPossibleActions.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * allPossibleActions.length);
  return allPossibleActions[randomIndex];
}

function getMediumMove(gameState, aiPlayer) {
  const opponent = getOpponent(aiPlayer);

  const winningMove = findWinningMove(gameState, aiPlayer);
  if (winningMove) {
    console.log('AI found winning move:', winningMove);
    return winningMove;
  }

  const blockingMove = findWinningMove(gameState, opponent);
  if (blockingMove) {
    console.log('AI blocking opponent win:', blockingMove);
    return blockingMove;
  }

  const captureMove = findCaptureMove(gameState, aiPlayer);
  if (captureMove) {
    console.log('AI capturing piece:', captureMove);
    return captureMove;
  }

  return getEasyMove(gameState, aiPlayer);
}

function getHardMove(gameState, aiPlayer) {
  return getMediumMove(gameState, aiPlayer);
}

function findWinningMove(gameState, player) {
  const allActions = getAllPossibleActions(gameState, player);
  console.log(`Finding winning move for ${player}, checking ${allActions.length} actions`);

  for (const action of allActions) {
    const newState = simulateAction(gameState, action, player);
    const winResult = checkWinner(newState);

    if (winResult.hasWinner && winResult.winner === player) {
      console.log(`FOUND WINNING MOVE for ${player}:`, action, 'Line:', winResult.winningLine);
      return action;
    }
  }

  console.log(`No winning move found for ${player}`);
  return null;
}

function findCaptureMove(gameState, player) {
  const playerData = getPlayerData(gameState, player);

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

function getAllPossibleActions(gameState, player) {
  const actions = [];
  const playerData = getPlayerData(gameState, player);

  const availablePieces = [...playerData.pieces, ...playerData.captured];
  console.log(`${player} available pieces:`, availablePieces);
  console.log(`${player} pieces on board:`, playerData.onBoard.length);

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

  console.log(`${player} total possible actions:`, actions.length);
  return actions;
}

function simulateAction(gameState, action, player) {
  const newState = JSON.parse(JSON.stringify(gameState));

  if (action.type === ACTION_TYPES.PLACE) {
    placePiece(newState, player, action.pieceType, action.row, action.col);
  } else if (action.type === ACTION_TYPES.MOVE) {
    movePiece(newState, action.fromRow, action.fromCol, action.toRow, action.toCol);
  }

  return newState;
}
