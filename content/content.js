/**
 * GreyLocker Privacy Shield - Content Script
 * Advanced browser privacy protection powered by NFT verification
 * 
 * This script runs in the context of web pages to implement privacy protections
 * that cannot be handled by the background script alone. It focuses on
 * browser fingerprinting countermeasures and DOM-based tracking prevention.
 */

// Configuration
const VERSION = "1.0.0";
const FINGERPRINT_NOISE_AMOUNT = 2; // Number of pixel modifications
const COMMON_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0'
];
const FONT_BLOCKLIST = [
  "@font-face", // Block custom font declarations that can be used for identification
  "Andale Mono", "Arial", "Arial Black", "Arial Hebrew", "Arial MT", "Arial Narrow", "Arial Rounded MT Bold",
  "Avant Garde", "Baskerville", "Big Caslon", "Bitstream Vera Sans", "Calibri", "Cambria", "Cambria Math",
  "Century Gothic", "Consolas", "Copperplate", "Copperplate Gothic", "Courier", "Courier New",
  "Garamond", "Geneva", "Georgia", "Helvetica", "Helvetica Neue", "Impact",
  "Lucida Grande", "Lucida Sans", "Monaco", "Palatino", "Palatino Linotype",
  "Tahoma", "Times", "Times New Roman", "Trebuchet MS", "Verdana",
  // Add common fonts to prevent enumeration
];

// State variables
let hasAccess = false;
let enabledFeatures = {
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
let performanceDebug = false;
let protectionsApplied = false;
let originalFunctions = {}; // Store original functions for potential restoration
let trackerBlockCount = 0;

/**
 * Initialize content script
 */
function initialize() {
  console.log("GreyLocker Privacy Shield content script initializing...");
  
  // Check access status
  chrome.runtime.sendMessage({ action: 'checkAccess' }, (response) => {
    if (!response) {
      console.error("Failed to get access status from background script");
      return;
    }
    
    hasAccess = response.hasAccess;
    
    // Register mutation observer before checking features
    // This ensures we catch any dynamically added elements
    registerDynamicContentObserver();
    
    if (hasAccess) {
      console.log("NFT access verified, loading privacy features...");
      
      // Load feature settings
      chrome.storage.local.get(['settings'], (result) => {
        if (result.settings) {
          enabledFeatures = {
            ...enabledFeatures,
            ...result.settings,
            advancedProtection: {
              ...enabledFeatures.advancedProtection,
              ...(result.settings.advancedProtection || {})
            }
          };
        }
        
        // Apply all enabled protections
        applyPrivacyProtections();
        
        // Send stats to background script
        reportProtectionStatus();
      });
    } else {
      console.log("NFT verification required for privacy features");
    }
  });
  
  // Listen for feature updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'featuresUpdated' && message.settings) {
      console.log("Updating privacy features:", message.settings);
      
      // Update settings
      enabledFeatures = {
        ...enabledFeatures,
        ...message.settings,
        advancedProtection: {
          ...enabledFeatures.advancedProtection,
          ...(message.settings.advancedProtection || {})
        }
      };
      
      // Re-apply protections with new settings
      applyPrivacyProtections();
      
      // Confirm update
      sendResponse({ success: true });
    }
    
    if (message.action === 'checkProtectionStatus') {
      sendResponse({
        protectionsApplied,
        trackerBlockCount,
        url: window.location.href
      });
    }
    
    // For debugging - toggle performance logging
    if (message.action === 'toggleDebug') {
      performanceDebug = message.enabled;
      sendResponse({ debug: performanceDebug });
    }
  });
  
  // Apply initial protection in case our message to background doesn't get a response
  setTimeout(() => {
    if (!protectionsApplied && hasAccess) {
      console.log("Applying default protections after timeout");
      applyPrivacyProtections();
    }
  }, 1000);
}

/**
 * Performance timer for debugging
 */
function measurePerformance(name, fn) {
  if (!performanceDebug) {
    return fn();
  }
  
  console.time(`GreyLocker:${name}`);
  const result = fn();
  console.timeEnd(`GreyLocker:${name}`);
  return result;
}

/**
 * Apply all privacy protections based on enabled features
 */
function applyPrivacyProtections() {
  if (!hasAccess) {
    console.log("Access not verified, skipping privacy protections");
    return;
  }
  
  // Prevent multiple applications
  if (protectionsApplied) {
    console.log("Protections already applied, updating settings only");
    return;
  }
  
  measurePerformance('applyAllProtections', () => {
    console.log("Applying GreyLocker Privacy Shield protections");
    
    // Block trackers at the DOM level
    if (enabledFeatures.trackerBlocking) {
      blockTrackers();
    }
    
    // Apply fingerprint protections
    if (enabledFeatures.fingerprintProtection) {
      preventFingerprinting();
    }
    
    // Force HTTPS upgrade
    if (enabledFeatures.httpsUpgrade) {
      upgradeToHttps();
    }
    
    // Apply stealth mode
    applyStealthMode();
    
    // Mark as applied
    protectionsApplied = true;
    
    // Insert visual indicator for debugging (will be hidden in production)
    if (performanceDebug) {
      insertDebugIndicator();
    }
  });
}

/**
 * Report protection status to background script
 */
function reportProtectionStatus() {
  chrome.runtime.sendMessage({
    action: 'protectionStatus',
    url: window.location.href,
    timestamp: Date.now(),
    protectionsApplied,
    trackerBlockCount
  });
}

/**
 * Register observer for dynamically added content
 */
