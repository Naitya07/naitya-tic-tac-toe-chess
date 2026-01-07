const { customAlphabet } = require('nanoid');
const GameRoom = require('../models/GameRoom');
const User = require('../models/User');

// Import shared game logic
const gameLogic = require('../../shared');

// Generate room codes (6 characters, uppercase)
const generateRoomCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

module.exports = (io) => {
  // Store active games in memory for quick access
  const activeGames = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // CREATE ROOM
    socket.on('create_room', async (data, callback) => {
      try {
        const { userId, username } = data;

        // Generate unique room code
        let roomCode;
        let roomExists = true;

        while (roomExists) {
          roomCode = generateRoomCode();
          roomExists = await GameRoom.findOne({ roomCode });
        }

        // Create initial game state
        const gameState = gameLogic.createGame(username, 'Waiting for opponent...');

        // Create room in database
        const room = new GameRoom({
          roomCode,
          player1: {
            userId,
            username,
            socketId: socket.id,
            connected: true
          },
          gameState,
          status: 'waiting',
          gameMode: 'invite'
        });

        await room.save();

        // Store in memory
        activeGames.set(roomCode, {
          gameState,
          player1: socket.id,
          player2: null
        });

        // Join socket room
        socket.join(roomCode);

        callback({ success: true, roomCode, gameState });
        console.log(`🎮 Room created: ${roomCode} by ${username}`);

      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // JOIN ROOM
    socket.on('join_room', async (data, callback) => {
      try {
        const { roomCode, userId, username } = data;

        // Find room
        const room = await GameRoom.findOne({ roomCode, status: 'waiting' });

        if (!room) {
          return callback({ success: false, error: 'Room not found or already started' });
        }

        // Add player 2
        room.player2 = {
          userId,
          username,
          socketId: socket.id,
          connected: true
        };

        room.gameState.player2Name = username;
        room.status = 'in_progress';

        await room.save();

        // Update memory
        const gameData = activeGames.get(roomCode);
        if (gameData) {
          gameData.player2 = socket.id;
          gameData.gameState.player2Name = username;
        }

        // Join socket room
        socket.join(roomCode);

        // Notify both players
        io.to(roomCode).emit('game_start', {
          gameState: room.gameState,
          player1: room.player1.username,
          player2: room.player2.username
        });

        callback({ success: true, gameState: room.gameState });
        console.log(`🎮 ${username} joined room: ${roomCode}`);

      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // MAKE MOVE
    socket.on('make_move', async (data, callback) => {
      try {
        const { roomCode, action } = data;

        // Get game from memory or database
        let gameData = activeGames.get(roomCode);

        if (!gameData) {
          const room = await GameRoom.findOne({ roomCode });
          if (!room) {
            return callback({ success: false, error: 'Room not found' });
          }
          gameData = {
            gameState: room.gameState,
            player1: room.player1.socketId,
            player2: room.player2.socketId
          };
          activeGames.set(roomCode, gameData);
        }

        // Execute action using game engine
        const result = gameLogic.executeAction(gameData.gameState, action);

        if (!result.success) {
          return callback({ success: false, error: result.error });
        }

        // Update database
        await GameRoom.findOneAndUpdate(
          { roomCode },
          { gameState: result.gameState }
        );

        // Broadcast move to all players in room
        io.to(roomCode).emit('move_made', {
          gameState: result.gameState,
          action
        });

        // Check if game ended
        if (result.gameState.status !== gameLogic.GAME_STATUS.IN_PROGRESS) {
          await handleGameEnd(roomCode, result.gameState);
        }

        callback({ success: true, gameState: result.gameState });

      } catch (error) {
        console.error('Error making move:', error);
        callback({ success: false, error: error.message });
      }
    });

    // RESTART GAME
    socket.on('restart_game', async (data, callback) => {
      try {
        const { roomCode } = data;

        const room = await GameRoom.findOne({ roomCode });
        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        // Create new game state
        const newGameState = gameLogic.createGame(
          room.player1.username,
          room.player2.username
        );

        room.gameState = newGameState;
        room.status = 'in_progress';
        room.winner = undefined;

        await room.save();

        // Update memory
        const gameData = activeGames.get(roomCode);
        if (gameData) {
          gameData.gameState = newGameState;
        }

        // Notify both players
        io.to(roomCode).emit('game_restarted', { gameState: newGameState });

        callback({ success: true, gameState: newGameState });

      } catch (error) {
        console.error('Error restarting game:', error);
        callback({ success: false, error: error.message });
      }
    });

    // PLAYER DISCONNECTION
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.id}`);

      try {
        // Find room where this socket was a player
        const room = await GameRoom.findOne({
          $or: [
            { 'player1.socketId': socket.id },
            { 'player2.socketId': socket.id }
          ],
          status: 'in_progress'
        });

        if (room) {
          // Mark player as disconnected
          if (room.player1.socketId === socket.id) {
            room.player1.connected = false;
          } else if (room.player2.socketId === socket.id) {
            room.player2.connected = false;
          }

          await room.save();

          // Notify other player
          io.to(room.roomCode).emit('player_disconnected', {
            message: 'Opponent disconnected'
          });

          // Clean up after 5 minutes of disconnection
          setTimeout(async () => {
            const updatedRoom = await GameRoom.findById(room._id);
            if (updatedRoom && updatedRoom.status === 'in_progress') {
              const bothDisconnected = !updatedRoom.player1.connected &&
                                      !updatedRoom.player2.connected;

              if (bothDisconnected) {
                updatedRoom.status = 'abandoned';
                await updatedRoom.save();
                activeGames.delete(updatedRoom.roomCode);
              }
            }
          }, 5 * 60 * 1000);
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Handle game end
    async function handleGameEnd(roomCode, gameState) {
      try {
        const room = await GameRoom.findOne({ roomCode });
        if (!room) return;

        room.status = 'completed';

        // Determine winner
        if (gameState.status === gameLogic.GAME_STATUS.PLAYER1_WON) {
          room.winner = {
            userId: room.player1.userId,
            username: room.player1.username
          };

          // Update user stats
          await updateUserStats(room.player1.userId, 'win');
          await updateUserStats(room.player2.userId, 'loss');

        } else if (gameState.status === gameLogic.GAME_STATUS.PLAYER2_WON) {
          room.winner = {
            userId: room.player2.userId,
            username: room.player2.username
          };

          await updateUserStats(room.player2.userId, 'win');
          await updateUserStats(room.player1.userId, 'loss');

        } else if (gameState.status === gameLogic.GAME_STATUS.DRAW) {
          await updateUserStats(room.player1.userId, 'draw');
          await updateUserStats(room.player2.userId, 'draw');
        }

        await room.save();

        // Notify players
        io.to(roomCode).emit('game_ended', {
          gameState,
          winner: room.winner
        });

      } catch (error) {
        console.error('Error handling game end:', error);
      }
    }

    // Update user statistics
    async function updateUserStats(userId, result) {
      if (!userId) return;

      try {
        const user = await User.findById(userId);
        if (!user) return;

        user.stats.gamesPlayed++;

        if (result === 'win') {
          user.stats.gamesWon++;
          user.stats.winStreak++;
          if (user.stats.winStreak > user.stats.maxWinStreak) {
            user.stats.maxWinStreak = user.stats.winStreak;
          }
        } else if (result === 'loss') {
          user.stats.gamesLost++;
          user.stats.winStreak = 0;
        } else if (result === 'draw') {
          user.stats.gamesDraw++;
        }

        user.lastActive = new Date();
        await user.save();

      } catch (error) {
        console.error('Error updating user stats:', error);
      }
    }
  });
};
