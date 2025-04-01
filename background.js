/**
 * GreyLocker Privacy Shield - Background Service Worker
 * Main controller for privacy protection extension
 * Works with Chrome's Manifest V3 restrictions
 */

// Configuration
const VERSION = "1.0.0";
const DEBUG = false;

// NFT addresses for verification
const GLITCH_GANG_ADDRESS = "EpyXG6ZH98zKgex5GccGW6r2yeYfMuvkvG3cES5iP95k";
const QUANTUM_KEY_ADDRESS = "EALacBDs4xqu4xyKcp6gCkjtjU6psh2ykZj4Xv2Qqgwu";

// NFT access tracking
let userHasAccess = false;
let accessToken = null;
let accessChecked = false;
let nftCollection = null; // "glitchgang" or "quantumkey"
let nftTokenId = null;

// Stats tracking
let protectionStats = {
  trackersBlocked: 0,
  fingerprintsProtected: 0,
  httpsUpgrades: 0,
  sitesProtected: new Set()
};

// Initialize when service worker loads
async function initialize() {
  console.log("GreyLocker Privacy Shield initializing...");
  
  // Load settings
  await loadSettings();
  
  // Set up default rules for declarativeNetRequest as a fallback
  await setupNetworkRules();
  
  // Check if user has NFT access
  await checkNFTAccess();
  
  console.log("GreyLocker initialization complete");
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get([
      'settings', 
      'userHasAccess', 
      'accessToken',
      'nftCollection',
      'nftTokenId'
    ]);
    
    if (result.settings) {
      console.log("Loaded saved settings");
    } else {
      // Set default settings if none exist
      await saveDefaultSettings();
    }
    
    // Load access status
    if (result.userHasAccess !== undefined) {
      userHasAccess = result.userHasAccess;
      accessToken = result.accessToken || null;
      nftCollection = result.nftCollection || null;
      nftTokenId = result.nftTokenId || null;
      accessChecked = true;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

// Save default settings to storage
async function saveDefaultSettings() {
  const defaultSettings = {
    trackerBlocking: true,
    fingerprintProtection: true,
    httpsUpgrade: true,
    headerProtection: true,
    advancedProtection: {
      audioFingerprint: true,
      webglFingerprint: true,
      fontFingerprint: true,
      batteryFingerprint: true,
      screenResolution: true,
      mediaDevices: true,
      webrtcProtection: true,
      timingProtection: true,
      storageProtection: true
    }
  };
  
  try {
    await chrome.storage.local.set({ settings: defaultSettings });
    console.log("Saved default settings");
  } catch (error) {
    console.error("Error saving default settings:", error);
  }
}

// Set up network rules using declarativeNetRequest for Manifest V3 compatibility
async function setupNetworkRules() {
  try {
    // Get existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);
    
    // Remove existing rules
    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
      });
    }
    
    // Add new rules for basic protection
    // This serves as a fallback for the content script's more advanced protection
    const newRules = [
      // Block major tracking domains
      {
        id: 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          domains: ["<all_urls>"],
          urlFilter: "||google-analytics.com",
          resourceTypes: ["script", "xmlhttprequest", "image"]
        }
      },
      {
        id: 2,
        priority: 1,
        action: { type: "block" },
        condition: {
          domains: ["<all_urls>"],
          urlFilter: "||doubleclick.net",
          resourceTypes: ["script", "xmlhttprequest", "image", "sub_frame"]
        }
      },
      {
        id: 3,
        priority: 1,
        action: { type: "block" },
        condition: {
          domains: ["<all_urls>"],
          urlFilter: "||facebook.com/tr",
          resourceTypes: ["script", "xmlhttprequest", "image"]
        }
      },
      // Upgrade HTTP to HTTPS
      {
        id: 4,
        priority: 2,
        action: { type: "redirect", redirect: { transform: { scheme: "https" } } },
        condition: {
          urlFilter: "|http://",
          excludedInitiatorDomains: ["localhost", "127.0.0.1"],
          resourceTypes: ["main_frame"]
        }
      }
    ];
    
    // Add the new rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules
    });
    
    console.log("Network rules setup complete");
  } catch (error) {
    console.error("Error setting up network rules:", error);
  }
}

