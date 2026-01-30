const axios = require('axios');
const { promisify } = require('util');
const setTimeoutPromise = promisify(setTimeout);
const AI_ENDPOINTS = [
  { 
    name: 'Pollinations (Text)', 
    url: (prompt) => `https://api.pollinations.ai/text?prompt=${encodeURIComponent(prompt)}`,
    parser: res => res.data?.response || res.data?.result || res.data
  },
  { 
    name: 'Blackbox AI', 
    url: (prompt) => `https://api.sujalgoel.engineer/api/ai/blackbox?prompt=${encodeURIComponent(prompt)}`,
    parser: res => res.data?.response || res.data?.result
  },
  { 
    name: 'Free GPT', 
    url: (prompt) => `https://freegpt4.owen.cool/?prompt=${encodeURIComponent(prompt)}`,
    parser: res => res.data?.response || res.data?.result
  }
];
async function generateImage(prompt, style = 'anime') {
  const stylesMap = {
    anime: 'anime+vibrant+sharp+details',
    realistic: 'photorealistic+4k+ultra+hd',
    cyberpunk: 'cyberpunk+neon+glow+futuristic',
    pixel: 'pixel+art+retro+game',
    steampunk: 'steampunk+brass+gears+vintage'
  };
  
  const safePrompt = encodeURIComponent(
    `${prompt} ${stylesMap[style] || stylesMap.anime}, masterpiece, best quality`
  );
  
  return `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;
}
async function generateText(prompt) {
  // Shuffle endpoints to distribute load
  const shuffled = [...AI_ENDPOINTS].sort(() => 0.5 - Math.random());
  
  for (const endpoint of shuffled) {
    try {
      await setTimeoutPromise(200); // Prevent rate limits
      const res = await axios.get(endpoint.url(prompt), { 
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const result = endpoint.parser(res);
      if (result && typeof result === 'string' && result.length > 5) {
        return {
          response: result.trim(),
          source: endpoint.name,
          latency: res.headers['x-response-time'] || 'unknown'
        };
      }
    } catch (err) {
      console.log(`[AI] ${endpoint.name} failed: ${err.message}`);
      continue;
    }
  }
  return {
    response: `🧠 *KaaX AI*\n\nI processed your request locally!\n\nYou asked: "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"\n\n💡 *Tip:* For better responses, add descriptive details to your prompt!`,
    source: 'Local Fallback',
    latency: '0ms'
  };
}
async function generateLogo(text) {
  const styles = [
    'glowing+neon+cyberpunk+text',
    'ancient+runes+magic+text',
    'steampunk+gears+brass+text',
    'holographic+futuristic+text',
    'blood+gothic+horror+text'
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${text} ${style}, 3D render, cinematic lighting, dark background`
  )}?width=1024&height=512&seed=${Date.now()}&nologo=true`;
}

module.exports = { generateText, generateImage, generateLogo };
