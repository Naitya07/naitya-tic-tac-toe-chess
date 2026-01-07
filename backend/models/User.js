const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Guest users have a temporary ID
  guestId: {
    type: String,
    unique: true,
    sparse: true  // Allows null values
  },

  // Authenticated users
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  appleId: {
    type: String,
    unique: true,
    sparse: true
  },

  // User info
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    sparse: true
  },

  // Statistics
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    gamesDraw: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    maxWinStreak: { type: Number, default: 0 }
  },

  // Settings
  settings: {
    soundEnabled: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  },

  // Account type
  isGuest: {
    type: Boolean,
    default: true
  },

  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for leaderboard queries
userSchema.index({ 'stats.gamesWon': -1 });
userSchema.index({ lastActive: 1 });

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
  if (this.stats.gamesPlayed === 0) return 0;
  return (this.stats.gamesWon / this.stats.gamesPlayed * 100).toFixed(1);
});

module.exports = mongoose.model('User', userSchema);