// Check NFT access for premium features
async function checkNFTAccess() {
  try {
    // If we've already checked, don't check again
    if (accessChecked) {
      return userHasAccess;
    }
    
    // Connect to Solana wallet (would use Phantom, Solflare, etc.)
    const walletConnected = await connectWallet();
    if (!walletConnected) {
      console.log("Wallet not connected - premium features disabled");
      userHasAccess = false;
      return false;
    }
    
    // Check if user owns Glitch Gang NFT
    const hasGlitchGang = await checkNFTOwnership(GLITCH_GANG_ADDRESS);
    if (hasGlitchGang) {
      userHasAccess = true;
      nftCollection = "glitchgang";
      accessToken = await generateAccessToken();
      
      // Save to storage
      await saveAccessStatus();
      
      console.log("Glitch Gang NFT verified - premium features enabled");
      return true;
    }
    
    // Check if user owns Quantum Key NFT
    const hasQuantumKey = await checkNFTOwnership(QUANTUM_KEY_ADDRESS);
    if (hasQuantumKey) {
      userHasAccess = true;
      nftCollection = "quantumkey";
      accessToken = await generateAccessToken();
      
      // Save to storage
      await saveAccessStatus();
      
      console.log("Quantum Key NFT verified - premium features enabled");
      return true;
    }
    
    // If we reach here, user doesn't have required NFTs
    userHasAccess = false;
    nftCollection = null;
    nftTokenId = null;
    accessToken = null;
    
    // Save to storage
    await saveAccessStatus();
    
    console.log("NFT verification failed - premium features disabled");
    return false;
  } catch (error) {
    console.error("Error checking NFT access:", error);
    userHasAccess = false;
    return false;
  }
}

// Connect to wallet
async function connectWallet() {
  try {
    // In a real app, this would connect to Phantom, Solflare, etc.
    // For demonstration, we'll assume connection is successful
    
    // Check for cached wallet address
    const result = await chrome.storage.local.get(['walletAddress']);
    
    if (result.walletAddress) {
      console.log("Using cached wallet connection");
      return true;
    }
    
    // In real implementation, we would:
    // 1. Detect if wallet extension is installed
    // 2. Prompt user to connect
    // 3. Store wallet address after approval
    
    // Simulate successful connection for demonstration
    await chrome.storage.local.set({
      walletAddress: "dummyWalletAddress123" // Would be actual address in real app
    });
    
    return true;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return false;
  }
}

// Check if user owns a specific NFT
async function checkNFTOwnership(collectionAddress) {
  try {
    // In a real app, this would query Solana blockchain
    // For demonstration, we'll use storage to simulate ownership
    
    const result = await chrome.storage.local.get(['ownedNFTs']);
    const ownedNFTs = result.ownedNFTs || {};
    
    // Check if this collection address is in owned NFTs
    if (ownedNFTs[collectionAddress]) {
      nftTokenId = ownedNFTs[collectionAddress].tokenId;
      return true;
    }
    
    // In real implementation, we would:
    // 1. Query Solana to check if connected wallet owns NFT from collection
    // 2. Verify on-chain that NFT is authentic
    // 3. Store token ID and mint address
    
    // For demo, always return false for now (user will need to verify in popup)
    return false;
  } catch (error) {
    console.error("Error checking NFT ownership:", error);
    return false;
  }
}

// Generate access token for verified ownership
async function generateAccessToken() {
  // Create a token that includes collection and timestamp
  const token = `${nftCollection}_${nftTokenId}_${Date.now()}`;
  return token;
}

// Save access status to storage
async function saveAccessStatus() {
  try {
    await chrome.storage.local.set({
      userHasAccess,
      accessToken,
      nftCollection,
      nftTokenId,
      accessChecked: true,
      accessTimestamp: Date.now()
    });
  } catch (error) {
    console.error("Error saving access status:", error);
  }
}

// React to messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (DEBUG) console.log("Message received:", message);

  // Handle different message types
  switch (message.action) {
    case 'checkAccess':
      handleAccessCheck(sendResponse);
      return true; // Keep sendResponse valid after function returns
      
    case 'getSettings':
      handleGetSettings(sendResponse);
      return true;
      
    case 'saveSettings':
      handleSaveSettings(message.settings, sendResponse);
      return true;
      
    case 'protectionStatus':
      handleProtectionStatus(message, sender, sendResponse);
      return true;
      
    case 'getStats':
      handleGetStats(sendResponse);
      return true;
      
    case 'resetStats':
      handleResetStats(sendResponse);
      return true;
      
    case 'verifyNFT':
      handleVerifyNFT(message, sendResponse);
      return true;
  }
});

// Handle access check request from content scripts
async function handleAccessCheck(sendResponse) {
  try {
    const hasAccess = await checkNFTAccess();
    sendResponse({ 
      hasAccess,
      nftCollection,
      requiresNFT: true,
      glitchGangAddress: GLITCH_GANG_ADDRESS,
      quantumKeyAddress: QUANTUM_KEY_ADDRESS
    });
  } catch (error) {
    console.error("Error handling access check:", error);
    sendResponse({ hasAccess: false, error: error.message });
  }
}

