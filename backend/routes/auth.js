const express = require('express');
const router = express.Router();
const { customAlphabet } = require('nanoid');
const User = require('../models/User');

// Generate guest IDs
const generateGuestId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 16);

/**
 * Create Guest User
 * POST /api/auth/guest
 */
router.post('/guest', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const guestId = generateGuestId();

    const user = new User({
      guestId,
      username: username.trim(),
      isGuest: true
    });

    await user.save();

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        isGuest: true,
        stats: user.stats
      }
    });

  } catch (error) {
    console.error('Error creating guest user:', error);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

/**
 * Google Sign-In
 * POST /api/auth/google
 * Body: { googleId, email, username }
 */
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, username } = req.body;

    if (!googleId) {
      return res.status(400).json({ error: 'Google ID is required' });
    }

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      user = new User({
        googleId,
        email,
        username: username || email.split('@')[0],
        isGuest: false
      });
      await user.save();
    } else {
      // Update last active
      user.lastActive = new Date();
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isGuest: false,
        stats: user.stats,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Error with Google sign-in:', error);
    res.status(500).json({ error: 'Failed to sign in with Google' });
  }
});

/**
 * Apple Sign-In
 * POST /api/auth/apple
 * Body: { appleId, email, username }
 */
router.post('/apple', async (req, res) => {
  try {
    const { appleId, email, username } = req.body;

    if (!appleId) {
      return res.status(400).json({ error: 'Apple ID is required' });
    }

    // Find or create user
    let user = await User.findOne({ appleId });

    if (!user) {
      user = new User({
        appleId,
        email,
        username: username || `Player_${Date.now()}`,
        isGuest: false
      });
      await user.save();
    } else {
      // Update last active
      user.lastActive = new Date();
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isGuest: false,
        stats: user.stats,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Error with Apple sign-in:', error);
    res.status(500).json({ error: 'Failed to sign in with Apple' });
  }
});

/**
 * Get User Profile
 * GET /api/auth/profile/:userId
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        isGuest: user.isGuest,
        stats: user.stats,
        settings: user.settings,
        winRate: user.winRate
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Update User Settings
 * PUT /api/auth/settings/:userId
 */
router.put('/settings/:userId', async (req, res) => {
  try {
    const { soundEnabled, darkMode } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (soundEnabled !== undefined) {
      user.settings.soundEnabled = soundEnabled;
    }

    if (darkMode !== undefined) {
      user.settings.darkMode = darkMode;
    }

    await user.save();

    res.json({
      success: true,
      settings: user.settings
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
