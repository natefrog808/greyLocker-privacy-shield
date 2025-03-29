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

// Feature toggles
const trackerBlockingToggle = document.getElementById('tracker-blocking');
const fingerprintProtectionToggle = document.getElementById('fingerprint-protection');
const httpsUpgradeToggle = document.getElementById('https-upgrade');
const headerProtectionToggle = document.getElementById('header-protection');

// Initialize popup state
document.addEventListener('DOMContentLoaded', () => {
  checkWalletConnection();
  setupEventListeners();
  loadFeatureSettings();
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
}

// Check if wallet is already connected
function checkWalletConnection() {
  updateUIState('loading');
  
  chrome.runtime.sendMessage({ action: 'checkAccess' }, (response) => {
    if (response.wallet && response.hasAccess) {
      updateUIState('verified', response.wallet);
    } else if (response.wallet && !response.hasAccess) {
      updateUIState('failed', response.wallet);
    } else {
      updateUIState('disconnected');
    }
  });
}

// Connect wallet
function connectWallet(walletType) {
  updateUIState('connecting');
  
  chrome.runtime.sendMessage(
    { action: 'connectWallet', walletType },
    (response) => {
      if (response.connected && response.hasAccess) {
        updateUIState('verified', response.wallet);
      } else if (response.connected && !response.hasAccess) {
        updateUIState('failed', response.wallet);
      } else {
        updateUIState('error', null, response.error);
        setTimeout(() => {
          updateUIState('disconnected');
        }, 3000);
      }
    }
  );
}

// Disconnect wallet
function disconnectWallet() {
  chrome.runtime.sendMessage({ action: 'disconnect' }, () => {
    updateUIState('disconnected');
  });
}

// Copy wallet address to clipboard
function copyWalletAddress() {
  const address = walletAddressText.textContent;
  navigator.clipboard.writeText(address)
    .then(() => {
      copyAddressBtn.innerHTML = '<span class="material-icons">check</span>';
      setTimeout(() => {
        copyAddressBtn.innerHTML = '<span class="material-icons">content_copy</span>';
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy address:', err);
    });
}

// Reset to connection state
function resetConnectionState() {
  updateUIState('disconnected');
}

// Update UI based on connection state
function updateUIState(state, walletAddress, errorMessage) {
  // Hide all sections first
  connectSection.classList.add('hidden');
  featuresSection.classList.add('hidden');
  verificationFailedSection.classList.add('hidden');
  walletConnectedSection.classList.add('hidden');
  
  // Update status indicator and show appropriate section
  switch (state) {
    case 'disconnected':
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'Disconnected';
      connectSection.classList.remove('hidden');
      break;
      
    case 'connecting':
      statusIndicator.className = 'status-indicator pending';
      statusText.textContent = 'Connecting...';
      break;
      
    case 'verified':
      statusIndicator.className = 'status-indicator connected';
      statusText.textContent = 'Connected & Verified';
      featuresSection.classList.remove('hidden');
      walletConnectedSection.classList.remove('hidden');
      walletAddressText.textContent = truncateAddress(walletAddress);
      break;
      
    case 'failed':
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'NFT Verification Failed';
      verificationFailedSection.classList.remove('hidden');
      walletConnectedSection.classList.remove('hidden');
      walletAddressText.textContent = truncateAddress(walletAddress);
      break;
      
    case 'loading':
      statusIndicator.className = 'status-indicator pending';
      statusText.textContent = 'Loading...';
      break;
      
    case 'error':
      statusIndicator.className = 'status-indicator';
      statusText.textContent = errorMessage || 'Error Occurred';
      break;
  }
}

// Load feature settings from storage
function loadFeatureSettings() {
  chrome.storage.local.get(
    {
      trackerBlocking: true,
      fingerprintProtection: true,
      httpsUpgrade: true,
      headerProtection: true
    },
    (settings) => {
      trackerBlockingToggle.checked = settings.trackerBlocking;
      fingerprintProtectionToggle.checked = settings.fingerprintProtection;
      httpsUpgradeToggle.checked = settings.httpsUpgrade;
      headerProtectionToggle.checked = settings.headerProtection;
    }
  );
}

// Update feature settings in storage
function updateFeatureSettings() {
  const settings = {
    trackerBlocking: trackerBlockingToggle.checked,
    fingerprintProtection: fingerprintProtectionToggle.checked,
    httpsUpgrade: httpsUpgradeToggle.checked,
    headerProtection: headerProtectionToggle.checked
  };
  
  chrome.storage.local.set(settings);
  chrome.runtime.sendMessage({ action: 'updateFeatures', settings });
}

// Helper function to truncate wallet address
function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
