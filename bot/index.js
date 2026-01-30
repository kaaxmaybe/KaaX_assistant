
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const settings = require('./settings');
const { 
  setupPresence, 
  handleAntiDelete, 
  setupAntiEdit, 
  handleAntiViewOnce 
} = require('./lib/handlers');
const { processCommand } = require('./lib/commands');
const { generateMenu } = require('./lib/utils');
const store = makeInMemoryStore({});
store.readFromFile(path.join(__dirname, 'store.json'));
setInterval(() => store.writeToFile(path.join(__dirname, 'store.json')), 60000);
(async () => {
  await fs.mkdir(path.join(__dirname, 'temp'), { recursive: true }).catch(() => {});
  await fs.mkdir(settings.SESSION_PATH, { recursive: true }).catch(() => {});
})();
async function connectBot() {
  try {
    const { state, saveCreds } = settings.SESSION_ID
      ? { 
          state: { creds: JSON.parse(settings.SESSION_ID), keys: {}} , 
          saveCreds: () => {} 
        }
      : await useMultiFileAuthState(settings.SESSION_PATH);

    const { version } = await fetchLatestBaileysVersion();
        // Create socket
    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state,
      browser: ['KaaX Assistant', 'Chrome', '3.0.0'],
      version,
      markOnlineOnConnect: false,
      getMessage: async (key) => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid, key.id);
          return msg?.message || { conversation: '' };
        }
        return { conversation: '' };
      }
    });
    store.bind(sock.ev);
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      

      if (qr && process.env.PAIRING_MODE === 'true') {
        require('../pairing-portal/server').broadcastQR(qr);
      }
      
      if (connection === 'close') {
        const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`[!] Connection closed. Reconnecting: ${shouldReconnect}`);
        if (shouldReconnect) setTimeout(connectBot, 3000);
      } else if (connection === 'open') {
        console.log(`✅ ${settings.BOT_NAME} is ONLINE!`);
        console.log(`👤 Owner: ${settings.CREATOR} (${settings.OWNER_NUMBER})`);
        if (process.env.PAIRING_MODE === 'true') {
          const sessionData = JSON.stringify(sock.authState.creds);
          const sessionId = Buffer.from(sessionData).toString('base64');
          
         
          await fs.writeFile(
            path.join(__dirname, '..', 'pairing-portal', 'session.txt'), 
            sessionId
          ).catch(() => {});
          
          // Send to owner DM
          await sock.sendMessage(settings.OWNER_JID, {            text: `🔐 *SESSION ID GENERATED*\n\n` +
              `✅ Pairing successful! Here's your session ID:\n\n\`${sessionId}\`\n\n` +
              `📌 *NEXT STEPS:*\n` +
              `1. Go to the pairing portal\n` +
              `2. Download your .env file\n` +
              `3. Replace SESSION_ID value\n` +
              `4. Restart bot in normal mode\n\n` +
              `⚠️ *KEEP THIS PRIVATE!* Never share this ID.`
          });
          
         
          setTimeout(() => {
            console.log('[PAIRING] Session delivered. Shutting down pairing mode...');
            process.exit(0);
          }, 5000);
        }
      }
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);

    // ====== SECURITY HANDLERS ======
    setupPresence(sock, settings);
    setupAntiEdit(sock, settings);
    
    sock.ev.on('messages.update', (updates) => {
      updates.forEach(update => handleAntiDelete(sock, update, settings));
    });

    // ====== MESSAGE HANDLER ======
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;
      
      // Anti-viewonce
      handleAntiViewOnce(sock, msg, settings);
      
      // Extract message body
      const body = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || 
                   '';
      const sender = jidNormalizedUser(msg.key.remoteJid);
      const isOwner = sender === settings.OWNER_JID;
      const isGroup = sender.endsWith('@g.us');
      
      // Mode check
      if (!isOwner && settings.MODE === 'self' && !isGroup) return;
            // Instant menu response (NO DELAY)
      if (body === `${settings.PREFIX}menu`) {
        try {
          const logoBuffer = await fs.readFile(settings.LOGO_PATH);
          await sock.sendMessage(sender, {
            image: logoBuffer,
            caption: generateMenu(settings)
          });
          return;
        } catch (e) {
          await sock.sendMessage(sender, { 
            text: '⚠️ Logo not found! Using text menu...\n\n' + generateMenu(settings) 
          });
        }
      }
      
      // Process other commands
      if (body.startsWith(settings.PREFIX)) {
        await processCommand(sock, msg, settings);
      }
    });

    // ====== ERROR BUBBLE CATCHER ======
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[CRITICAL] Unhandled Rejection:', reason);
      // Bot continues running
    });
    
    process.on('uncaughtException', (err) => {
      console.error('[CRITICAL] Uncaught Exception:', err);
      // Bot continues running
    });

  } catch (error) {
    console.error('[BOOT ERROR]', error);
    // Auto-restart on critical failure
    setTimeout(connectBot, 5000);
  }
}

// Start bot
connectBot().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
