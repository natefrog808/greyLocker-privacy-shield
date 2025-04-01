## GreyLocker Privacy Shield - Complete Project Structure

```
GreyLocker-Privacy-Shield/
├── README.md                  # Project documentation with cyberpunk aesthetic
├── LICENSE                    # MIT License
├── CONTRIBUTING.md            # Guidelines for contributors
├── .gitignore                 # Git ignore file
├── .env.example               # Example environment variables
├── package.json               # NPM package configuration
├── manifest.json              # Extension manifest
├── background.js              # Background script for privacy protection
├── deploy-to-cpanel.js        # cPanel deployment script
├── generate-icons.js          # Icon generation script
├── greylocker-icon.svg        # Source SVG for extension icons
│
├── assets/                    # Static assets
│   ├── icons/                 # Extension icons
│   │   ├── icon16.svg         # 16x16 icon
│   │   ├── icon48.svg         # 48x48 icon
│   │   └── icon128.svg        # 128x128 icon
│   │
│   └── wallets/               # Wallet icons
│       ├── phantom.svg        # Phantom wallet logo
│       └── solflare.svg       # Solflare wallet logo
│
├── popup/                     # Extension popup UI
│   ├── popup.html             # Popup HTML structure
│   ├── popup.css              # Popup styling with cyberpunk theme
│   └── popup.js               # Popup functionality
│
├── content/                   # Content scripts
│   └── content.js             # Advanced fingerprinting protection
│
└── lib/                       # External libraries
    ├── web3.min.js            # Web3 library for blockchain interactions
    └── solana-web3.js         # Solana web3 library for NFT verification
```

### Additional Directories to Create

During the build process, the following directories will be created:

```
GreyLocker-Privacy-Shield/
├── dist/                      # Built extension files
└── node_modules/              # NPM dependencies
```

### Getting Started

1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Run `npm run build:icons` to generate extension icons
4. Load the extension in your browser:
   - Chrome/Brave/Edge: Navigate to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the project folder
   - Firefox: Navigate to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the `manifest.json` file

5. For deployment to your cPanel hosting:
   - Create a `.env` file based on `.env.example` with your cPanel credentials
   - Run `npm run build` to create the distribution files
   - Run `npm run zip` to package the extension
   - Run `npm run deploy` to upload to your cPanel server

### Core Functionality Overview

1. **Background Script (background.js)**
   - NFT verification logic
   - Tracker blocking
   - Header protection
   - HTTPS upgrade
   - Connection to Solana blockchain

2. **Content Script (content.js)**
   - 12-vector fingerprinting protection
   - Canvas/WebGL shielding
   - Audio fingerprinting defense
   - Font enumeration blocking
   - WebRTC leak prevention
   - Storage protection

3. **Popup Interface (popup/)**
   - NFT verification status
   - Privacy shield toggles
   - Advanced configuration options
   - Cyberpunk-themed UI

4. **Libraries (lib/)**
   - Web3 integration
   - Solana wallet connections
   - NFT ownership verification

### Customization

- **NFT Contract**: Update `NFT_MINT_ADDRESS` in `background.js` with your NFT contract address
- **Branding**: Modify the icons and CSS to match your brand
- **Features**: Add or remove privacy protection features in `content.js` and `background.js`

### Extensions and Enhancements

The modular structure allows for easy additions:

1. **Analytics Dashboard**: Add a statistics page to visualize blocked trackers
2. **Custom Rules**: Implement a rule editor for advanced users
3. **Multi-NFT Support**: Extend verification to support multiple NFT collections
4. **Mobile Support**: Adapt for mobile browsers with wallet support

### Troubleshooting

- **Wallet Connection Issues**: Check browser console for errors
- **Broken Websites**: Add site-specific exceptions in content.js
- **NFT Verification Failures**: Verify RPC endpoints and NFT contract address
- **Deployment Errors**: Check cPanel credentials and file paths

For additional support, join our Discord or open an issue on GitHub.