function registerDynamicContentObserver() {
  // Create a MutationObserver to watch for dynamically added tracking elements
  const observer = new MutationObserver((mutations) => {
    if (!hasAccess || !enabledFeatures.trackerBlocking) return;
    
    let trackersFound = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check for newly added scripts, iframes, or images
        mutation.addedNodes.forEach(node => {
          if (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME' || node.tagName === 'IMG') {
            const isTracker = checkAndBlockTracker(node);
            if (isTracker) trackersFound = true;
          }
          
          // Also check children of added nodes (like divs containing scripts)
          if (node.querySelectorAll) {
            const trackerElements = node.querySelectorAll('script[src], iframe[src], img[src]');
            trackerElements.forEach(element => {
              const isTracker = checkAndBlockTracker(element);
              if (isTracker) trackersFound = true;
            });
          }
        });
      }
    }
    
    // If we found and blocked trackers, report to the background script
    if (trackersFound) {
      reportProtectionStatus();
    }
  });
  
  // Start observing the document
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

/**
 * Check if an element is a tracker and block it if necessary
 */
function checkAndBlockTracker(element) {
  const trackingDomains = getTrackingDomains();
  const src = element.getAttribute('src');
  
  if (src && trackingDomains.some(domain => src.includes(domain))) {
    console.log(`Blocked dynamic tracker: ${src}`);
    element.remove();
    trackerBlockCount++;
    return true;
  }
  
  return false;
}

/**
 * Get consolidated list of tracking domains
 */
function getTrackingDomains() {
  // List of common tracking domains
  return [
    // Analytics and tracking services
    'google-analytics.com', 'analytics.google.com', 'googletagmanager.com',
    'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
    'analytics.tiktok.com', 'analytics.twitter.com', 'analytics.facebook.com',
    'connect.facebook.net', 'facebook.net', 'facebook.com/tr', 'pixel.facebook.com',
    'ads-twitter.com', 'static.ads-twitter.com', 'analytics.pinterest.com',
    'analytics.yahoo.com', 'sb.scorecardresearch.com', 'edge.quantserve.com',
    'pixel.quantserve.com', 'secure.quantserve.com', 'pixel.rubiconproject.com',
    
    // Ad networks
    'adnxs.com', 'advertising.com', 'adtech.com', 'adbrite.com',
    'adform.net', 'serving-sys.com', 'bidswitch.net', 'casalemedia.com',
    'contextweb.com', 'criteo.com', 'criteo.net', 'mediaplex.com',
    'openx.net', 'pubmatic.com', 'smartadserver.com', 'taboola.com',
    'outbrain.com', 'amazon-adsystem.com', 'adcolony.com', 'adsrvr.org',
    
    // Tracking/heatmap tools
    'hotjar.com', 'mouseflow.com', 'crazyegg.com', 'luckyorange.com',
    'fullstory.com', 'clicktale.net', 'inspectlet.com', 'mixpanel.com',
    'segment.com', 'segment.io', 'kissmetrics.com', 'amplitude.com',
    
    // Marketing automation
    'marketo.com', 'marketo.net', 'hubspot.com', 'hs-scripts.com',
    'pardot.com', 'mktoresp.com', 'eloqua.com', 'en25.com', 'omtrdc.net',
    
    // Mobile tracking
    'adjust.com', 'appsflyer.com', 'branch.io', 'kochava.com',
    'leanplum.com', 'apptimize.com', 'localytics.com',
    
    // Error tracking
    'sentry.io', 'bugsnag.com', 'errorception.com', 'loggly.com',
    
    // A/B testing
    'optimizely.com', 'optimizelyapis.com', 'vwo.com', 'split.io',
    'convert.com', 'unbounce.com'
  ];
}

/**
 * Block common tracking scripts and elements
 */
function blockTrackers() {
  measurePerformance('blockTrackers', () => {
    // Get list of tracking domains
    const trackingDomains = getTrackingDomains();
    
    // Find and block tracker scripts
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && trackingDomains.some(domain => src.includes(domain))) {
        console.log(`Blocked script: ${src}`);
        script.remove();
        trackerBlockCount++;
      }
    });
    
    // Block tracker iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.getAttribute('src');
      if (src && trackingDomains.some(domain => src.includes(domain))) {
        console.log(`Blocked iframe: ${src}`);
        iframe.remove();
        trackerBlockCount++;
      }
    });
    
    // Block tracker images/pixels
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && trackingDomains.some(domain => src.includes(domain))) {
        console.log(`Blocked image: ${src}`);
        img.remove();
        trackerBlockCount++;
      }
    });
    
    // Block tracking links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      
      // Handle click tracking links
      if (href && href.includes('utm_') && link.getAttribute('rel') !== 'noopener') {
        // Clean UTM parameters but keep the link functional
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const cleanUrl = cleanTrackingParameters(href);
          console.log(`Cleaned tracking link: ${href} -> ${cleanUrl}`);
          window.location.href = cleanUrl;
        });
      }
    });
    
    // Block inline scripts containing tracking keywords
    const inlineScripts = document.querySelectorAll('script:not([src])');
    const trackingKeywords = [
      'googletagmanager', 'ga(', '_gaq', 'fbq(', 'fbevents', 'twttr', 'hotjar',
      'amplitude', 'mixpanel', 'clicktale', 'luckyorange', 'optimizely'
    ];
    
    inlineScripts.forEach(script => {
      const content = script.textContent;
      if (trackingKeywords.some(keyword => content.includes(keyword))) {
        console.log(`Blocked inline tracking script with keyword`);
        script.textContent = ''; // Empty the script instead of removing to avoid layout shifts
        trackerBlockCount++;
      }
    });
  });
  
  // Block tracking in newly added elements
  blockDynamicTrackers();
}

/**
 * Clean tracking parameters from URLs
 */
