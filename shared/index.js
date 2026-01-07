/**
 * Shared Game Logic Module
 * Exports all game-related functions for use in frontend and backend
 */

const constants = require('./constants');
const gameState = require('./gameState');
const gameEngine = require('./gameEngine');
const moveValidator = require('./moveValidator');
const winDetector = require('./winDetector');
const aiEngine = require('./aiEngine');

module.exports = {
  // Constants
  ...constants,

  // Game State Management
  createInitialGameState: gameState.createInitialGameState,
  getPlayerData: gameState.getPlayerData,
  getOpponent: gameState.getOpponent,
  getPieceAt: gameState.getPieceAt,
  isEmptySquare: gameState.isEmptySquare,
  isOpponentPiece: gameState.isOpponentPiece,
  placePiece: gameState.placePiece,
  movePiece: gameState.movePiece,
  switchPlayer: gameState.switchPlayer,
  addMoveToHistory: gameState.addMoveToHistory,
  getPawnDirection: gameState.getPawnDirection,

  // Game Engine
  createGame: gameEngine.createGame,
  executeAction: gameEngine.executeAction,
  getGameSummary: gameEngine.getGameSummary,
  restartGame: gameEngine.restartGame,

  // Move Validation
  isValidPlacement: moveValidator.isValidPlacement,
  isValidMove: moveValidator.isValidMove,
  validatePieceMovement: moveValidator.validatePieceMovement,
  getValidMovesForPiece: moveValidator.getValidMovesForPiece,
  getValidPlacements: moveValidator.getValidPlacements,

  // Win Detection
  checkWinner: winDetector.checkWinner,
  checkDraw: winDetector.checkDraw,
  updateGameStatus: winDetector.updateGameStatus,
  findWinningLine: winDetector.findWinningLine,

  // AI Engine
  getAIMove: aiEngine.getAIMove,
  getAllPossibleActions: aiEngine.getAllPossibleActions,
  simulateAction: aiEngine.simulateAction
};
