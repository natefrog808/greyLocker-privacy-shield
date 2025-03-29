// GreyLocker Privacy Shield - Content Script
// This script runs in the context of the web page to provide enhanced privacy protections

// Check if user has NFT access
let hasAccess = false;
let enabledFeatures = {
  trackerBlocking: true,
  fingerprintProtection: true,
  httpsUpgrade: true,
  headerProtection: true
};

// Initialize content script
function initialize() {
  // Check access status
  chrome.runtime.sendMessage({ action: 'checkAccess' }, (response) => {
    hasAccess = response.hasAccess;
    
    if (hasAccess) {
      // Load feature settings
      chrome.storage.local.get(
        {
          trackerBlocking: true,
          fingerprintProtection: true,
          httpsUpgrade: true,
          headerProtection: true
        },
        (settings) => {
          enabledFeatures = settings;
          applyPrivacyProtections();
        }
      );
    }
  });
  
  // Listen for feature updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'featuresUpdated') {
      enabledFeatures = message.settings;
      applyPrivacyProtections();
    }
  });
}

// Apply privacy protections based on enabled features
function applyPrivacyProtections() {
  if (!hasAccess) return;
  
  if (enabledFeatures.trackerBlocking) {
    blockTrackers();
  }
  
  if (enabledFeatures.fingerprintProtection) {
    preventFingerprinting();
  }
  
  if (enabledFeatures.httpsUpgrade) {
    upgradeToHttps();
  }
}

// Block common tracking scripts
function blockTrackers() {
  // List of common tracking domains
  const trackingDomains = [
    'google-analytics.com',
    'analytics.google.com',
    'doubleclick.net',
    'facebook.net',
    'connect.facebook.net',
    'adnxs.com',
    'googletagmanager.com',
    'hotjar.com',
    'ads-twitter.com',
    'analytics.twitter.com',
    'pixel.facebook.com'
  ];
  
  // Find and block tracker scripts
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && trackingDomains.some(domain => src.includes(domain))) {
      script.remove();
    }
  });
  
  // Block tracker iframes
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    const src = iframe.getAttribute('src');
    if (src && trackingDomains.some(domain => src.includes(domain))) {
      iframe.remove();
    }
  });
  
  // Block tracker images/pixels
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && trackingDomains.some(domain => src.includes(domain))) {
      img.remove();
    }
  });
}

// Prevent browser fingerprinting
function preventFingerprinting() {
  // Override canvas fingerprinting
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  
  // Add subtle noise to canvas data
  HTMLCanvasElement.prototype.toDataURL = function() {
    const result = originalToDataURL.apply(this, arguments);
    
    // Only modify if it's likely being used for fingerprinting (small canvas)
    if (this.width < 50 && this.height < 50) {
      return modifyCanvasResult(result);
    }
    
    return result;
  };
  
  CanvasRenderingContext2D.prototype.getImageData = function() {
    const imageData = originalGetImageData.apply(this, arguments);
    
    // Only modify if it's likely being used for fingerprinting (small area)
    if (arguments[2] < 50 && arguments[3] < 50) {
      return modifyImageData(imageData);
    }
    
    return imageData;
  };
  
  // Override navigator properties to prevent fingerprinting
  if (navigator.__defineGetter__) {
    // Standardize navigator properties to common values
    navigator.__defineGetter__('userAgent', function() {
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36';
    });
    
    navigator.__defineGetter__('hardwareConcurrency', function() {
      return 4;
    });
    
    navigator.__defineGetter__('deviceMemory', function() {
      return 8;
    });
    
    navigator.__defineGetter__('platform', function() {
      return 'Win32';
    });
  }
}

// Helper function to add noise to canvas data
function modifyCanvasResult(dataURL) {
  try {
    // Very minor modification to add noise without breaking functionality
    const char = dataURL.charAt(Math.floor(dataURL.length * 0.75));
    const position = Math.floor(dataURL.length * 0.75);
    
    return dataURL.substring(0, position) + 
      (char.charCodeAt(0) === 90 ? 'B' : 'Z') + 
      dataURL.substring(position + 1);
  } catch (e) {
    return dataURL;
  }
}

// Helper function to add noise to image data
function modifyImageData(imageData) {
  try {
    // Only modify a couple of pixels slightly
    const data = imageData.data;
    const numberOfPixelsToModify = 2;
    
    for (let i = 0; i < numberOfPixelsToModify; i++) {
      const pixelIndex = Math.floor(Math.random() * data.length / 4) * 4;
      data[pixelIndex] = (data[pixelIndex] + 1) % 256;
    }
  } catch (e) {
    // If error, return unmodified data
  }
  
  return imageData;
}

// Upgrade HTTP to HTTPS
function upgradeToHttps() {
  if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
}

// Initialize the content script
initialize();
