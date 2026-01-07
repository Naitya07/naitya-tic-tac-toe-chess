# Naitya Tic Tac Toe Chess - Deployment Guide

Deploy your game to the cloud so your girlfriend in Scotland and friends can play from anywhere!

## Option 1: Deploy to Render (Recommended - FREE!)

### Step 1: Push to GitHub

1. Open Terminal and navigate to your project:
   ```bash
   cd /Users/naityapatel/Desktop/naitya-tic-tac-toe-chess/web-demo
   ```

2. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   ```

3. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it: `naitya-tic-tac-toe-chess`
   - Make it Public
   - Don't add README, .gitignore, or license (we already have them)

4. Push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/naitya-tic-tac-toe-chess.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render

1. Go to https://render.com and sign up (free account)
   - You can sign up with your GitHub account

2. Click "New +" → "Web Service"

3. Connect your GitHub repository:
   - Find `naitya-tic-tac-toe-chess`
   - Click "Connect"

4. Configure your service:
   ```
   Name: naitya-tic-tac-toe-chess
   Region: Choose closest to you (e.g., Oregon for US West)
   Branch: main
   Root Directory: Leave blank
   Runtime: Node
   Build Command: Leave blank (or: npm install)
   Start Command: npm start
   ```

5. Select **Free** plan

6. Click "Create Web Service"

7. Wait 2-5 minutes for deployment...

8. Once done, you'll get a URL like:
   ```
   https://naitya-tic-tac-toe-chess.onrender.com
   ```

### Step 3: Share with Your Girlfriend!

Send her the URL! She can:
- Open it in Safari (iPhone) or Chrome (Android)
- Tap "Share" → "Add to Home Screen"
- Now it works like an app!

---

## Option 2: Deploy to Railway

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy on Railway

1. Go to https://railway.app and sign up with GitHub

2. Click "New Project" → "Deploy from GitHub repo"

3. Select `naitya-tic-tac-toe-chess`

4. Railway auto-detects Node.js and deploys!

5. Go to Settings → Generate Domain

6. You'll get a URL like:
   ```
   https://naitya-tic-tac-toe-chess-production.up.railway.app
   ```

---

## Option 3: Deploy to Fly.io

1. Install flyctl:
   ```bash
   brew install flyctl
   ```

2. Sign up:
   ```bash
   fly auth signup
   ```

3. Deploy:
   ```bash
   cd /Users/naityapatel/Desktop/naitya-tic-tac-toe-chess/web-demo
   fly launch
   ```

4. Follow prompts, then:
   ```bash
   fly deploy
   ```

---

## Testing Your Deployment

1. Visit your deployed URL
2. Click "Create Room"
3. Copy the room code
4. On another device (or browser), visit the same URL
5. Click "Join Room" and enter the code
6. Play together!

---

## Troubleshooting

### "Can't connect to room server"
- Make sure you deployed the whole `web-demo` folder
- Check that `simple-server.js` is running on the server

### "Room not found"
- Make sure both players are using the same URL
- Room codes are case-sensitive

### Free tier limitations
- **Render Free**: Server sleeps after 15 min of inactivity (takes 30s to wake up)
- **Railway Free**: $5/month credit (usually enough for casual use)
- **Fly.io Free**: 3 VMs free forever

---

## Need Help?

Check the deployment logs:
- **Render**: Click on your service → "Logs"
- **Railway**: Click on deployment → "View Logs"
- **Fly.io**: Run `fly logs`

---

## Next Steps

- Share the URL with friends
- Save it to your phone's home screen
- Enjoy playing from anywhere in the world!