// Handle settings request from popup
async function handleGetSettings(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['settings']);
    sendResponse({ success: true, settings: result.settings });
  } catch (error) {
    console.error("Error handling get settings:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle settings update from popup
async function handleSaveSettings(newSettings, sendResponse) {
  try {
    await chrome.storage.local.set({ settings: newSettings });
    
    // Notify all tabs of the updated settings
    const tabs = await chrome.tabs.query({ active: true });
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'featuresUpdated',
          settings: newSettings
        });
      } catch (tabError) {
        // Ignore errors for tabs where content script isn't loaded
        console.log(`Could not update settings for tab ${tab.id}`);
      }
    }
    
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error handling save settings:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle protection status updates from content scripts
function handleProtectionStatus(message, sender, sendResponse) {
  try {
    if (!sender.tab) return sendResponse({ success: false });
    
    // Update stats
    if (message.trackerBlockCount) {
      protectionStats.trackersBlocked += message.trackerBlockCount;
    }
    
    if (message.url) {
      protectionStats.sitesProtected.add(new URL(message.url).hostname);
    }
    
    if (DEBUG) {
      console.log(`Updated stats - Total trackers blocked: ${protectionStats.trackersBlocked}`);
      console.log(`Sites protected: ${protectionStats.sitesProtected.size}`);
    }
    
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error handling protection status:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle stats request from popup
function handleGetStats(sendResponse) {
  try {
    const stats = {
      trackersBlocked: protectionStats.trackersBlocked,
      sitesProtected: protectionStats.sitesProtected.size,
      fingerprintsProtected: protectionStats.fingerprintsProtected,
      httpsUpgrades: protectionStats.httpsUpgrades
    };
    
    sendResponse({ success: true, stats });
  } catch (error) {
    console.error("Error handling get stats:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle stats reset request from popup
function handleResetStats(sendResponse) {
  try {
    protectionStats = {
      trackersBlocked: 0,
      fingerprintsProtected: 0,
      httpsUpgrades: 0,
      sitesProtected: new Set()
    };
    
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error handling reset stats:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle NFT verification request from popup
async function handleVerifyNFT(message, sendResponse) {
  try {
    // User is attempting to verify NFT ownership through popup
    if (message.action !== 'verifyNFT') {
      return sendResponse({ success: false, error: 'Invalid action' });
    }
    
    // Message should include collection and optional token ID
    const { collection, tokenId } = message;
    
    // Verify that collection is valid
    let collectionAddress;
    if (collection === 'glitchgang') {
      collectionAddress = GLITCH_GANG_ADDRESS;
    } else if (collection === 'quantumkey') {
      collectionAddress = QUANTUM_KEY_ADDRESS;
    } else {
      return sendResponse({ success: false, error: 'Invalid collection' });
    }
    
    // Connect wallet if not already connected
    const connected = await connectWallet();
    if (!connected) {
      return sendResponse({ 
        success: false, 
        error: 'Wallet connection failed. Please make sure you have a wallet extension installed.'
      });
    }
    
    // Simulate successful verification (in a real app would check blockchain)
    // Store NFT information in storage
    const ownedNFTs = {};
    ownedNFTs[collectionAddress] = {
      tokenId: tokenId || 'unknown',
      verified: true,
      timestamp: Date.now()
    };
    
    await chrome.storage.local.set({ ownedNFTs });
    
    // Update access status
    userHasAccess = true;
    nftCollection = collection;
    nftTokenId = tokenId || 'unknown';
    accessToken = await generateAccessToken();
    
    // Save to storage
    await saveAccessStatus();
    
    // Notify user of successful verification
    sendResponse({
      success: true,
      hasAccess: true,
      collection,
      tokenId: nftTokenId
    });
    
    console.log(`NFT verified: ${collection} - premium features enabled`);
  } catch (error) {
    console.error("Error verifying NFT:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Listen for installation and update events
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('GreyLocker Privacy Shield installed');
    
    // Set default settings on install
    await saveDefaultSettings();
    
    // Open onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding.html')
    });
  } else if (details.reason === 'update') {
    console.log(`GreyLocker updated from ${details.previousVersion} to ${VERSION}`);
  }
});

// Listen for tab navigation events to inject content script
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only inject on main frame navigation
  if (details.frameId !== 0) return;
  
  try {
    // Check if we should run script in this tab
    if (shouldSkipInjection(details.url)) return;
    
    // Dynamically inject our content script
    await chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ['content.js'],
      world: 'MAIN' // Ensures execution in the page's context
    });
    
    if (DEBUG) console.log(`Injected content script into tab ${details.tabId}`);
  } catch (error) {
    console.error(`Error injecting content script into tab ${details.tabId}:`, error);
  }
});

// Check if we should skip injection for certain URLs
function shouldSkipInjection(url) {
  try {
    // Skip chrome:// pages, extension pages, etc.
    if (!url || !url.startsWith('http')) return true;
    
    const parsedUrl = new URL(url);
    
    // Skip common development URLs
    if (parsedUrl.hostname === 'localhost' || 
        parsedUrl.hostname === '127.0.0.1' ||
        parsedUrl.hostname.endsWith('.local')) {
      return true;
    }
    
    // Also skip browser stores and Chrome settings
    const skippedDomains = [
      'chrome.google.com',
      'addons.mozilla.org',
      'microsoftedge.microsoft.com'
    ];
    
    return skippedDomains.some(domain => parsedUrl.hostname.includes(domain));
  } catch (error) {
    console.error("Error in shouldSkipInjection:", error);
    return true; // Skip on error
  }
}

// Initialize the service worker
initialize();
