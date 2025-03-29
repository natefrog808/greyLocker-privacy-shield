// Import necessary libraries 
// (Note: In the actual extension, you'll need to include these libraries in your project)

let hasAccessToken = false;
let walletAddress = null;
const NFT_MINT_ADDRESS = "YOUR_MEGAPIXEL_CORE_NFT_MINT_ADDRESS"; // Replace with actual NFT mint address
const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

// Initialize connection when extension is loaded
chrome.runtime.onInstalled.addListener(() => {
  checkLocalStorage();
});

// Check for stored wallet and access token
function checkLocalStorage() {
  chrome.storage.local.get(['walletAddress', 'hasAccess'], (result) => {
    if (result.walletAddress) {
      walletAddress = result.walletAddress;
      hasAccessToken = result.hasAccess || false;
      
      if (hasAccessToken) {
        console.log("Access already verified for wallet:", walletAddress);
      } else {
        console.log("Need to verify NFT ownership for wallet:", walletAddress);
      }
    } else {
      console.log("No wallet connected yet");
    }
  });
}

// Connect wallet function
async function connectWallet(walletType) {
  try {
    // For actual implementation, integrate with wallet adapters like Phantom, Solflare, etc.
    // This is a simplified version for demonstration
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
      
      // Store access status
      chrome.storage.local.set({ hasAccess: hasNFT });
      hasAccessToken = hasNFT;
      
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
    // In a real implementation, you would:
    // 1. Connect to Solana using web3.js
    // 2. Query for NFTs owned by the wallet
    // 3. Check if any match your specific NFT mint address
    
    // Simplified example:
    const connection = new solanaWeb3.Connection(SOLANA_RPC_URL);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new solanaWeb3.PublicKey(address),
      { programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );
    
    // Check if any token is our NFT
    for (const account of tokenAccounts.value) {
      const tokenInfo = account.account.data.parsed.info;
      const mintAddress = tokenInfo.mint;
      const amount = tokenInfo.tokenAmount.uiAmount;
      
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
    sendResponse({ hasAccess: hasAccessToken, wallet: walletAddress });
    return true;
  }
  
  if (message.action === "disconnect") {
    walletAddress = null;
    hasAccessToken = false;
    chrome.storage.local.remove(['walletAddress', 'hasAccess']);
    sendResponse({ disconnected: true });
    return true;
  }
});

// Privacy protection features
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Only apply privacy features for users with NFT access
    if (!hasAccessToken) return { requestHeaders: details.requestHeaders };
    
    let requestHeaders = details.requestHeaders;
    
    // Remove tracking headers
    requestHeaders = requestHeaders.filter(header => {
      const name = header.name.toLowerCase();
      return !name.includes('tracking') && 
             !name.includes('fingerprint') && 
             name !== 'referer';
    });
    
    // Add Do Not Track header
    requestHeaders.push({ name: "DNT", value: "1" });
    
    return { requestHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);