function cleanTrackingParameters(url) {
  try {
    const parsedUrl = new URL(url);
    const params = new URLSearchParams(parsedUrl.search);
    
    // List of tracking parameters to remove
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'zanpid', 'dclid', '_hsenc', '_hsmi',
      'igshid', 'mc_cid', 'mc_eid', 'yclid', 'ref', 'referrer', 'source',
      'trk', 'trkCampaign', 'sc_campaign', 'hsa_cam', 'hsa_grp', 'hsa_ad',
      'hsa_src', 'hsa_acc', 'hsa_net', 'hsa_kw', 'hsa_mt', 'hsa_ver'
    ];
    
    // Remove tracking parameters
    trackingParams.forEach(param => {
      if (params.has(param)) {
        params.delete(param);
      }
    });
    
    // Rebuild the URL
    parsedUrl.search = params.toString();
    return parsedUrl.toString();
  } catch (e) {
    console.error("Error cleaning tracking parameters:", e);
    return url;
  }
}

/**
 * Set up special handling for dynamically added trackers
 */
function blockDynamicTrackers() {
  // Intercept appendChild and insertBefore methods to prevent trackers
  if (!originalFunctions.appendChild) {
    originalFunctions.appendChild = Element.prototype.appendChild;
    originalFunctions.insertBefore = Element.prototype.insertBefore;
    
    // Override appendChild
    Element.prototype.appendChild = function(node) {
      if (isTrackingNode(node)) {
        console.log("Prevented appendChild of tracking element");
        trackerBlockCount++;
        return node; // Return the node but don't actually append it
      }
      return originalFunctions.appendChild.call(this, node);
    };
    
    // Override insertBefore
    Element.prototype.insertBefore = function(node, referenceNode) {
      if (isTrackingNode(node)) {
        console.log("Prevented insertBefore of tracking element");
        trackerBlockCount++;
        return node; // Return the node but don't actually insert it
      }
      return originalFunctions.insertBefore.call(this, node, referenceNode);
    };
  }
}

/**
 * Check if a DOM node is a tracking element
 */
function isTrackingNode(node) {
  if (!node || !node.tagName) return false;
  
  const trackingDomains = getTrackingDomains();
  
  // Check scripts
  if (node.tagName === 'SCRIPT' && node.src) {
    return trackingDomains.some(domain => node.src.includes(domain));
  }
  
  // Check iframes
  if (node.tagName === 'IFRAME' && node.src) {
    return trackingDomains.some(domain => node.src.includes(domain));
  }
  
  // Check images
  if (node.tagName === 'IMG' && node.src) {
    return trackingDomains.some(domain => node.src.includes(domain));
  }
  
  return false;
}

/**
 * Comprehensive fingerprinting prevention
 */
function preventFingerprinting() {
  measurePerformance('preventFingerprinting', () => {
    // Canvas fingerprinting protection
    protectCanvas();
    
    // WebGL fingerprinting protection
    if (enabledFeatures.advancedProtection.webglFingerprint) {
      protectWebGL();
    }
    
    // Audio fingerprinting protection
    if (enabledFeatures.advancedProtection.audioFingerprint) {
      protectAudio();
    }
    
    // Font enumeration protection
    if (enabledFeatures.advancedProtection.fontFingerprint) {
      protectFonts();
    }
    
    // Battery API protection
    if (enabledFeatures.advancedProtection.batteryFingerprint) {
      protectBattery();
    }
    
    // Screen resolution randomization
    if (enabledFeatures.advancedProtection.screenResolution) {
      protectScreenResolution();
    }
    
    // Media devices protection
    if (enabledFeatures.advancedProtection.mediaDevices) {
      protectMediaDevices();
    }
    
    // WebRTC protection
    if (enabledFeatures.advancedProtection.webrtcProtection) {
      protectWebRTC();
    }
    
    // Timing attack protection
    if (enabledFeatures.advancedProtection.timingProtection) {
      protectTimingAttacks();
    }
    
    // Storage protection
    if (enabledFeatures.advancedProtection.storageProtection) {
      protectStorage();
    }
    
    // Navigator protection (core navigator properties)
    protectNavigator();
  });
}

/**
 * Protect against canvas fingerprinting
 */
function protectCanvas() {
  if (HTMLCanvasElement.prototype.toDataURL.toString().includes('GreyLockerGuarded')) {
    return; // Already protected
  }
  
  // Store original methods
  originalFunctions.toDataURL = HTMLCanvasElement.prototype.toDataURL;
  originalFunctions.getImageData = CanvasRenderingContext2D.prototype.getImageData;
  originalFunctions.getLineDash = CanvasRenderingContext2D.prototype.getLineDash;
  originalFunctions.measureText = CanvasRenderingContext2D.prototype.measureText;
  originalFunctions.isPointInPath = CanvasRenderingContext2D.prototype.isPointInPath;
  
  // Add noise to canvas data URL
  HTMLCanvasElement.prototype.toDataURL = function GreyLockerGuarded_toDataURL() {
    const result = originalFunctions.toDataURL.apply(this, arguments);
    
    // Check if this canvas is likely being used for fingerprinting
    const isLikelyFingerprint = this.width <= 50 && this.height <= 50;
    const isTextCanvas = this.width < 300 && this.width > 0 && this.height < 50 && this.height > 0;
    
    if (isLikelyFingerprint || isTextCanvas) {
      return modifyCanvasResult(result);
    }
    
    return result;
  };
  
  // Add noise to canvas image data
  CanvasRenderingContext2D.prototype.getImageData = function GreyLockerGuarded_getImageData() {
    const imageData = originalFunctions.getImageData.apply(this, arguments);
    
    // Only modify if it's likely being used for fingerprinting (small area)
    if (arguments[2] <= 50 && arguments[3] <= 50) {
      return modifyImageData(imageData);
    }
    
    return imageData;
  };
  
  // Add minor randomization to getLineDash
  CanvasRenderingContext2D.prototype.getLineDash = function GreyLockerGuarded_getLineDash() {
    const result = originalFunctions.getLineDash.apply(this, arguments);
    
    // Add very slight randomization
    if (result.length > 0) {
      const lastIndex = result.length - 1;
      result[lastIndex] = result[lastIndex] + (Math.random() < 0.5 ? 0.01 : -0.01);
    }
    
    return result;
  };
  
  // Add minor randomization to measureText
  CanvasRenderingContext2D.prototype.measureText = function GreyLockerGuarded_measureText(text) {
    const result = originalFunctions.measureText.apply(this, arguments);
    
    // Create a proxy to dynamically adjust width property access
    return new Proxy(result, {
      get: function(target, prop) {
        if (prop === 'width') {
          const originalWidth = target.width;
          // Add very small random noise
          return originalWidth + (Math.random() * 0.01 - 0.005);
        }
        return Reflect.get(target, prop);
      }
    });
  };
  
  // Add a slight randomization to isPointInPath
  CanvasRenderingContext2D.prototype.isPointInPath = function GreyLockerGuarded_isPointInPath() {
    // If the point is very close to the edge, add some randomization
    const result = originalFunctions.isPointInPath.apply(this, arguments);
    
    // Very rarely flip the result (0.1% chance) if it's likely a fingerprinting check
    if (Math.random() < 0.001) {
      return !result;
    }
    
    return result;
  };
}

