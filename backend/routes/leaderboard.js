const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * Get Global Leaderboard
 * GET /api/leaderboard
 * Query params: limit (default: 100)
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    const leaderboard = await User.find({ isGuest: false })
      .sort({ 'stats.gamesWon': -1, 'stats.gamesPlayed': -1 })
      .limit(limit)
      .select('username stats');

    const formattedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      wins: user.stats.gamesWon,
      gamesPlayed: user.stats.gamesPlayed,
      winRate: user.stats.gamesPlayed > 0
        ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
        : 0,
      winStreak: user.stats.winStreak,
      maxWinStreak: user.stats.maxWinStreak
    }));

    res.json({
      success: true,
      leaderboard: formattedLeaderboard
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * Get User Rank
 * GET /api/leaderboard/rank/:userId
 */
router.get('/rank/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count users with more wins
    const rank = await User.countDocuments({
      isGuest: false,
      'stats.gamesWon': { $gt: user.stats.gamesWon }
    }) + 1;

    res.json({
      success: true,
      rank,
      stats: user.stats
    });

  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ error: 'Failed to fetch user rank' });
  }
});

/**
 * Get Top Players (Top 10)
 * GET /api/leaderboard/top
 */
router.get('/top', async (req, res) => {
  try {
    const topPlayers = await User.find({ isGuest: false })
      .sort({ 'stats.gamesWon': -1 })
      .limit(10)
      .select('username stats');

    const formattedPlayers = topPlayers.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      wins: user.stats.gamesWon,
      gamesPlayed: user.stats.gamesPlayed,
      winRate: user.stats.gamesPlayed > 0
        ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
        : 0
    }));

    res.json({
      success: true,
      topPlayers: formattedPlayers
    });

  } catch (error) {
    console.error('Error fetching top players:', error);
    res.status(500).json({ error: 'Failed to fetch top players' });
  }
});

module.exports = router;
