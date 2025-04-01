/**
 * GreyLocker Privacy Shield
 * Popup functionality for controlling privacy settings
 * Updated to work with Manifest V3 and NFT verification system
 */

// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const connectSection = document.getElementById('connect-section');
const featuresSection = document.getElementById('features-section');
const verificationFailedSection = document.getElementById('verification-failed');
const walletConnectedSection = document.getElementById('wallet-connected');
const walletAddressText = document.getElementById('wallet-address-text');
const connectPhantomBtn = document.getElementById('connect-phantom');
const connectSolflareBtn = document.getElementById('connect-solflare');
const disconnectWalletBtn = document.getElementById('disconnect-wallet');
const tryDifferentWalletBtn = document.getElementById('try-different-wallet');
const copyAddressBtn = document.getElementById('copy-address');
const advancedToggle = document.getElementById('advanced-toggle');
const advancedFeatures = document.getElementById('advanced-features');
const blocksCountElement = document.getElementById('blocks-count');
const fingerprintsCountElement = document.getElementById('fingerprints-count');

// Feature toggles
const trackerBlockingToggle = document.getElementById('tracker-blocking');
const fingerprintProtectionToggle = document.getElementById('fingerprint-protection');
const httpsUpgradeToggle = document.getElementById('https-upgrade');
const headerProtectionToggle = document.getElementById('header-protection');

// Advanced feature toggles
const audioProtectionToggle = document.getElementById('audio-protection');
const webglProtectionToggle = document.getElementById('webgl-protection');
const fontProtectionToggle = document.getElementById('font-protection');
const batteryProtectionToggle = document.getElementById('battery-protection');
const screenResolutionToggle = document.getElementById('screen-resolution');
const mediaDevicesToggle = document.getElementById('media-devices');
const webrtcProtectionToggle = document.getElementById('webrtc-protection');
const timingProtectionToggle = document.getElementById('timing-protection');
const storageProtectionToggle = document.getElementById('storage-protection');

// NFT info
const glitchGangAddress = "EpyXG6ZH98zKgex5GccGW6r2yeYfMuvkvG3cES5iP95k";
const quantumKeyAddress = "EALacBDs4xqu4xyKcp6gCkjtjU6psh2ykZj4Xv2Qqgwu";
const nftCollectionLinks = {
  glitchgang: "https://magiceden.io/marketplace/glitch_gang",
  quantumkey: "https://magiceden.io/marketplace/quantum_key"
};

// State variables
let statsUpdateInterval;
let blockCount = 0;
let fingerprintCount = 0;
let walletAddress = null;
let connectedWalletType = null;
let currentNftCollection = null;

// Initialize popup state
document.addEventListener('DOMContentLoaded', () => {
  checkAccessStatus();
  setupEventListeners();
  loadFeatureSettings();
  startStatsAnimation();
  applyDigitalRainEffect();
  
  // Check if we should show advanced features
  chrome.storage.local.get(['advancedFeaturesVisible'], (result) => {
    if (result.advancedFeaturesVisible) {
      advancedFeatures.classList.remove('hidden');
      advancedToggle.classList.add('active');
      advancedToggle.querySelector('.toggle-icon').textContent = '▴';
    }
  });
});