/**
 * Add noise to canvas data URL
 */
function modifyCanvasResult(dataURL) {
  try {
    // Find a position near the end of the data (avoid header)
    const modificationPos = Math.floor(dataURL.length * 0.75);
    
    // Modify one or two characters in the data portion with minimal impact
    let modified = dataURL.substring(0, modificationPos);
    
    // Add a very subtle modification
    const char = dataURL.charAt(modificationPos);
    const charCode = char.charCodeAt(0);
    
    // We want to make a minimal change that won't corrupt the image
    // So we just shift the character code slightly
    const newChar = String.fromCharCode(charCode === 90 ? 89 : charCode + 1);
    
    modified += newChar + dataURL.substring(modificationPos + 1);
    
    return modified;
  } catch (e) {
    console.error("Error modifying canvas result:", e);
    return dataURL; // Return original on error
  }
}

/**
 * Add noise to canvas image data
 */
function modifyImageData(imageData) {
  try {
    // Only modify a few pixels slightly
    const data = imageData.data;
    const numberOfPixelsToModify = FINGERPRINT_NOISE_AMOUNT;
    
    for (let i = 0; i < numberOfPixelsToModify; i++) {
      // Calculate a random pixel index, ensuring it's on a pixel boundary (multiple of 4)
      const pixelIndex = Math.floor(Math.random() * (data.length / 4)) * 4;
      
      // Modify one of the RGBA values slightly
      const channelToModify = Math.floor(Math.random() * 3); // Don't modify alpha to avoid transparency issues
      data[pixelIndex + channelToModify] = (data[pixelIndex + channelToModify] + 1) % 256;
    }
  } catch (e) {
    console.error("Error modifying image data:", e);
  }
  
  return imageData;
}

/**
 * Protect against WebGL fingerprinting
 */
function protectWebGL() {
  if (!window.WebGLRenderingContext) return;
  
  // Store original methods
  if (WebGLRenderingContext.prototype.getParameter) {
    originalFunctions.getParameter = WebGLRenderingContext.prototype.getParameter;
    
    // Override getParameter to modify fingerprinting vectors
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      // Get the original result
      const result = originalFunctions.getParameter.call(this, parameter);
      
      // Modify specific fingerprinting parameters
      switch (parameter) {
        // Add slight randomization to vendor strings
        case this.VENDOR:
        case this.RENDERER:
          if (typeof result === 'string' && Math.random() < 0.1) {
            // Add invisible space character occasionally
            return result + '\u200B';
          }
          break;
          
        // Add slight noise to precision values
        case this.ALIASED_POINT_SIZE_RANGE:
        case this.ALIASED_LINE_WIDTH_RANGE:
          if (result instanceof Float32Array && result.length === 2) {
            // Clone the array to avoid modifying the original
            const modified = new Float32Array(result);
            // Add a tiny amount of noise to the second value
            modified[1] += (Math.random() * 0.01 - 0.005);
            return modified;
          }
          break;
      }
      
      return result;
    };
  }
  
  // Also protect WebGL2RenderingContext if available
  if (window.WebGL2RenderingContext && WebGL2RenderingContext.prototype.getParameter) {
    originalFunctions.getParameterWebGL2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = WebGLRenderingContext.prototype.getParameter;
  }
  
  // Protect against fingerprinting via WebGL extensions
  if (WebGLRenderingContext.prototype.getSupportedExtensions) {
    originalFunctions.getSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
    
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
      const extensions = originalFunctions.getSupportedExtensions.call(this);
      
      // Randomize the order of extensions
      if (extensions && extensions.length > 1) {
        // Only shuffle the order very rarely to maintain consistency in a session
        if (Math.random() < 0.05) {
          for (let i = extensions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [extensions[i], extensions[j]] = [extensions[j], extensions[i]];
          }
        }
      }
      
      return extensions;
    };
  }
  
  // Also protect WebGL2 extensions if available
  if (window.WebGL2RenderingContext && WebGL2RenderingContext.prototype.getSupportedExtensions) {
    originalFunctions.getSupportedExtensionsWebGL2 = WebGL2RenderingContext.prototype.getSupportedExtensions;
    WebGL2RenderingContext.prototype.getSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
  }
}

/**
 * Protect against Audio API fingerprinting
 */
