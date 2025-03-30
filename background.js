/**
 * GreyLocker Privacy Shield
 * Background script for privacy protection and NFT verification
 */

// Import libraries from local files
// These should be included in the extension's lib directory
// lib/solana-web3.js and lib/web3.min.js

// Configuration
const NFT_MINT_ADDRESS = "5LjKf5TZs4cdwkhraeufmdpPWVjrGYygTBUUjd4EA6Vw"; // Glitch Gang NFT
const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const VERSION = "1.0.0";
const DEFAULT_SETTINGS = {
  trackerBlocking: true,
  fingerprintProtection: true,
  httpsUpgrade: true,
  headerProtection: true,
  blockTrackers: [
    "google-analytics.com",
    "analytics.google.com",
    "doubleclick.net",
    "facebook.net",
    "connect.facebook.net",
    "adnxs.com",
    "googletagmanager.com",
    "hotjar.com",
    "ads-twitter.com",
    "analytics.twitter.com",
    "pixel.facebook.com",
    "scorecardresearch.com",
    "amazon-adsystem.com",
    "bugsnag.com",
    "optimizely.com",
    "segment.io",
    "adjust.com",
    "appsflyer.com"
  ]
};

// State variables
let hasAccessToken = false;
let walletAddress = null;
let privacySettings = {...DEFAULT_SETTINGS};
let blockedTrackersCount = 0;
let lastVerificationTime = 0;
const VERIFICATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Initialize extension when loaded
chrome.runtime.onInstalled.addListener((details) => {
  console.log("GreyLocker Privacy Shield installed/updated:", VERSION);
  
  if (details.reason === "install") {
    // Set default settings on first install
    chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    
    // Create and show welcome notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icons/icon128.png",
      title: "GreyLocker Privacy Shield Installed",
      message: "Connect your Solana wallet with a Megapixel Core NFT to activate privacy features."
    });
    
  } else if (details.reason === "update") {
    // Handle update if needed
    loadSettings();
  }
  
  // Initialize state
  checkLocalStorage();
});

// Load privacy settings
function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    if (result.settings) {
      privacySettings = {...DEFAULT_SETTINGS, ...result.settings};
    } else {
      privacySettings = {...DEFAULT_SETTINGS};
      chrome.storage.local.set({ settings: privacySettings });
    }
    console.log("Privacy settings loaded:", privacySettings);
  });
}

// Check for stored wallet and access token
function checkLocalStorage() {
  chrome.storage.local.get(['walletAddress', 'hasAccess', 'lastVerification', 'settings'], (result) => {
    // Load wallet status
    if (result.walletAddress) {
      walletAddress = result.walletAddress;
      hasAccessToken = result.hasAccess || false;
      lastVerificationTime = result.lastVerification || 0;
      
      if (hasAccessToken) {
        console.log("Access already verified for wallet:", walletAddress);
        
        // If verification is older than the interval, re-verify
        const currentTime = Date.now();
        if (currentTime - lastVerificationTime > VERIFICATION_INTERVAL) {
          console.log("Re-verifying NFT ownership after interval...");
          verifyNFTOwnership(walletAddress).then(hasNFT => {
            hasAccessToken = hasNFT;
            chrome.storage.local.set({ 
              hasAccess: hasNFT,
              lastVerification: currentTime
            });
            
            // Update badge based on verification result
            updateExtensionBadge(hasNFT);
          });
        }
      } else {
        console.log("Need to verify NFT ownership for wallet:", walletAddress);
      }
    } else {
      console.log("No wallet connected yet");
      updateExtensionBadge(false);
    }
    
    // Load settings
    if (result.settings) {
      privacySettings = {...DEFAULT_SETTINGS, ...result.settings};
    } else {
      privacySettings = {...DEFAULT_SETTINGS};
    }
  });
}

// Update extension icon badge
function updateExtensionBadge(isVerified) {
  if (isVerified) {
    chrome.action.setBadgeBackgroundColor({ color: '#33ff99' });
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setTitle({ title: 'GreyLocker Privacy Shield (Active)' });
  } else {
    chrome.action.setBadgeBackgroundColor({ color: '#ff3366' });
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setTitle({ title: 'GreyLocker Privacy Shield (Inactive - Connect NFT)' });
  }
}

// Update tracking statistics
function updateBlockedCount(incrementBy = 1) {
  blockedTrackersCount += incrementBy;
  chrome.storage.local.set({ blockedCount: blockedTrackersCount });
  
  // Optionally update badge with count instead of checkmark
  if (hasAccessToken && privacySettings.trackerBlocking) {
    chrome.action.setBadgeBackgroundColor({ color: '#33ff99' });
    chrome.action.setBadgeText({ text: blockedTrackersCount.toString() });
  }
}

// Connect wallet function
async function connectWallet(walletType) {
  try {
    // Handle different wallet types
    if (walletType === 'phantom') {
      // Check if Phantom is installed
      const provider = window.solana;
      if (!provider) {
        throw new Error("Phantom wallet not found. Please install it.");
      }
      
      // Connect to the wallet
      const response = await provider.connect();
      walletAddress = response.publicKey.toString();
      
      // Store wallet address
      chrome.storage.local.set({ walletAddress });
      
      // Verify NFT ownership
      const hasNFT = await verifyNFTOwnership(walletAddress);
      const currentTime = Date.now();
      
      // Store access status and verification time
      chrome.storage.local.set({ 
        hasAccess: hasNFT,
        lastVerification: currentTime
      });
      
      hasAccessToken = hasNFT;
      updateExtensionBadge(hasNFT);
      
      return { connected: true, wallet: walletAddress, hasAccess: hasNFT };
    } else if (walletType === 'solflare') {
      // Check if Solflare is installed
      const provider = window.solflare;
      if (!provider) {
        throw new Error("Solflare wallet not found. Please install it.");
      }
      
      // Connect to the wallet
      await provider.connect();
      walletAddress = provider.publicKey.toString();
      
      // Store wallet address
      chrome.storage.local.set({ walletAddress });
      
      // Verify NFT ownership
      const hasNFT = await verifyNFTOwnership(walletAddress);
      const currentTime = Date.now();
      
      // Store access status and verification time
      chrome.storage.local.set({ 
        hasAccess: hasNFT,
        lastVerification: currentTime
      });
      
      hasAccessToken = hasNFT;
      updateExtensionBadge(hasNFT);
      
      return { connected: true, wallet: walletAddress, hasAccess: hasNFT };
    }
    
    return { connected: false, error: "Unsupported wallet type" };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return { connected: false, error: error.message };
  }
}