// Setup event listeners
function setupEventListeners() {
  // Wallet connection
  connectPhantomBtn.addEventListener('click', () => connectWallet('phantom'));
  connectSolflareBtn.addEventListener('click', () => connectWallet('solflare'));
  disconnectWalletBtn.addEventListener('click', disconnectWallet);
  tryDifferentWalletBtn.addEventListener('click', resetConnectionState);
  
  // Copy wallet address
  copyAddressBtn.addEventListener('click', copyWalletAddress);
  
  // Feature toggles
  trackerBlockingToggle.addEventListener('change', updateFeatureSettings);
  fingerprintProtectionToggle.addEventListener('change', updateFeatureSettings);
  httpsUpgradeToggle.addEventListener('change', updateFeatureSettings);
  headerProtectionToggle.addEventListener('change', updateFeatureSettings);
  
  // Advanced feature toggles
  audioProtectionToggle.addEventListener('change', updateAdvancedFeatureSettings);
  webglProtectionToggle.addEventListener('change', updateAdvancedFeatureSettings);
  fontProtectionToggle.addEventListener('change', updateAdvancedFeatureSettings);
  batteryProtectionToggle.addEventListener('change', updateAdvancedFeatureSettings);
  screenResolutionToggle.addEventListener('change', updateAdvancedFeatureSettings);
  mediaDevicesToggle.addEventListener('change', updateAdvancedFeatureSettings);
  webrtcProtectionToggle.addEventListener('change', updateAdvancedFeatureSettings);
  timingProtectionToggle.addEventListener('change', updateAdvancedFeatureSettings);
  storageProtectionToggle.addEventListener('change', updateAdvancedFeatureSettings);
  
  // Advanced toggle
  advancedToggle.addEventListener('click', toggleAdvancedFeatures);
  
  // Open dashboard in a new tab when button is clicked
  document.getElementById('open-dashboard')?.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });
  
  // NFT verification buttons
  document.getElementById('verify-glitchgang')?.addEventListener('click', () => verifyNFT('glitchgang'));
  document.getElementById('verify-quantumkey')?.addEventListener('click', () => verifyNFT('quantumkey'));
  
  // Marketplace links
  document.getElementById('glitchgang-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: nftCollectionLinks.glitchgang });
  });
  
  document.getElementById('quantumkey-link')?.addEventListener('click', () => {
    chrome.tabs.create({ url: nftCollectionLinks.quantumkey });
  });
}

// Check if wallet is already connected and if NFT access is verified
function checkAccessStatus() {
  updateUIState('loading');
  
  chrome.runtime.sendMessage({ action: 'checkAccess' }, (response) => {
    if (!response) {
      console.error("Failed to get access status");
      updateUIState('error');
      return;
    }
    
    if (response.hasAccess) {
      // User has verified NFT access
      walletAddress = response.walletAddress || "Verified";
      currentNftCollection = response.nftCollection;
      updateUIState('verified');
      
      // Start stats update
      chrome.runtime.sendMessage({ action: 'getStats' }, (statsResponse) => {
        if (statsResponse && statsResponse.success) {
          updateStatCounters(
            statsResponse.stats.trackersBlocked || 0,
            statsResponse.stats.fingerprintsProtected || 0
          );
        }
      });
    } else if (response.walletAddress && !response.hasAccess) {
      // User has connected wallet but no verified NFT
      walletAddress = response.walletAddress;
      updateUIState('failed');
    } else {
      // User hasn't connected wallet yet
      updateUIState('disconnected');
    }
  });
}

// Connect wallet
function connectWallet(walletType) {
  updateUIState('connecting');
  connectedWalletType = walletType;
  
  try {
    if (walletType === 'phantom') {
      connectPhantomWallet();
    } else if (walletType === 'solflare') {
      connectSolflareWallet();
    }
  } catch (error) {
    console.error(`Error connecting to ${walletType}:`, error);
    updateUIState('error', null, `Failed to connect to ${walletType}. ${error.message || ''}`);
  }
}

// Connect to Phantom wallet
async function connectPhantomWallet() {
  // Check if Phantom is installed
  if (!window.solana || !window.solana.isPhantom) {
    updateUIState('error', null, "Phantom wallet not found. Please install it first.");
    
    // Open Phantom installation page
    setTimeout(() => {
      if (confirm("Would you like to install Phantom wallet?")) {
        chrome.tabs.create({ url: "https://phantom.app/" });
      }
      updateUIState('disconnected');
    }, 2000);
    return;
  }
  
  try {
    // Connect to Phantom
    const resp = await window.solana.connect({ onlyIfTrusted: false });
    walletAddress = resp.publicKey.toString();
    
    // Store wallet info
    chrome.storage.local.set({
      walletAddress,
      walletType: 'phantom'
    });
    
    // Check NFT ownership
    updateUIState('verifying');
    
    // Just update UI for now - actual verification happens when verify button is clicked
    updateUIState('failed');
  } catch (error) {
    console.error("Error connecting to Phantom:", error);
    updateUIState('error', null, error.message || "Failed to connect to Phantom");
    setTimeout(() => updateUIState('disconnected'), 3000);
  }
}