function protectAudio() {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  
  // Protect the OfflineAudioContext and AudioContext
  [AudioContextConstructor, window.OfflineAudioContext, window.webkitOfflineAudioContext].forEach(constructor => {
    if (!constructor) return;
    
    // Store and modify getChannelData method
    if (constructor.prototype.getChannelData) {
      const originalGetChannelData = constructor.prototype.getChannelData;
      
      constructor.prototype.getChannelData = function(channel) {
        const data = originalGetChannelData.call(this, channel);
        
        // Don't modify if it's not likely a fingerprinting attempt
        if (data.length < 100) return data;
        
        // Create a copy to avoid modifying the original
        const copy = new Float32Array(data);
        
        // Add very small random noise to a few samples
        for (let i = 0; i < 3; i++) {
          const index = Math.floor(Math.random() * data.length);
          copy[index] += (Math.random() * 0.0001 - 0.00005);
        }
        
        return copy;
      };
    }
    
    // Protect createAnalyser
    if (constructor.prototype.createAnalyser) {
      const originalCreateAnalyser = constructor.prototype.createAnalyser;
      
      constructor.prototype.createAnalyser = function() {
        const analyser = originalCreateAnalyser.call(this);
        
        // Store original getFloatFrequencyData method
        const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
        
        // Override with our protected version
        analyser.getFloatFrequencyData = function(array) {
          originalGetFloatFrequencyData.call(this, array);
          
          // Add subtle noise to the frequency data
          if (array.length > 10) {
            // Modify a few random values with minimal noise
            for (let i = 0; i < 3; i++) {
              const index = Math.floor(Math.random() * array.length);
              array[index] += (Math.random() * 0.1 - 0.05);
            }
          }
        };
        
        return analyser;
      };
    }
  });
}

/**
 * Protect against font enumeration fingerprinting
 */
function protectFonts() {
  // Protect against font enumeration
  if (document.fonts && document.fonts.check) {
    originalFunctions.fontsCheck = document.fonts.check;
    
    document.fonts.check = function(font, text) {
      // Allow checking system fonts from our allowlist
      const fontFamily = extractFontFamily(font);
      
      if (fontFamily && FONT_BLOCKLIST.some(allowedFont => 
        fontFamily.toLowerCase().includes(allowedFont.toLowerCase())
      )) {
        return originalFunctions.fontsCheck.apply(this, arguments);
      }
      
      // For uncommon fonts, return a consistent but pseudorandom value
      // based on the font name to avoid detection of this protection
      const fontHash = simpleHash(fontFamily + navigator.userAgent);
      return (fontHash % 10) > 3; // 60% chance of returning true
    };
  }
  
  // Also protect the newer FontFaceSet.load method if available
  if (document.fonts && document.fonts.load) {
    originalFunctions.fontsLoad = document.fonts.load;
    
    document.fonts.load = function(font, text) {
      const fontFamily = extractFontFamily(font);
      
      if (fontFamily && FONT_BLOCKLIST.some(allowedFont => 
        fontFamily.toLowerCase().includes(allowedFont.toLowerCase())
      )) {
        return originalFunctions.fontsLoad.apply(this, arguments);
      }
      
      // Return a promise that resolves to an empty array
      return Promise.resolve([]);
    };
  }
  
  // Block new FontFace constructor that could be used to detect support
  if (window.FontFace) {
    const originalFontFace = window.FontFace;
    
    window.FontFace = function(family, source, descriptors) {
      // Check if this is likely used for fingerprinting
      if (source && source.length < 50 && family.length < 20) {
        console.log(`Intercepted FontFace creation: ${family}`);
        
        // Create a proxy that will always fail to load
        const fontFace = new originalFontFace(family, source, descriptors);
        
        // Override the load method
        const originalLoad = fontFace.load;
        fontFace.load = function() {
          console.log(`Blocked loading of font: ${family}`);
          return Promise.reject(new Error('Font loading blocked by privacy protection'));
        };
        
        return fontFace;
      }
      
      return new originalFontFace(family, source, descriptors);
    };
  }
}

/**
 * Extract font family from CSS font string
 */
function extractFontFamily(fontString) {
  if (!fontString || typeof fontString !== 'string') return '';
  
  // Try to extract the font family name from string like '12px "Font Name"'
  const match = fontString.match(/"([^"]+)"|'([^']+)'|([^,]+)(?=,|$)/);
  return match ? (match[1] || match[2] || match[3]).trim() : '';
}

/**
 * Simple hash function for consistent pseudorandom results
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Protect against Battery API fingerprinting
 */
function protectBattery() {
  if (!navigator.getBattery) return;
  
  // Store original getBattery method
  originalFunctions.getBattery = navigator.getBattery;
  
  // Replace with our protected version
  navigator.getBattery = function() {
    // Return a promise that resolves to a battery-like object with slightly randomized values
    return new Promise(resolve => {
      originalFunctions.getBattery.call(navigator).then(battery => {
        // Create a proxy to the real battery that adds small amounts of noise
        const batteryProxy = {
          charging: battery.charging,
          chargingTime: battery.chargingTime + Math.floor(Math.random() * 10),
          dischargingTime: battery.dischargingTime + Math.floor(Math.random() * 10),
          level: Math.min(1, Math.max(0, battery.level + (Math.random() * 0.02 - 0.01))),
          
          // Add event listeners to the proxy
          addEventListener: function(type, listener, options) {
            battery.addEventListener(type, event => {
              // Create a custom event with slightly modified values
              const customEvent = {
                type: event.type,
                target: batteryProxy,
                bubbles: event.bubbles,
                cancelable: event.cancelable
              };
              listener(customEvent);
            }, options);
          },
          
          removeEventListener: function(type, listener, options) {
            battery.removeEventListener(type, listener, options);
          }
        };
        
        resolve(batteryProxy);
      });
    });
  };
}

/**
 * Protect against screen resolution fingerprinting
 */
