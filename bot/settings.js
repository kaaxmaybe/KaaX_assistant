const os = require('os');
const BOT_NAME = 'KaaX Assistant';
const CREATOR = '𝐊aaXHunter'; 
const OWNER_NUMBER = '918075169545'; 
const OWNER_JID = `${OWNER_NUMBER}@s.whatsapp.net`;
module.exports = {
  BOT_NAME,
  CREATOR,
  OWNER_NUMBER,
  OWNER_JID,
  PREFIX: '.',
  MODE: 'self', // 'public' or 'self'
  AUTO_RECORDING: true,
  AUTO_TYPING: true,
  AUTO_VIEW_STATUS: true,
  AUTO_LIKE_STATUS: true,
  
  // Security (Base64 SESSION_ID support)
  SESSION_ID: process.env.SESSION_ID 
    ? Buffer.from(process.env.SESSION_ID, 'base64').toString('utf-8') 
    : null,
  LOGO_PATH: './assets/logo.jpg',
  SESSION_PATH: './sessions',
  getSystemInfo() {
    const totalMem = os.totalmem() / (1024 ** 3);
    const freeMem = os.freemem() / (1024 ** 3);
    return {
      platform: os.platform().replace('darwin', 'macOS').replace('win32', 'Windows'),
      arch: os.arch().replace('x64', 'x64').replace('arm64', 'ARM64'),
      ramUsage: `${(totalMem - freeMem).toFixed(2)} GB/${totalMem.toFixed(2)} GB`,
      freeRam: `${freeMem.toFixed(2)} GB`,
      cpuCores: os.cpus().length,
      nodeVersion: process.version,
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: new Date().toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Kolkata', 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' IST'
    };
  },
  START_TIME: Date.now()
};
