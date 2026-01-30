const socket = io();
let currentStep = 1;
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// QR Code Handling
socket.on('qr_update', (data) => {
  const qrContainer = document.getElementById('qrContainer');
  qrContainer.innerHTML = `<img src="${data.qr}" alt="WhatsApp Pairing QR" class="qr-image">`;
  statusText.textContent = "Scan QR with WhatsApp to pair";
  statusText.className = "";
  document.getElementById('step1').classList.add('active');
  document.getElementById('step2').classList.remove('active');
  currentStep = 1;
});

// Poll for session ID
async function checkSession() {
  try {
    const res = await fetch('/api/session');
    if (res.ok) {
      const data = await res.json();
      
      // Show session step
      document.getElementById('step1').classList.remove('active');
      document.getElementById('step2').classList.add('active');
      currentStep = 2;
      
      // Display session
      const sessionBox = document.getElementById('sessionBox');
      sessionBox.innerHTML = `<div class="session-content">${data.session.substring(0, 20)}...${data.session.substring(data.session.length - 15)}</div>`;
      
      // Enable download
      document.getElementById('downloadBtn').disabled = false;
      document.getElementById('downloadBtn').onclick = () => {
        window.location.href = '/download/env';
      };
      
      // Update status
      statusDot.style.background = '#00f5a0';
      statusDot.style.boxShadow = '0 0 10px rgba(0, 245, 160, 0.7)';
      statusText.textContent = "SECURE SESSION DELIVERED";
      statusText.className = "secure";
      
      return true;
    }
  } catch (e) {
    console.log("Session not ready yet");
  }
  return false;}

// Auto-check session after QR scan
setInterval(async () => {
  if (currentStep === 1 && document.querySelector('.qr-image')) {
    const ready = await checkSession();
    if (ready) return;
  }
}, 3000);

// Initialize particles
document.addEventListener('DOMContentLoaded', () => {
  particlesJS('particles-js', {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: "#6c00ff" },
      shape: { type: "circle" },
      opacity: { value: 0.15, random: true },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#6c00ff",
        opacity: 0.12,
        width: 1
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: true,
        straight: false,
        out_mode: "out",
        bounce: false
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: true, mode: "push" },
        resize: true
      },
      modes: {
        grab: { distance: 140, line_linked: { opacity: 0.3 } },
        push: { particles_nb: 4 }
      }
    },
    retina_detect: true
  });  
  // Initial status
  setTimeout(() => {
    statusText.textContent = "Waiting for QR generation...";
  }, 1000);
});