function protectScreenResolution() {
  // Modify screen properties
  const screenProxyHandler = {
    get: function(target, prop) {
      if (prop === 'width' || prop === 'availWidth') {
        return target[prop] + (Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? 1 : -1));
      }
      if (prop === 'height' || prop === 'availHeight') {
        return target[prop] + (Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? 1 : -1));
      }
      if (prop === 'colorDepth' || prop === 'pixelDepth') {
        return target[prop]; // Keep these accurate to avoid breaking websites
      }
      
      return target[prop];
    }
  };
  
  // Apply the proxy to screen object
  window.screen = new Proxy(window.screen, screenProxyHandler);
  
  // For browsers that support it, also proxy window.devicePixelRatio
  if ('devicePixelRatio' in window) {
    const originalDevicePixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
      get: function() {
        // Add a tiny amount of random noise
        return originalDevicePixelRatio + (Math.random() * 0.001 - 0.0005);
      }
    });
  }
  
  // If window.matchMedia is available, intercept screen-related media queries
  if (window.matchMedia) {
    originalFunctions.matchMedia = window.matchMedia;
    
    window.matchMedia = function(query) {
      const result = originalFunctions.matchMedia.call(window, query);
      
      // Add slight randomness to screen size media queries
      if (query.includes('width') || query.includes('height') || 
          query.includes('resolution') || query.includes('orientation')) {
        
        // Very small random chance of flipping the match if it's close to a boundary
        const pixelDiff = 5;
        
        // Extract numbers from the query
        const numbers = query.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          // Parse the largest number in the query
          const maxValue = Math.max(...numbers.map(Number));
          
          // If our screen size is within pixelDiff of the query boundary, small chance to flip
          const isClose = Math.abs(window.innerWidth - maxValue) < pixelDiff || 
                          Math.abs(window.innerHeight - maxValue) < pixelDiff;
          
          if (isClose && Math.random() < 0.1) {
            // Return a modified MediaQueryList-like object with flipped matches
            return {
              matches: !result.matches,
              media: result.media,
              
              // Handle event listeners
              addListener: function(listener) {
                // Just register the listener but don't call it
                result.addListener(listener);
              },
              
              removeListener: function(listener) {
                result.removeListener(listener);
              },
              
              addEventListener: function(type, listener, options) {
                result.addEventListener(type, listener, options);
              },
              
              removeEventListener: function(type, listener, options) {
                result.removeEventListener(type, listener, options);
              },
              
              onchange: null,
              dispatchEvent: function(event) {
                return result.dispatchEvent(event);
              }
            };
          }
        }
      }
      
      return result;
    };
  }
}

/**
 * Protect against WebRTC fingerprinting and IP leakage
 */
function protectWebRTC() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  
  // Store original getUserMedia method
  originalFunctions.getUserMedia = navigator.mediaDevices.getUserMedia;
  
  // Replace with our protected version
  navigator.mediaDevices.getUserMedia = function(constraints) {
    // Pass through if not requesting video (no risk of fingerprinting screen data)
    if (!constraints || !constraints.video) {
      return originalFunctions.getUserMedia.call(navigator.mediaDevices, constraints);
    }
    
    // Modify constraints to limit fingerprinting potential
    const modifiedConstraints = { ...constraints };
    
    // If video constraints exist and are requesting specific dimensions
    if (typeof modifiedConstraints.video === 'object') {
      // Normalize video constraints to reduce fingerprinting surface
      if (modifiedConstraints.video.width) {
        modifiedConstraints.video.width = { ideal: 1280 };
      }
      if (modifiedConstraints.video.height) {
        modifiedConstraints.video.height = { ideal: 720 };
      }
      
      // Remove framerate constraints which can be used for fingerprinting
      if (modifiedConstraints.video.frameRate) {
        delete modifiedConstraints.video.frameRate;
      }
      
      // Don't expose deviceId, which is a strong identifier
      if (modifiedConstraints.video.deviceId) {
        delete modifiedConstraints.video.deviceId;
      }
    }
    
    // Call original with modified constraints
    return originalFunctions.getUserMedia.call(navigator.mediaDevices, modifiedConstraints);
  };
  
  // Also protect RTCPeerConnection to prevent WebRTC IP leaks
  if (window.RTCPeerConnection) {
    const originalRTCPeerConnection = window.RTCPeerConnection;
    
    window.RTCPeerConnection = function(configuration) {
      // Modify configuration to prevent leaking local IPs
      if (configuration && configuration.iceServers) {
        // Force use of only TURN servers which don't leak local IPs
        configuration.iceServers = configuration.iceServers.filter(server => {
          return server.urls && (
            typeof server.urls === 'string' ? 
            server.urls.startsWith('turn:') : 
            server.urls.some(url => url.startsWith('turn:'))
          );
        });
      }
      
      // Use the modified configuration
      const pc = new originalRTCPeerConnection(configuration);
      
      // Prevent access to local IP addresses by modifying the candidate event
      const originalAddEventListener = pc.addEventListener;
      pc.addEventListener = function(type, listener, options) {
        if (type === 'icecandidate') {
          const wrappedListener = function(event) {
            // Modify the event to remove candidates that would leak local IPs
            if (event.candidate) {
              const candidate = event.candidate;
              
              // Filter out local network candidates
              if (candidate.candidate && (
                candidate.candidate.includes('192.168.') || 
                candidate.candidate.includes('10.0.') ||
                candidate.candidate.includes('172.16.') ||
                candidate.candidate.includes('172.17.') ||
                candidate.candidate.includes('172.18.') ||
                candidate.candidate.includes('172.19.') ||
                candidate.candidate.includes('172.20.') ||
                candidate.candidate.includes('172.21.') ||
                candidate.candidate.includes('172.22.') ||
                candidate.candidate.includes('172.23.') ||
                candidate.candidate.includes('172.24.') ||
                candidate.candidate.includes('172.25.') ||
                candidate.candidate.includes('172.26.') ||
                candidate.candidate.includes('172.27.') ||
                candidate.candidate.includes('172.28.') ||
                candidate.candidate.includes('172.29.') ||
                candidate.candidate.includes('172.30.') ||
                candidate.candidate.includes('172.31.') ||
                candidate.candidate.includes('127.0.0.') ||
                candidate.candidate.includes('::1')
              )) {
                // Create a modified event with null candidate
                const modifiedEvent = new Event('icecandidate');
                modifiedEvent.candidate = null;
                listener(modifiedEvent);
                return;
              }
            }
            
            // Pass through non-local candidates
            listener(event);
          };
          
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        
        // Pass through other event types unchanged
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      return pc;
    };
  }
}

/**
 * Protect against media device fingerprinting
 */
function protectMediaDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  
  // Store original method
  originalFunctions.enumerateDevices = navigator.mediaDevices.enumerateDevices;
  
  // Override with protected version
  navigator.mediaDevices.enumerateDevices = function() {
    return originalFunctions.enumerateDevices.call(navigator.mediaDevices)
      .then(devices => {
        // Return devices with random, but consistent IDs
        return devices.map(device => {
          return {
            kind: device.kind,
            label: device.label,
            groupId: generatePseudoRandomId(device.groupId + navigator.userAgent, 32),
            deviceId: generatePseudoRandomId(device.deviceId + navigator.userAgent, 64),
            toJSON: function() {
              return {
                kind: this.kind,
                label: this.label,
                groupId: this.groupId,
                deviceId: this.deviceId
              };
            }
          };
        });
      });
  };
}