// Connect to Solflare wallet
async function connectSolflareWallet() {
  // Check if Solflare is installed
  if (!window.solflare || !window.solflare.isSolflare) {
    updateUIState('error', null, "Solflare wallet not found. Please install it first.");
    
    // Open Solflare installation page
    setTimeout(() => {
      if (confirm("Would you like to install Solflare wallet?")) {
        chrome.tabs.create({ url: "https://solflare.com/" });
      }
      updateUIState('disconnected');
    }, 2000);
    return;
  }
  
  try {
    // Connect to Solflare
    await window.solflare.connect();
    walletAddress = window.solflare.publicKey.toString();
    
    // Store wallet info
    chrome.storage.local.set({
      walletAddress,
      walletType: 'solflare'
    });
    
    // Check NFT ownership
    updateUIState('verifying');
    
    // Just update UI for now - actual verification happens when verify button is clicked
    updateUIState('failed');
  } catch (error) {
    console.error("Error connecting to Solflare:", error);
    updateUIState('error', null, error.message || "Failed to connect to Solflare");
    setTimeout(() => updateUIState('disconnected'), 3000);
  }
}

// Verify NFT ownership
function verifyNFT(collection) {
  if (!walletAddress) {
    console.error("No wallet connected");
    return;
  }
  
  updateUIState('verifying');
  
  // Send verification request to background script
  chrome.runtime.sendMessage({
    action: 'verifyNFT',
    collection,
    tokenId: null // We don't need specific token ID for this implementation
  }, (response) => {
    if (!response) {
      console.error("Failed to verify NFT");
      updateUIState('error', null, "Verification failed");
      setTimeout(() => updateUIState('failed'), 3000);
      return;
    }
    
    if (response.success && response.hasAccess) {
      // NFT verified successfully
      currentNftCollection = collection;
      updateUIState('verified');
      
      // Start stats update
      startStatsUpdate();
    } else {
      // Verification failed
      updateUIState('failed');
      
      console.error("NFT verification failed:", response.error || "Not owned");
    }
  });
}

// Disconnect wallet
function disconnectWallet() {
  // Disconnect from wallet provider if available
  try {
    if (connectedWalletType === 'phantom' && window.solana) {
      window.solana.disconnect();
    } else if (connectedWalletType === 'solflare' && window.solflare) {
      window.solflare.disconnect();
    }
  } catch (e) {
    console.error("Error disconnecting wallet:", e);
  }
  
  // Clear wallet info in storage
  chrome.storage.local.remove(['walletAddress', 'walletType']);
  
  // Reset UI state
  walletAddress = null;
  connectedWalletType = null;
  currentNftCollection = null;
  updateUIState('disconnected');
  
  // Stop updating stats
  if (statsUpdateInterval) {
    clearInterval(statsUpdateInterval);
    statsUpdateInterval = null;
  }
}

// Copy wallet address to clipboard
function copyWalletAddress() {
  const address = walletAddressText.textContent;
  navigator.clipboard.writeText(address)
    .then(() => {
      // Show feedback
      copyAddressBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path>
        </svg>
      `;
      
      // Reset after 2 seconds
      setTimeout(() => {
        copyAddressBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
          </svg>
        `;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy address:', err);
    });
}

// Toggle advanced features
function toggleAdvancedFeatures() {
  advancedFeatures.classList.toggle('hidden');
  advancedToggle.classList.toggle('active');
  
  const isVisible = !advancedFeatures.classList.contains('hidden');
  advancedToggle.querySelector('.toggle-icon').textContent = isVisible ? '▴' : '▾';
  
  // Store preference
  chrome.storage.local.set({ advancedFeaturesVisible: isVisible });
}

// Reset to connection state
function resetConnectionState() {
  // Disconnect current wallet before showing connect options
  disconnectWallet();
}

