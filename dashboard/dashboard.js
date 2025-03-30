// Simulate log entries
const logContent = document.querySelector('.logs-content');
const logTypes = ['info', 'warn', 'success', 'error'];
const logPrefixes = {
  'info': '[INFO]',
  'warn': '[BLOCK]',
  'success': '[SUCCESS]',
  'error': '[ERROR]'
};
const trackers = [
  'doubleclick.net/pixel.gif',
  'facebook.net/fbevents.js',
  'google-analytics.com/analytics.js',
  'googletagmanager.com/gtm.js',
  'hotjar.com/hotjar.js',
  'amazon-adsystem.com/aax2/apstag.js',
  'scorecardresearch.com/beacon.js',
  'optimizely.com/optimizely.js',
  'segment.io/analytics.js',
  'adnxs.com/jpt',
  'criteo.net/js/ld/ld.js'
];

const fingerprinting = [
  'Canvas fingerprinting attempt detected and neutralized',
  'WebGL fingerprinting attempt detected and neutralized',
  'Audio fingerprinting attempt detected and neutralized',
  'Font enumeration attempt blocked',
  'Timing attack neutralized',
  'BatteryAPI fingerprinting attempt blocked',
  'WebRTC IP leak prevented',
  'Navigator properties standardized',
  'Storage access attempt intercepted'
];

function generateLogEntry() {
  if (logContent.children.length > 50) {
    logContent.removeChild(logContent.children[0]);
  }
  
  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' + 
               now.getMinutes().toString().padStart(2, '0') + ':' + 
               now.getSeconds().toString().padStart(2, '0');
  
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = time;
  
  const rand = Math.random();
  let type, message;
  
  if (rand < 0.6) {
    type = 'warn';
    const trackerIndex = Math.floor(Math.random() * trackers.length);
    message = `Blocked tracker: ${trackers[trackerIndex]}`;
    
    // Update stats
    const statValue = document.querySelector('.stat-value');
    statValue.textContent = (parseInt(statValue.textContent) + 1).toString();
  } else if (rand < 0.9) {
    type = 'info';
    const fpIndex = Math.floor(Math.random() * fingerprinting.length);
    message = fingerprinting[fpIndex];
  } else if (rand < 0.95) {
    type = 'success';
    message = 'NFT re-verification successful';
  } else {
    type = 'error';
    message = 'Connection attempt failed, retrying...';
  }
  
  const statusSpan = document.createElement('span');
  statusSpan.className = `log-status ${type}`;
  statusSpan.textContent = logPrefixes[type];
  
  const messageSpan = document.createElement('span');
  messageSpan.className = 'log-message';
  messageSpan.textContent = message;
  
  logEntry.appendChild(timeSpan);
  logEntry.appendChild(statusSpan);
  logEntry.appendChild(messageSpan);
  
  logContent.appendChild(logEntry);
  logContent.scrollTop = logContent.scrollHeight;
}

// Generate log entries
setInterval(generateLogEntry, 3000);

// Add click events for buttons
document.querySelectorAll('.nav-button').forEach(button => {
  button.addEventListener('click', function() {
    document.querySelectorAll('.nav-button').forEach(btn => {
      btn.classList.remove('active');
    });
    this.classList.add('active');
  });
});

// Add toggle effects
document.querySelectorAll('.toggle input').forEach(toggle => {
  toggle.addEventListener('change', function() {
    const feature = this.closest('.feature-item').querySelector('.feature-name').textContent.trim();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + 
                now.getMinutes().toString().padStart(2, '0') + ':' + 
                now.getSeconds().toString().padStart(2, '0');
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = time;
    
    const statusSpan = document.createElement('span');
    statusSpan.className = this.checked ? 'log-status success' : 'log-status warn';
    statusSpan.textContent = this.checked ? '[ENABLE]' : '[DISABLE]';
    
    const messageSpan = document.createElement('span');
    messageSpan.className = 'log-message';
    messageSpan.textContent = `${feature} ${this.checked ? 'enabled' : 'disabled'}`;
    
    logEntry.appendChild(timeSpan);
    logEntry.appendChild(statusSpan);
    logEntry.appendChild(messageSpan);
    
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
  });
});

// Copy button functionality
document.querySelector('.copy-button').addEventListener('click', function() {
  const address = this.previousElementSibling.textContent.trim();
  navigator.clipboard.writeText(address)
    .then(() => {
      this.textContent = '✓';
      setTimeout(() => {
        this.textContent = '⧉';
      }, 2000);
    });
});

// Add random flicker effect to neon elements
setInterval(() => {
  const randomElements = document.querySelectorAll('.logo-title, .status-indicator, .stat-value');
  const randomElement = randomElements[Math.floor(Math.random() * randomElements.length)];
  randomElement.classList.add('flicker');
  setTimeout(() => {
    randomElement.classList.remove('flicker');
  }, 1000);
}, 5000);

// Extension specific functionality
// This would connect to your actual background.js in a real extension
document.addEventListener('DOMContentLoaded', function() {
  // Check for chrome APIs in extension context
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Send message to background script to get current status
    chrome.runtime.sendMessage({ action: 'checkAccess' }, function(response) {
      if (response && response.hasAccess) {
        updateInterface(response);
      } else {
        // No access, would show NFT connection screen
        console.log('No NFT access detected, would show connection UI');
      }
    });
    
    // Listen for updates from background script
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.action === 'featureUpdated') {
        // Update specific feature toggle
        const toggle = document.querySelector(`#${message.feature}`);
        if (toggle) {
          toggle.checked = message.enabled;
        }
      }
      
      if (message.action === 'statsUpdated') {
        // Update tracker block count
        const statValue = document.querySelector('.stat-value');
        statValue.textContent = message.blockedCount.toString();
      }
    });
  }
});

// Function to update interface based on extension data
function updateInterface(data) {
  if (data.wallet) {
    const walletAddress = document.querySelector('.wallet-address');
    walletAddress.textContent = formatWalletAddress(data.wallet);
  }
  
  if (data.blockedCount) {
    const statValue = document.querySelector('.stat-value');
    statValue.textContent = data.blockedCount.toString();
  }
  
  // Update feature toggles from saved settings
  if (data.settings) {
    for (const [feature, enabled] of Object.entries(data.settings)) {
      const toggle = document.querySelector(`#${feature}`);
      if (toggle) {
        toggle.checked = enabled;
      }
    }
  }
}

// Format wallet address for display (show first 4 and last 4 chars)
function formatWalletAddress(address) {
  if (!address || address.length < 8) return address;
  return address.slice(0, 4) + '...' + address.slice(-4);
}

// Reset stats button
document.querySelector('.action-button').addEventListener('click', function() {
  // In a real extension, this would send a message to the background script
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ action: 'resetStats' });
  }
  
  // For demo purposes, reset the tracker count to 0
  document.querySelector('.stat-value').textContent = '0';
  
  // Add a log entry
  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' + 
              now.getMinutes().toString().padStart(2, '0') + ':' + 
              now.getSeconds().toString().padStart(2, '0');
  
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = time;
  
  const statusSpan = document.createElement('span');
  statusSpan.className = 'log-status info';
  statusSpan.textContent = '[INFO]';
  
  const messageSpan = document.createElement('span');
  messageSpan.className = 'log-message';
  messageSpan.textContent = 'Tracker statistics reset to zero';
  
  logEntry.appendChild(timeSpan);
  logEntry.appendChild(statusSpan);
  logEntry.appendChild(messageSpan);
  
  logContent.appendChild(logEntry);
  logContent.scrollTop = logContent.scrollHeight;
});
