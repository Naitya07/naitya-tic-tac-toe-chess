// Game Constants

// Board Configuration
const BOARD_SIZE = 4;
const WIN_LENGTH = 4;

// Piece Types
const PIECE_TYPES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop'
};

// Players
const PLAYERS = {
  PLAYER1: 'player1',
  PLAYER2: 'player2'
};

// Game Phases
const GAME_PHASES = {
  PLACEMENT: 'placement',  // Rounds 1-3: Only placement allowed
  STRATEGY: 'strategy'     // Round 4+: Can place OR move
};

// Game Status
const GAME_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  PLAYER1_WON: 'player1_won',
  PLAYER2_WON: 'player2_won',
  DRAW: 'draw'
};

// Action Types
const ACTION_TYPES = {
  PLACE: 'place',
  MOVE: 'move'
};

// AI Difficulty
const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Pawn Directions (1 = down, -1 = up)
const PAWN_DIRECTION = {
  PLAYER1: 1,  // Moves down (0 -> 3)
  PLAYER2: -1  // Moves up (3 -> 0)
};

// Initial Piece Set for each player
const INITIAL_PIECES = [
  PIECE_TYPES.PAWN,
  PIECE_TYPES.ROOK,
  PIECE_TYPES.KNIGHT,
  PIECE_TYPES.BISHOP
];

module.exports = {
  BOARD_SIZE,
  WIN_LENGTH,
  PIECE_TYPES,
  PLAYERS,
  GAME_PHASES,
  GAME_STATUS,
  ACTION_TYPES,
  AI_DIFFICULTY,
  PAWN_DIRECTION,
  INITIAL_PIECES
};