/**
 * Generate a pseudo-random ID based on input
 */
function generatePseudoRandomId(input, length) {
  // Create a deterministic but unique-looking ID
  const hash = simpleHash(input);
  let id = '';
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 0; i < length; i++) {
    // Use the hash to generate a character index
    const index = (hash + i * 17) % chars.length;
    id += chars.charAt(index);
  }
  
  return id;
}

/**
 * Protect against timing attacks
 */
function protectTimingAttacks() {
  // Protect Date.now and performance.now
  if (window.performance && window.performance.now) {
    const originalNow = window.performance.now;
    
    window.performance.now = function() {
      const realPreciseTime = originalNow.call(window.performance);
      // Reduce precision to protect against timing attacks
      return Math.floor(realPreciseTime * 10) / 10;
    };
  }
  
  // Also protect Date.now
  if (Date.now) {
    const originalDateNow = Date.now;
    
    Date.now = function() {
      const realTime = originalDateNow.call(Date);
      // Reduce precision to protect against timing attacks
      return Math.floor(realTime / 10) * 10;
    };
  }
}

/**
 * Protect against storage-based fingerprinting
 */
function protectStorage() {
  // Intercept localStorage and sessionStorage
  const createStorageProxy = function(storageType) {
    const originalStorage = window[storageType];
    
    // Create a proxy to monitor and potentially block storage operations
    window[storageType] = new Proxy(originalStorage, {
      get: function(target, prop) {
        // Handle special methods specifically used for fingerprinting
        if (prop === 'setItem' || prop === 'getItem') {
          return function(key, value) {
            // Check if this is likely a fingerprinting attempt
            if (isFingerprintingKey(key)) {
              console.log(`Blocked ${storageType} ${prop} for suspected fingerprinting key: ${key}`);
              
              // For getItem, return null as if the item doesn't exist
              if (prop === 'getItem') {
                return null;
              }
              
              // For setItem, return undefined (normal behavior) but don't actually set
              return undefined;
            }
            
            // Allow normal storage for non-fingerprinting keys
            return target[prop].apply(target, arguments);
          };
        }
        
        // For other methods/properties, pass through to the original
        return target[prop];
      }
    });
  };
  
  // Apply protection to both storage types
  createStorageProxy('localStorage');
  createStorageProxy('sessionStorage');
  
  // If IndexedDB is available, protect that too
  if (window.indexedDB) {
    originalFunctions.indexedDBOpen = window.indexedDB.open;
    
    window.indexedDB.open = function(name, version) {
      // Block known fingerprinting database names
      if (isFingerprintingKey(name)) {
        console.log(`Blocked IndexedDB open for suspected fingerprinting database: ${name}`);
        
        // Return a fake request that fires an error event
        const fakeRequest = {
          error: new Error('Security Error'),
          readyState: 'pending',
          result: null,
          transaction: null,
          source: null,
          onsuccess: null,
          onerror: null,
          onblocked: null,
          onupgradeneeded: null,
          
          addEventListener: function(type, listener) {
            if (type === 'error' && typeof listener === 'function') {
              // Schedule the error event
              setTimeout(() => {
                const errorEvent = new Event('error');
                errorEvent.target = fakeRequest;
                listener(errorEvent);
                
                // Also trigger onerror if it was set
                if (typeof this.onerror === 'function') {
                  this.onerror(errorEvent);
                }
              }, 0);
            }
          },
          
          removeEventListener: function() {}
        };
        
        return fakeRequest;
      }
      
      // Allow non-fingerprinting databases
      return originalFunctions.indexedDBOpen.apply(window.indexedDB, arguments);
    };
  }
}

/**
 * Check if a key is likely used for fingerprinting
 */
function isFingerprintingKey(key) {
  if (!key || typeof key !== 'string') return false;
  
  const fingerprintingKeywords = [
    'fingerprint', 'deviceid', 'device-id', 'clientid', 'client-id', 'userid', 'user-id',
    'visitorid', 'visitor-id', 'canvas', 'webgl', 'machine', 'browser', 'ident',
    'fpid', 'fp-id', 'uaid', 'ua-id', 'tracking', 'track', 'analytics', 'visitor'
  ];
  
  // Check if key contains any fingerprinting keywords
  const keyLower = key.toLowerCase();
  return fingerprintingKeywords.some(keyword => keyLower.includes(keyword));
}