// Verify NFT ownership
async function verifyNFTOwnership(address) {
  try {
    // Connect to Solana network
    const connection = new solanaWeb3.Connection(SOLANA_RPC_URL);
    
    // Get all token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new solanaWeb3.PublicKey(address),
      { programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );
    
    // Check if any token is our NFT
    for (const account of tokenAccounts.value) {
      const tokenInfo = account.account.data.parsed.info;
      const mintAddress = tokenInfo.mint;
      const amount = tokenInfo.tokenAmount.uiAmount;
      
      // Check if this token is the Megapixel Core NFT and owner has at least 1
      if (mintAddress === NFT_MINT_ADDRESS && amount > 0) {
        console.log("NFT verified, granting access!");
        return true;
      }
    }
    
    console.log("NFT not found for this wallet");
    return false;
  } catch (error) {
    console.error("Error verifying NFT ownership:", error);
    return false;
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "connectWallet") {
    connectWallet(message.walletType)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ connected: false, error: error.message }));
    return true; // Indicates async response
  }
  
  if (message.action === "checkAccess") {
    sendResponse({ 
      hasAccess: hasAccessToken, 
      wallet: walletAddress,
      blockedCount: blockedTrackersCount,
      settings: privacySettings
    });
    return true;
  }
  
  if (message.action === "disconnect") {
    walletAddress = null;
    hasAccessToken = false;
    chrome.storage.local.remove(['walletAddress', 'hasAccess', 'lastVerification']);
    updateExtensionBadge(false);
    sendResponse({ disconnected: true });
    return true;
  }
  
  if (message.action === "updateFeatures") {
    if (message.settings) {
      privacySettings = {...privacySettings, ...message.settings};
      chrome.storage.local.set({ settings: privacySettings });
      sendResponse({ updated: true, settings: privacySettings });
    } else {
      sendResponse({ updated: false, error: "No settings provided" });
    }
    return true;
  }
  
  if (message.action === "getStats") {
    sendResponse({ 
      blockedCount: blockedTrackersCount,
      lastVerification: lastVerificationTime,
      version: VERSION
    });
    return true;
  }
  
  if (message.action === "resetStats") {
    blockedTrackersCount = 0;
    chrome.storage.local.set({ blockedCount: 0 });
    sendResponse({ reset: true });
    return true;
  }
});

// Privacy protection features - Header protection
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Only apply privacy features for users with NFT access
    if (!hasAccessToken || !privacySettings.headerProtection) {
      return { requestHeaders: details.requestHeaders };
    }
    
    let requestHeaders = details.requestHeaders;
    
    // Remove tracking headers
    requestHeaders = requestHeaders.filter(header => {
      const name = header.name.toLowerCase();
      return !name.includes('tracking') && 
             !name.includes('fingerprint') && 
             !name.includes('analytics') &&
             name !== 'referer';
    });
    
    // Add Do Not Track header
    requestHeaders.push({ name: "DNT", value: "1" });
    
    // Add additional privacy headers
    requestHeaders.push({ name: "Sec-GPC", value: "1" }); // Global Privacy Control
    
    return { requestHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);

// Tracker blocking
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Only apply privacy features for users with NFT access
    if (!hasAccessToken || !privacySettings.trackerBlocking) {
      return { cancel: false };
    }
    
    // Check if URL contains any tracker domains
    const url = details.url.toLowerCase();
    const shouldBlock = privacySettings.blockTrackers.some(tracker => 
      url.includes(tracker.toLowerCase())
    );
    
    if (shouldBlock) {
      console.log("Blocked tracker:", details.url);
      updateBlockedCount();
      return { cancel: true };
    }
    
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// HTTPS upgrade
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Only apply privacy features for users with NFT access
    if (!hasAccessToken || !privacySettings.httpsUpgrade) {
      return { cancel: false };
    }
    
    // Skip non-HTTP requests and localhost/loopback addresses
    if (!details.url.startsWith('http:') || 
        details.url.includes('localhost') || 
        details.url.includes('127.0.0.1')) {
      return { cancel: false };
    }
    
    // Redirect HTTP to HTTPS
    const httpsUrl = details.url.replace('http:', 'https:');
    return { redirectUrl: httpsUrl };
  },
  { 
    urls: ["http://*/*"],
    types: ["main_frame", "sub_frame", "xmlhttprequest"]
  },
  ["blocking"]
);

// Content script injection for fingerprint protection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!hasAccessToken || !privacySettings.fingerprintProtection) {
    return;
  }
  
  if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith('http')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/content.js']
    }).catch(err => console.error("Error injecting content script:", err));
  }
});

// Initialize state when background script loads
checkLocalStorage();
loadSettings();

// Load blocked trackers count from storage
chrome.storage.local.get(['blockedCount'], (result) => {
  if (result.blockedCount) {
    blockedTrackersCount = result.blockedCount;
  }
});

console.log("GreyLocker Privacy Shield background script loaded");
