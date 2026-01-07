const express = require('express');
const router = express.Router();
const GameRoom = require('../models/GameRoom');

/**
 * Get Room Info
 * GET /api/rooms/:roomCode
 */
router.get('/:roomCode', async (req, res) => {
  try {
    const room = await GameRoom.findOne({ roomCode: req.params.roomCode.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      success: true,
      room: {
        roomCode: room.roomCode,
        status: room.status,
        player1: room.player1.username,
        player2: room.player2 ? room.player2.username : null,
        gameState: room.gameState,
        createdAt: room.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

/**
 * Check if Room Code Exists
 * GET /api/rooms/check/:roomCode
 */
router.get('/check/:roomCode', async (req, res) => {
  try {
    const room = await GameRoom.findOne({
      roomCode: req.params.roomCode.toUpperCase(),
      status: 'waiting'
    });

    res.json({
      success: true,
      exists: !!room,
      available: !!room
    });

  } catch (error) {
    console.error('Error checking room:', error);
    res.status(500).json({ error: 'Failed to check room' });
  }
});

module.exports = router;
