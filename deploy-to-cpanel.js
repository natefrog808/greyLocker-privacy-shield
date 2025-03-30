/**
 * GreyLocker Privacy Shield - cPanel Deployment Script
 * 
 * This script packages the extension and uploads it to a cPanel hosting account
 * using the cPanel API. It requires Node.js and the appropriate credentials.
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// cPanel configuration
const CPANEL_USERNAME = process.env.CPANEL_USERNAME;
const CPANEL_PASSWORD = process.env.CPANEL_PASSWORD;
const CPANEL_DOMAIN = process.env.CPANEL_DOMAIN || 'degenai.club';
const CPANEL_PORT = process.env.CPANEL_PORT || 2083;
const UPLOAD_PATH = process.env.UPLOAD_PATH || '/public_html/extensions/greylocker';

// Paths
const DIST_DIR = path.join(__dirname, 'dist');
const ZIP_PATH = path.join(__dirname, 'greylocker-privacy-shield.zip');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Zip the extension files
 */
async function zipExtension() {
  return new Promise((resolve, reject) => {
    console.log('Creating ZIP archive...');
    
    // Create dist directory if it doesn't exist
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true });
    }
    
    // Create zip file
    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`Archive created: ${archive.pointer()} total bytes`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
   // Add files to the archive
archive.file('manifest.json', { name: 'manifest.json' });
archive.file('background.js', { name: 'background.js' });
archive.directory('popup/', 'popup');
archive.directory('content/', 'content');
archive.directory('lib/', 'lib');
archive.directory('assets/', 'assets');
archive.directory('dashboard/', 'dashboard'); // Add the dashboard directory
    
    archive.finalize();
  });
}

/**
 * Upload the ZIP file to cPanel
 */
async function uploadToCPanel() {
  if (!CPANEL_USERNAME || !CPANEL_PASSWORD) {
    console.error('Error: cPanel credentials not found in environment variables');
    console.log('Please create a .env file with CPANEL_USERNAME and CPANEL_PASSWORD');
    process.exit(1);
  }
  
  console.log(`Uploading to cPanel (${CPANEL_DOMAIN})...`);
  
  // Create form data
  const form = new FormData();
  form.append('file', fs.createReadStream(ZIP_PATH));
  
  try {
    // Authenticate and upload
    const response = await axios.post(
      `https://${CPANEL_DOMAIN}:${CPANEL_PORT}/execute/Fileman/upload_files`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Basic ${Buffer.from(`${CPANEL_USERNAME}:${CPANEL_PASSWORD}`).toString('base64')}`
        },
        params: {
          dir: UPLOAD_PATH
        }
      }
    );
    
    if (response.data && response.data.status === 1) {
      console.log('Upload successful!');
      console.log(`Extension is now available at: https://${CPANEL_DOMAIN}${UPLOAD_PATH}/greylocker-privacy-shield.zip`);
    } else {
      console.error('Upload failed:', response.data);
    }
  } catch (error) {
    console.error('Error uploading to cPanel:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Create a simple HTML landing page
 */
async function createLandingPage() {
  const landingPagePath = path.join(DIST_DIR, 'install.html');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Install GreyLocker Privacy Shield</title>
  <style>
    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      background-color: #0d1117;
      color: #e6e6e6;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      flex-grow: 1;
    }
    
    header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .logo {
      margin-bottom: 1rem;
    }
    
    h1 {
      background: linear-gradient(90deg, #00f2ff, #33ff99);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 2.5rem;
    }
    
    .card {
      background-color: #171b26;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .steps {
      margin-top: 2rem;
    }
    
    .step {
      margin-bottom: 1.5rem;
      display: flex;
      align-items: flex-start;
    }
    
    .step-number {
      background-color: #00f2ff;
      color: #0d1117;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 1rem;
      flex-shrink: 0;
    }
    
    .step-content h3 {
      margin-top: 0;
      color: #00f2ff;
    }
    
    .download-btn {
      background: linear-gradient(90deg, #00f2ff, #33ff99);
      color: #0d1117;
      border: none;
      padding: 1rem 2rem;
      font-size: 1.25rem;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      display: block;
      margin: 2rem auto;
      text-align: center;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .download-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 12px rgba(0, 242, 255, 0.3);
    }
    
    footer {
      text-align: center;
      padding: 1.5rem;
      color: #a0a0a0;
      font-size: 0.875rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    code {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Fira Code', monospace;
    }
    
    .nft-info {
      margin-top: 2rem;
      padding: 1rem;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">
        <img src="assets/icons/icon128.png" alt="GreyLocker Logo" width="80">
      </div>
      <h1>GreyLocker Privacy Shield</h1>
      <p>A privacy-focused browser extension for Megapixel Core NFT holders</p>
    </header>
    
    <div class="card">
      <h2>About GreyLocker Privacy Shield</h2>
      <p>
        GreyLocker Privacy Shield is an exclusive browser extension that provides enhanced privacy features 
        for Megapixel Core NFT holders. By connecting your Solana wallet, the extension verifies your NFT 
        ownership and unlocks powerful privacy tools.
      </p>
      
      <div class="nft-info">
        <p>You must own a Megapixel Core NFT to use the full features of this extension.</p>
        <a href="https://marketplace.solana.com" style="color: #00f2ff; text-decoration: none;">
          Get a Megapixel Core NFT
        </a>
      </div>
    </div>
    
    <div class="card">
      <h2>Installation Guide</h2>
      <p>Follow these steps to install the GreyLocker Privacy Shield extension:</p>
      
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Download the Extension</h3>
            <p>Click the button below to download the GreyLocker Privacy Shield extension package.</p>
          </div>
        </div>
        
        <a href="greylocker-privacy-shield.zip" class="download-btn">
          Download Extension
        </a>
        
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Unzip the Package</h3>
            <p>Extract the downloaded ZIP file to a folder on your computer.</p>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Load in Chrome</h3>
            <p>
              Open Chrome and navigate to <code>chrome://extensions/</code><br>
              Enable "Developer mode" using the toggle in the top-right corner.<br>
              Click "Load unpacked" and select the extracted folder.
            </p>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Connect Your Wallet</h3>
            <p>
              Click on the GreyLocker icon in your browser toolbar.<br>
              Connect your Solana wallet that contains your Megapixel Core NFT.<br>
              The extension will verify your NFT ownership and unlock all features.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <footer>
    <p>&copy; 2025 GreyLocker Team | All Rights Reserved</p>
  </footer>
</body>
</html>`;

  fs.writeFileSync(landingPagePath, html);
  console.log(`Landing page created at: ${landingPagePath}`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Ask for confirmation
    rl.question('This will package and deploy the extension to cPanel. Continue? (y/n) ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await zipExtension();
        await createLandingPage();
        await uploadToCPanel();
      } else {
        console.log('Deployment cancelled.');
      }
      rl.close();
    });
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
}

// Run the script
main();
