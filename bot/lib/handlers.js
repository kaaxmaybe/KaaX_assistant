const fs = require('fs').promises;
const path = require('path');
function setupPresence(sock, settings) {
  // Auto-recording when messages arrive
  if (settings.AUTO_RECORDING) {
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;
      const msg = m.messages[0];
      if (!msg.key.fromMe && msg.key.remoteJid !== 'status@broadcast') {
        try {
          await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
          if (settings.AUTO_TYPING) {
            setTimeout(() => {
              sock.sendPresenceUpdate('composing', msg.key.remoteJid).catch(() => {});
            }, 800);
          }
        } catch (e) { /* Silent fail */ }
      }
    });
  }

  
  if (settings.AUTO_VIEW_STATUS || settings.AUTO_LIKE_STATUS) {
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;
      for (const msg of m.messages) {
        if (msg.key.remoteJid === 'status@broadcast') {
          if (settings.AUTO_VIEW_STATUS) {
            await sock.readMessages([msg.key]).catch(() => {});
          }
          if (settings.AUTO_LIKE_STATUS) {
            setTimeout(async () => {
              await sock.sendMessage('status@broadcast', {
                react: { text: '🤍', key: msg.key }
              }).catch(() => {});
            }, 1500 + Math.random() * 2000); 
          }
        }
      }
    });
  }
}

async function handleAntiDelete(sock, update, settings) {
  try {
    if (update.type === 'message' && update.messageStubType === 72) { // 72 = message deleted
      const key = update.key;      const chatJid = key.remoteJid;
      
      // Fetch deleted message from store
      const msg = await sock.loadMessage(chatJid, key.id);
      if (!msg || !msg.message) return;
      
      
      let content = '[Unsupported content]';
      if (msg.message.conversation) content = msg.message.conversation;
      else if (msg.message.extendedTextMessage?.text) content = msg.message.extendedTextMessage.text;
      else if (msg.message.imageMessage) content = '[Image]';
      else if (msg.message.videoMessage) content = '[Video]';
      else if (msg.message.audioMessage) content = '[Audio]';
      const report = `🗑️ *DELETED MESSAGE*\n` +
        `📍 Chat: ${chatJid.includes('@g.us') ? 'Group' : 'Private'}\n` +
        `👤 Sender: ${key.participant || key.remoteJid}\n` +
        `🕒 Time: ${new Date().toLocaleTimeString()}\n\n` +
        `💬 Content:\n${content}`;
      await sock.sendMessage(settings.OWNER_JID, { text: report });
      
     
      if (chatJid.includes('@g.us')) {
        try {
          const metadata = await sock.groupMetadata(chatJid);
          if (metadata.participants.find(p => p.id === settings.OWNER_JID)?.admin) {
            await sock.sendMessage(chatJid, { 
              text: `⚠️ *Message deleted by @${key.participant.split('@')[0]}*`,
              mentions: [key.participant]
            });
          }
        } catch (e) { /* Silent fail */ }
      }
    }
  } catch (e) { console.error('[ANTI-DELETE]', e); }
}
function setupAntiEdit(sock, settings) {
  const originalMessages = new Map(); // Store original messages
  
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    const msg = m.messages[0];
    const key = msg.key;
    
    // Check for edited messages    if (msg.message?.editedMessage) {
      const original = originalMessages.get(key.id) || 'Original not cached';
      const edited = msg.message.editedMessage.conversation || 
                     msg.message.editedMessage.extendedTextMessage?.text || 
                     '[Edited content]';
      
      const report = `✏️ *EDITED MESSAGE DETECTED*\n` +
        `📍 Chat: ${key.remoteJid}\n` +
        `👤 Sender: ${key.participant || key.remoteJid}\n\n` +
        `🔍 *Original:*\n${original}\n\n` +
        `✏️ *Edited to:*\n${edited}`;
      
      await sock.sendMessage(settings.OWNER_JID, { text: report });
      originalMessages.delete(key.id); // Clean cache
      return;
    }
    
    // Cache original message
    const text = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || '';
    if (text && !key.fromMe) {
      originalMessages.set(key.id, text);
      // Auto-clean after 1 hour
      setTimeout(() => originalMessages.delete(key.id), 3600000);
    }
  });
}
async function handleAntiViewOnce(sock, msg, settings) {
  try {
    const messageType = Object.keys(msg.message || {})[0] || '';
    if (!messageType.includes('viewOnce')) return;
    const buffer = await sock.downloadMediaMessage(msg);
    if (!buffer) return;
    let mediaType, ext;
    if (messageType.includes('Image')) {
      mediaType = 'image';
      ext = '.jpg';
    } else if (messageType.includes('Video')) {
      mediaType = 'video';
      ext = '.mp4';
    } else if (messageType.includes('Audio')) {
      mediaType = 'audio';
      ext = '.mp3';
    } else return;    
    
    const filePath = path.join(__dirname, '..', 'temp', `${Date.now()}${ext}`);
    await fs.writeFile(filePath, buffer);
    
    
    await sock.sendMessage(settings.OWNER_JID, {
      [mediaType]: { url: filePath },
      caption: `👁️ *ANTI-VIEWONCE*\n\nOriginal sender hidden\nChat: ${msg.key.remoteJid}`
    });
    
   
    setTimeout(() => fs.unlink(filePath).catch(() => {}), 10000);
  } catch (e) { console.error('[ANTI-VIEWONCE]', e); }
}

module.exports = { 
  setupPresence, 
  handleAntiDelete, 
  setupAntiEdit, 
  handleAntiViewOnce 
};