// Update UI based on connection state
function updateUIState(state, errorMessage) {
  // Hide all sections first
  connectSection.classList.add('hidden');
  featuresSection.classList.add('hidden');
  verificationFailedSection.classList.add('hidden');
  walletConnectedSection.classList.add('hidden');
  
  // Remove active-shield class from all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active-shield');
  });
  
  // Update status indicator and show appropriate section
  switch (state) {
    case 'disconnected':
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'DISCONNECTED';
      connectSection.classList.remove('hidden');
      break;
      
    case 'connecting':
      statusIndicator.className = 'status-indicator pending';
      statusText.textContent = 'CONNECTING...';
      break;
      
    case 'verifying':
      statusIndicator.className = 'status-indicator pending';
      statusText.textContent = 'VERIFYING NFT...';
      break;
      
    case 'verified':
      statusIndicator.className = 'status-indicator connected';
      statusText.textContent = 'SHIELD ACTIVE';
      featuresSection.classList.remove('hidden');
      walletConnectedSection.classList.remove('hidden');
      walletAddressText.textContent = truncateAddress(walletAddress);
      
      // Show which NFT is active
      const nftBadge = document.getElementById('nft-badge');
      if (nftBadge) {
        nftBadge.textContent = currentNftCollection === 'glitchgang' ? 
          'Glitch Gang' : 'Quantum Key';
        nftBadge.classList.remove('hidden');
      }
      
      // Add digital rain animation
      featuresSection.classList.add('active-shield');
      
      // Start stats update
      startStatsUpdate();
      break;
      
    case 'failed':
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'VERIFICATION NEEDED';
      verificationFailedSection.classList.remove('hidden');
      walletConnectedSection.classList.remove('hidden');
      walletAddressText.textContent = truncateAddress(walletAddress);
      break;
      
    case 'loading':
      statusIndicator.className = 'status-indicator pending';
      statusText.textContent = 'INITIALIZING...';
      break;
      
    case 'error':
      statusIndicator.className = 'status-indicator';
      statusText.textContent = errorMessage || 'ERROR';
      break;
  }
}

// Load feature settings from storage
function loadFeatureSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    if (result.settings) {
      updateToggleStates(result.settings);
    }
  });
}

// Update toggle states based on settings
function updateToggleStates(settings) {
  // Basic settings
  if (settings.trackerBlocking !== undefined) {
    trackerBlockingToggle.checked = settings.trackerBlocking;
  }
  
  if (settings.fingerprintProtection !== undefined) {
    fingerprintProtectionToggle.checked = settings.fingerprintProtection;
  }
  
  if (settings.httpsUpgrade !== undefined) {
    httpsUpgradeToggle.checked = settings.httpsUpgrade;
  }
  
  if (settings.headerProtection !== undefined) {
    headerProtectionToggle.checked = settings.headerProtection;
  }
  
  // Advanced settings
  if (settings.advancedProtection) {
    if (settings.advancedProtection.audioFingerprint !== undefined) {
      audioProtectionToggle.checked = settings.advancedProtection.audioFingerprint;
    }
    
    if (settings.advancedProtection.webglFingerprint !== undefined) {
      webglProtectionToggle.checked = settings.advancedProtection.webglFingerprint;
    }
    
    if (settings.advancedProtection.fontFingerprint !== undefined) {
      fontProtectionToggle.checked = settings.advancedProtection.fontFingerprint;
    }
    
    if (settings.advancedProtection.batteryFingerprint !== undefined) {
      batteryProtectionToggle.checked = settings.advancedProtection.batteryFingerprint;
    }
    
    if (settings.advancedProtection.screenResolution !== undefined) {
      screenResolutionToggle.checked = settings.advancedProtection.screenResolution;
    }
    
    if (settings.advancedProtection.mediaDevices !== undefined) {
      mediaDevicesToggle.checked = settings.advancedProtection.mediaDevices;
    }
    
    if (settings.advancedProtection.webrtcProtection !== undefined) {
      webrtcProtectionToggle.checked = settings.advancedProtection.webrtcProtection;
    }
    
    if (settings.advancedProtection.timingProtection !== undefined) {
      timingProtectionToggle.checked = settings.advancedProtection.timingProtection;
    }
    
    if (settings.advancedProtection.storageProtection !== undefined) {
      storageProtectionToggle.checked = settings.advancedProtection.storageProtection;
    }
  }
}

