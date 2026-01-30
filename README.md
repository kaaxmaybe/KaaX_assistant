# 🌑 KaaX Assistant • WhatsApp Bot + Pairing Portal

> "The shadows whisper secrets only the worthy can hear" — 𝐊aaXHunter

## ✨ FEATURES
- **Zero API Dependencies**: Pure open-source AI (Pollinations, Blackbox)
- **Military Security**: Anti-delete/edit/viewonce + auto-recording presence
- **Instant Menu**: `.menu` responds in <100ms with logo caption
- **Smart AI Engine**: Rotates between 3 endpoints to minimize latency
- **Gothic Pairing Portal**: Animated QR delivery with session export
- **Termux Optimized**: Runs flawlessly on Android

## 📱 TERMUX INSTALLATION
```bash
# Setup environment
pkg update && pkg upgrade -y
pkg install nodejs git ffmpeg python -y
npm install -g npm@latest

# Clone repository
git clone https://github.com/KaaXHunter/KaaX-Assistant
cd KaaX-Assistant

# Install dependencies
npm install
cd pairing-portal && npm install && cd ..

# Create assets directory
mkdir -p bot/assets
# ➤ PLACE logo.jpg IN bot/assets/ (REQUIRED)

# Start pairing portal FIRST TIME ONLY
export PAIRING_MODE=true
node pairing-portal/server.js &
node bot/index.js
```

## 🌐 PAIRING PORTAL USAGE
1. Start portal: `node pairing-portal/server.js`
2. Open `http://localhost:3000` in browser
3. Scan QR with WhatsApp (Settings > Linked Devices)
4. After pairing, bot sends session ID to your DM
5. Portal auto-updates with download button
6. Download `.env` file and place in root directory
7. Restart bot WITHOUT `PAIRING_MODE`

## ⚙️ NORMAL OPERATION
```bash
# Create .env file with your session ID
echo "SESSION_ID=YOUR_BASE64_SESSION_ID" > .env
echo "OWNER=918075169545" >> .env

# Start bot
node bot/index.js
```

## 🎮 COMMAND HIGHLIGHTS
| Command | Description |
|---------|-------------|
| `.menu` | Instant dark-themed menu with system stats |
| `.play [song]` | Download music → Reply 1=Audio, 2=File, 3=Voice |
| `.ai [prompt]` | Open-source AI (no API key needed) |
| `.imagine [prompt]` | Generate images via Pollinations |
| `.antid` | Toggle anti-delete protection |
| `.public` / `.self` | Toggle bot accessibility |

## 🔒 SECURITY NOTES
- Session ID is **BASE64-encoded** and delivered ONLY to your DM
- Portal runs locally (never exposed to internet by default)
- All anti-forensics features work silently in background
- Zero data leaves your device without explicit command

## 🌌 AESTHETIC CREDITS
- Particle background: `particles.js`
- Glitch animations: Custom CSS keyframes
- Color scheme: Deep space purple (#6c00ff) with neon accents
- Typography: Montserrat (headers) + Inconsolata (code)

---
💀 Crafted in the shadows by **𝐊aaXHunter**  
⚠️ For educational purposes only. Respect privacy and WhatsApp ToS.