/**
 * Protect core navigator properties
 */
function protectNavigator() {
  if (!navigator.__defineGetter__) return;
  
  // Create a proxy for navigator to modify fingerprinting properties
  const createNavigatorProxy = () => {
    // Store selected navigator property values
    const storedValues = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: navigator.deviceMemory || 8,
      language: navigator.language,
      languages: navigator.languages,
      vendor: navigator.vendor,
      appVersion: navigator.appVersion,
      doNotTrack: "1" // Always enable DNT
    };
    
    // Protect basic fingerprinting properties
    navigator.__defineGetter__('userAgent', function() {
      // Use a common user agent from our list
      return COMMON_USER_AGENTS[0];
    });
    
    navigator.__defineGetter__('appVersion', function() {
      return storedValues.appVersion;
    });
    
    navigator.__defineGetter__('platform', function() {
      return "Win32"; // Standardized platform
    });
    
    navigator.__defineGetter__('hardwareConcurrency', function() {
      return storedValues.hardwareConcurrency;
    });
    
    navigator.__defineGetter__('deviceMemory', function() {
      return storedValues.deviceMemory;
    });
    
    navigator.__defineGetter__('doNotTrack', function() {
      return "1"; // Always enabled
    });
    
    // If present, modify plugins and mimeTypes to be empty
    if (navigator.plugins) {
      navigator.__defineGetter__('plugins', function() {
        // Return an empty PluginArray-like object
        return {
          length: 0,
          item: function() { return null; },
          namedItem: function() { return null; },
          refresh: function() {},
          [Symbol.iterator]: function* () {}
        };
      });
    }
    
    if (navigator.mimeTypes) {
      navigator.__defineGetter__('mimeTypes', function() {
        // Return an empty MimeTypeArray-like object
        return {
          length: 0,
          item: function() { return null; },
          namedItem: function() { return null; },
          [Symbol.iterator]: function* () {}
        };
      });
    }
    
    // Protect connection information
    if (navigator.connection) {
      navigator.__defineGetter__('connection', function() {
        // Return a standardized connection object 
        return {
          effectiveType: '4g', // Standard connection type
          rtt: 50, // Reasonable RTT value
          downlink: 10, // Reasonable downlink value
          saveData: false
        };
      });
    }
  };
  
  createNavigatorProxy();
}

/**
 * Apply stealth mode - additional advanced protections
 */
function applyStealthMode() {
  // Block Chrome-specific features that can be used for fingerprinting
  if (window.chrome) {
    // Create an empty proxy for chrome API objects
    const createEmptyProxy = (name) => {
      return new Proxy({}, {
        get: function(target, name) {
          if (typeof target[name] === 'undefined') {
            target[name] = typeof name === 'string' && name !== 'then' ? 
              createEmptyProxy(`${name}`) : undefined;
          }
          return target[name];
        }
      });
    };
    
    // Replace fingerprinting-heavy chrome APIs with empty proxies
    window.chrome.csi = createEmptyProxy('csi');
    window.chrome.loadTimes = createEmptyProxy('loadTimes');
    
    // Remove various Chrome fingerprinting vectors
    if (window.chrome.runtime) {
      window.chrome.runtime = createEmptyProxy('runtime');
    }
  }
  
  // Stealth against various detection methods
  const methods = [
    // Stealth against iframe detection
    () => {
      // Make it harder to detect if this is running in an iframe
      if (window !== window.top) {
        // Make window.frameElement return null as if from different origin
        Object.defineProperty(window, 'frameElement', {
          get: () => null
        });
      }
    },
    
    // Stealth against automation detection
    () => {
      // Remove Automation object if present
      if (window.Notification && window.Notification.permission) {
        window.Notification.permission = "default";
      }
      
      // Remove webdriver flag
      if (navigator.webdriver === true) {
        navigator.__defineGetter__('webdriver', function() {
          return undefined;
        });
      }
    },
    
    // Hide extension from feature detection
    () => {
      const actualHasOwnProperty = Object.prototype.hasOwnProperty;
      Object.prototype.hasOwnProperty = function(property) {
        // Make it harder to detect if this is running in a Chrome extension
        if (property === 'runtime' || 
            property === 'webstore' ||
            property === '_shieldInitialized' ||
            property === '_greyLockerShield') {
          return false;
        }
        return actualHasOwnProperty.call(this, property);
      };
    }
  ];
  
  // Apply all stealth methods
  methods.forEach(method => {
    try {
      method();
    } catch (e) {
      console.error('Error applying stealth method:', e);
    }
  });
}

/**
 * Upgrade HTTP connections to HTTPS
 */
function upgradeToHttps() {
  if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
    // Ignore common local development hosts
    if (!window.location.hostname.includes('127.0.0.1') && 
        !window.location.hostname.includes('::1') &&
        !window.location.hostname.includes('.local')) {
      window.location.href = window.location.href.replace('http:', 'https:');
    }
  }
}

/**
 * Insert a visual indicator for debugging
 */
function insertDebugIndicator() {
  // Create a small indicator that's only visible in debug mode
  const indicator = document.createElement('div');
  
  indicator.style.position = 'fixed';
  indicator.style.bottom = '5px';
  indicator.style.right = '5px';
  indicator.style.width = '10px';
  indicator.style.height = '10px';
  indicator.style.borderRadius = '50%';
  indicator.style.backgroundColor = '#33ff99';
  indicator.style.boxShadow = '0 0 5px #33ff99';
  indicator.style.zIndex = '999999999';
  indicator.style.opacity = '0.7';
  
  indicator.title = `GreyLocker Shield Active - ${trackerBlockCount} trackers blocked`;
  
  document.body.appendChild(indicator);
}

// Initialize the content script
initialize();
