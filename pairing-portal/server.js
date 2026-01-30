const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs').promises;
const path = require('path');
const qrcode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let currentQR = null;
let sessionID = null;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/qr', async (req, res) => {
  if (!currentQR) return res.status(404).json({ error: 'No QR generated yet' });
  
  try {
    const qrData = await qrcode.toDataURL(currentQR);
    res.json({ qr: qrData, timestamp: Date.now() });
  } catch (e) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});
app.get('/api/session', async (req, res) => {
  try {
    const sessionId = await fs.readFile(path.join(__dirname, 'session.txt'), 'utf-8');
    if (!sessionId) return res.status(404).json({ error: 'Session not ready' });
    
   
    const envContent = `# KaaX Assistant Configuration\nSESSION_ID=${sessionId}\nOWNER=918075169545\nPAIRING_MODE=false`;
    res.json({ 
      session: sessionId,
      env: envContent,
      timestamp: Date.now()
    });
  } catch (e) {
    res.status(404).json({ error: 'Session not ready yet' });
  }
});
app.get('/download/env', async (req, res) => {
  try {
    const sessionId = await fs.readFile(path.join(__dirname, 'session.txt'), 'utf-8');
    const envContent = `# KaaX Assistant Configuration\nSESSION_ID=${sessionId}\nOWNER=918075169545\nPAIRING_MODE=false`;
    
    res.setHeader('Content-Disposition', 'attachment; filename=".env"');
    res.setHeader('Content-Type', 'text/plain');
    res.send(envContent);
  } catch (e) {
    res.status(404).send('Session not ready');
  }
});

io.on('connection', (socket) => {
  console.log('[PORTAL] Client connected');
 
  if (currentQR) {
    qrcode.toDataURL(currentQR).then(qrData => {
      socket.emit('qr_update', { qr: qrData });
    }).catch(() => {});
  }
  
  socket.on('disconnect', () => {
    console.log('[PORTAL] Client disconnected');
  });
});
function broadcastQR(qr) {
  currentQR = qr;
  qrcode.toDataURL(qr).then(qrData => {
    io.emit('qr_update', { qr: qrData, timestamp: Date.now() });
  }).catch(console.error);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✨ Pairing Portal running at http://localhost:${PORT}`);
  console.log(`🔐 Bot will deliver session ID here after pairing`);
});

module.exports = { broadcastQR };
