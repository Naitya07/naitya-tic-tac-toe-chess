// Simple room server for cross-device multiplayer (no database needed)
const http = require('http');
const fs = require('fs');
const path = require('path');

// In-memory storage for game rooms
const gameRooms = {};

const PORT = process.env.PORT || 3001; // Use environment variable or default to 3001

const server = http.createServer((req, res) => {
    // CORS headers to allow requests from web page
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API: Create room
    if (req.url.startsWith('/api/rooms/create') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const roomCode = data.code;

            gameRooms[roomCode] = {
                code: roomCode,
                host: data.host,
                hostId: data.guestId,
                createdAt: new Date().toISOString(),
                players: [data.host],
                guest: null,
                guestId: null,
                gameState: null,
                moves: [],
                lastMoveTime: null
            };

            console.log('✅ Room created:', roomCode, 'by', data.host);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, room: gameRooms[roomCode] }));
        });
        return;
    }

    // API: Join room
    if (req.url.startsWith('/api/rooms/join') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const roomCode = data.code;

            if (gameRooms[roomCode]) {
                if (!gameRooms[roomCode].players.includes(data.username)) {
                    gameRooms[roomCode].players.push(data.username);
                    gameRooms[roomCode].guest = data.username;
                    gameRooms[roomCode].guestId = data.guestId;
                }

                console.log('✅ Player joined:', data.username, 'in room', roomCode);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, room: gameRooms[roomCode] }));
            } else {
                console.log('❌ Room not found:', roomCode);
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Room not found' }));
            }
        });
        return;
    }

    // API: Submit move
    if (req.url.startsWith('/api/rooms/move') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const roomCode = data.roomCode;

            if (gameRooms[roomCode]) {
                const move = {
                    player: data.player,
                    action: data.action,
                    timestamp: new Date().toISOString()
                };

                gameRooms[roomCode].moves.push(move);
                gameRooms[roomCode].lastMoveTime = move.timestamp;

                console.log('🎮 Move submitted in room', roomCode, 'by', data.player);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, moveIndex: gameRooms[roomCode].moves.length - 1 }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Room not found' }));
            }
        });
        return;
    }

    // API: Get moves since index
    if (req.url.startsWith('/api/rooms/moves/')) {
        const parts = req.url.split('/');
        const roomCode = parts[4];
        const sinceIndex = parseInt(parts[5] || '0');

        if (gameRooms[roomCode]) {
            const newMoves = gameRooms[roomCode].moves.slice(sinceIndex);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                moves: newMoves,
                currentIndex: gameRooms[roomCode].moves.length
            }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Room not found' }));
        }
        return;
    }

    // API: Check room exists
    if (req.url.startsWith('/api/rooms/check/')) {
        const roomCode = req.url.split('/api/rooms/check/')[1];

        if (gameRooms[roomCode]) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, exists: true, room: gameRooms[roomCode] }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, exists: false }));
        }
        return;
    }

    // API: Get all rooms (for debugging)
    if (req.url === '/api/rooms' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ rooms: gameRooms }));
        return;
    }

    // Serve static files (HTML, CSS, JS)
    // Parse URL to remove query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    let filePath = '.' + url.pathname;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('🎮 Naitya Tic Tac Toe Chess - Server Running!');
    console.log(`📡 Server: http://localhost:${PORT}`);
    if (process.env.RENDER_EXTERNAL_URL) {
        console.log(`🌐 Public URL: ${process.env.RENDER_EXTERNAL_URL}`);
    }
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  / - Game homepage');
    console.log('  GET  /game.html - Game board');
    console.log('  POST /api/rooms/create - Create a new room');
    console.log('  POST /api/rooms/join - Join an existing room');
    console.log('  GET  /api/rooms/check/:code - Check if room exists');
    console.log('  GET  /api/rooms - List all rooms (debug)');
    console.log('');
    console.log('Rooms stored in memory (no database)');
});
