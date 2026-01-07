const mongoose = require('mongoose');

const gameRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  // Players
  player1: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    socketId: String,
    connected: { type: Boolean, default: true }
  },

  player2: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    socketId: String,
    connected: { type: Boolean, default: true }
  },

  // Game State (stored as JSON)
  gameState: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Room Status
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed', 'abandoned'],
    default: 'waiting'
  },

  // Winner info
  winner: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String
  },

  // Game mode
  gameMode: {
    type: String,
    enum: ['online', 'invite'],
    default: 'invite'
  },

  // Expiry (for cleanup)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
}, {
  timestamps: true
});

// Index for room code lookups
gameRoomSchema.index({ roomCode: 1 });
gameRoomSchema.index({ status: 1 });
gameRoomSchema.index({ expiresAt: 1 });

// Automatically delete expired rooms
gameRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('GameRoom', gameRoomSchema);
