# Naitya Tic Tac Toe Chess 🎮♟️

> A strategic hybrid game combining Chess mechanics with Tic-Tac-Toe objectives.
> Production-ready foundation with complete game logic, AI, and multiplayer backend.

**Project Status: 60% Complete** | [View Full Status](PROJECT_STATUS.md) | [Quick Start Guide](QUICK_START.md)

## 🎯 Game Overview

**Objective**: Get 4 of your pieces in a row (horizontal, vertical, or diagonal) on a 4×4 board.

**Pieces**: Each player has 4 unique chess pieces:
- 1 Pawn
- 1 Rook
- 1 Knight
- 1 Bishop

## 🎮 How to Play

### Phase 1: Placement (Rounds 1-3)
- Players alternate placing pieces on any empty square
- No movement allowed yet

### Phase 2: Strategy (Round 4+)
On your turn, choose ONE action:
- **Place** your 4th piece (or a previously captured piece) on any empty square
- **Move** an existing piece using standard chess movement rules

### ♟️ Special Rules
- **Capturing**: Opponent's piece is removed but can be re-placed later
- **Pawns**: Reverse direction when reaching the opposite end (no promotion)
- **No Placement Captures**: You cannot place a piece directly onto an opponent's piece

## 🚀 Project Structure

```
naitya-tic-tac-toe-chess/
├── shared/          # Shared game logic (AI, validation, utilities)
├── backend/         # Node.js + Socket.IO server
├── mobile/          # React Native (iOS + Android)
├── web/             # React web version
├── assets/          # Images, sounds, chess pieces
└── docs/            # Setup and deployment guides
```

## 📱 Platforms

- **iOS** (App Store)
- **Android** (Google Play Store)
- **Web** (Browser-based)

## ✨ Features

- 🤖 AI Mode (Easy/Medium/Hard) - Play offline without login
- 🌍 Online Multiplayer - Real-time matches with Google/Apple sign-in
- 🔗 Invite Friends - Private room codes
- 🏆 Global Leaderboard - Track top players worldwide
- 🎨 Realistic 3D chess pieces
- ✨ Win animations with confetti
- 🔊 Sound effects (toggleable)
- 🌙 Dark mode
- 📜 Move history
- ℹ️ In-app game rules

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo), React.js
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB Atlas
- **Auth**: Google Sign-In, Apple Sign-In
- **Hosting**: Render.com (backend), Expo (mobile builds)

## 📖 Documentation

See the `/docs` folder for:
- Setup instructions
- Local development guide
- Deployment guide
- API documentation

---

Built with ❤️ for the love of chess and strategy games