// Update feature settings in storage
function updateFeatureSettings() {
  const settings = {
    trackerBlocking: trackerBlockingToggle.checked,
    fingerprintProtection: fingerprintProtectionToggle.checked,
    httpsUpgrade: httpsUpgradeToggle.checked,
    headerProtection: headerProtectionToggle.checked
  };
  
  chrome.storage.local.get(['settings'], (result) => {
    const existingSettings = result.settings || {};
    const updatedSettings = { ...existingSettings, ...settings };
    
    chrome.storage.local.set({ settings: updatedSettings });
    chrome.runtime.sendMessage({ 
      action: 'saveSettings', 
      settings: updatedSettings 
    });
  });
}

// Update advanced feature settings
function updateAdvancedFeatureSettings() {
  const advancedSettings = {
    audioFingerprint: audioProtectionToggle.checked,
    webglFingerprint: webglProtectionToggle.checked,
    fontFingerprint: fontProtectionToggle.checked,
    batteryFingerprint: batteryProtectionToggle.checked,
    screenResolution: screenResolutionToggle.checked,
    mediaDevices: mediaDevicesToggle.checked,
    webrtcProtection: webrtcProtectionToggle.checked,
    timingProtection: timingProtectionToggle.checked,
    storageProtection: storageProtectionToggle.checked
  };
  
  chrome.storage.local.get(['settings'], (result) => {
    const existingSettings = result.settings || {};
    const existingAdvanced = existingSettings.advancedProtection || {};
    
    const updatedSettings = {
      ...existingSettings,
      advancedProtection: {
        ...existingAdvanced,
        ...advancedSettings
      }
    };
    
    chrome.storage.local.set({ settings: updatedSettings });
    chrome.runtime.sendMessage({ 
      action: 'saveSettings', 
      settings: updatedSettings 
    });
  });
}

// Start stats update
function startStatsUpdate() {
  // Clear existing interval if any
  if (statsUpdateInterval) {
    clearInterval(statsUpdateInterval);
  }
  
  // Update immediately
  updateStats();
  
  // Then update every 3 seconds
  statsUpdateInterval = setInterval(updateStats, 3000);
}

// Update stats from background
function updateStats() {
  chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
    if (!response || !response.success) return;
    
    updateStatCounters(
      response.stats.trackersBlocked || 0, 
      response.stats.fingerprintsProtected || 0
    );
  });
}

// Update stat counters
function updateStatCounters(blocked = 0, fingerprints = 0) {
  // If fingerprint count not provided, estimate it as 20% of blocked trackers
  fingerprints = fingerprints || Math.floor(blocked * 0.2);
  
  // Set goal values
  blockCount = blocked;
  fingerprintCount = fingerprints;
  
  // Update display
  blocksCountElement.textContent = blockCount;
  fingerprintsCountElement.textContent = fingerprintCount;
}

// Animate stats for visual effect
function startStatsAnimation() {
  let currentBlockCount = 0;
  let currentFingerprintCount = 0;
  
  const animateNumbers = () => {
    // Animate block count
    if (currentBlockCount < blockCount) {
      currentBlockCount = Math.min(currentBlockCount + Math.ceil((blockCount - currentBlockCount) / 10), blockCount);
      blocksCountElement.textContent = currentBlockCount;
    }
    
    // Animate fingerprint count
    if (currentFingerprintCount < fingerprintCount) {
      currentFingerprintCount = Math.min(currentFingerprintCount + Math.ceil((fingerprintCount - currentFingerprintCount) / 10), fingerprintCount);
      fingerprintsCountElement.textContent = currentFingerprintCount;
    }
    
    // Continue animation if not finished
    if (currentBlockCount < blockCount || currentFingerprintCount < fingerprintCount) {
      requestAnimationFrame(animateNumbers);
    }
  };
  
  animateNumbers();
}

// Apply digital rain effect to active shield
function applyDigitalRainEffect() {
  const sections = document.querySelectorAll('.section');
  
  // Add transition effect for smooth class changes
  sections.forEach(section => {
    section.style.transition = 'all 0.3s ease';
  });
}

// Helper function to truncate wallet address
function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
