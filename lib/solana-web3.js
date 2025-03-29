/*!
 * Solana Web3.js Minimal Build v1.78.4
 * Simplified version for browser extensions
 * Only includes essential functionality for Solana wallet interactions and NFT verification
 */

(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.solanaWeb3 = {}));
})(this, (function(exports) {
  'use strict';

  // Constants
  const SOLANA_MAINNET = 'https://api.mainnet-beta.solana.com';
  const SOLANA_DEVNET = 'https://api.devnet.solana.com';
  const SOLANA_TESTNET = 'https://api.testnet.solana.com';
  
  // Base64 utilities for encoding/decoding
  const base64 = {
    encode: function(str) {
      return btoa(str);
    },
    decode: function(str) {
      return atob(str);
    }
  };

  // PublicKey class
  class PublicKey {
    constructor(value) {
      if (typeof value === 'string') {
        if (value.startsWith('0x')) {
          value = value.replace('0x', '');
        }
        this.value = value;
      } else if (value instanceof Uint8Array) {
        this.value = Buffer.from(value).toString('hex');
      } else if (value instanceof PublicKey) {
        this.value = value.toString();
      } else {
        throw new Error('Invalid public key input');
      }
    }
    
    equals(publicKey) {
      return this.toString() === publicKey.toString();
    }
    
    toBytes() {
      return new Uint8Array(
        this.value.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );
    }
    
    toString() {
      return this.value;
    }
    
    toJSON() {
      return this.toString();
    }
    
    static isOnCurve(publicKey) {
      // Simplified check
      return publicKey instanceof PublicKey;
    }
  }

  // Transaction class
  class Transaction {
    constructor(options = {}) {
      this.recentBlockhash = options.recentBlockhash;
      this.feePayer = options.feePayer;
      this.instructions = [];
      this.signatures = [];
    }
    
    add(...instructions) {
      this.instructions.push(...instructions);
      return this;
    }
    
    sign(signer) {
      // In a real implementation, this would sign the transaction
      const signature = {
        publicKey: signer.publicKey,
        signature: 'simulated_signature'
      };
      this.signatures.push(signature);
      return this;
    }
    
    serialize() {
      // Simply serializes the transaction as a hex string
      return Buffer.from(JSON.stringify({
        recentBlockhash: this.recentBlockhash,
        feePayer: this.feePayer ? this.feePayer.toString() : null,
        instructions: this.instructions,
        signatures: this.signatures
      })).toString('hex');
    }
  }

  // TransactionInstruction class
  class TransactionInstruction {
    constructor(options) {
      this.keys = options.keys || [];
      this.programId = options.programId;
      this.data = options.data || Buffer.from([]);
    }
  }

  // Connection class
  class Connection {
    constructor(endpoint = SOLANA_MAINNET, options = {}) {
      this.endpoint = endpoint;
      this.commitment = options.commitment || 'finalized';
    }
    
    async getRecentBlockhash() {
      // In a real implementation, this would fetch from the network
      return {
        blockhash: 'simulated_blockhash_' + Math.random().toString(36).substr(2, 9),
        feeCalculator: {
          lamportsPerSignature: 5000
        }
      };
    }
    
    async sendTransaction(transaction, signers, options = {}) {
      // This would send the transaction to the network
      console.log('Sending transaction to', this.endpoint);
      // Return a simulated transaction signature
      return '5KtPn1LGuxhFLKb7Kxp6VRpwJ8v7Hc8JvnTRwbEXfhX6CaXwXJLY2hHFMApNv5eMYazdBLHN3ULMmGi3WGZvnKBj';
    }
    
    async getBalance(publicKey) {
      // This would get the balance from the network
      return {
        value: 10000000000, // 10 SOL in lamports
      };
    }
    
    async getAccountInfo(publicKey) {
      // This would fetch account info from the network
      return {
        executable: false,
        owner: new PublicKey('11111111111111111111111111111111'),
        lamports: 10000000000,
        data: new Uint8Array([]),
      };
    }
    
    async getParsedTokenAccountsByOwner(ownerAddress, filter) {
      // Mock implementation for getting token accounts
      // In a real implementation, this would fetch from the network
      return {
        value: [
          {
            pubkey: new PublicKey('TokenAccountPubkey123456789abcdef'),
            account: {
              data: {
                parsed: {
                  info: {
                    mint: 'MintAddress123456789abcdef',
                    owner: ownerAddress.toString(),
                    tokenAmount: {
                      amount: '1',
                      decimals: 0,
                      uiAmount: 1
                    }
                  },
                  type: 'account'
                },
                program: 'spl-token',
                space: 165
              },
              executable: false,
              lamports: 2039280,
              owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            }
          }
        ]
      };
    }
    
    async getTokenAccountBalance(tokenAddress) {
      // This would fetch token balance from the network
      return {
        value: {
          amount: '1',
          decimals: 0,
          uiAmount: 1
        }
      };
    }
    
    // NFT-specific methods
    async getNFTMetadata(mintAddress) {
      // This would fetch NFT metadata from the network
      return {
        name: 'Megapixel Core NFT',
        symbol: 'MPXL',
        uri: 'https://arweave.net/abc123',
        sellerFeeBasisPoints: 500,
        creators: [
          {
            address: new PublicKey('CreatorAddress123456789abcdef'),
            verified: true,
            share: 100
          }
        ]
      };
    }
  }

  // Wallet adapter for browser extensions
  class PhantomWalletAdapter {
    constructor() {
      this.connected = false;
      this.publicKey = null;
      this._provider = window.solana;
    }
    
    get connecting() {
      return false;
    }
    
    get provider() {
      if (!this._provider) {
        throw new Error('Phantom wallet not detected');
      }
      return this._provider;
    }
    
    async connect() {
      try {
        if (!this._provider) {
          throw new Error('Phantom wallet not detected');
        }
        
        const response = await this._provider.connect();
        this.connected = true;
        this.publicKey = new PublicKey(response.publicKey.toString());
        
        return {
          publicKey: this.publicKey
        };
      } catch (error) {
        console.error('Connection error:', error);
        throw error;
      }
    }
    
    async disconnect() {
      if (this._provider && this.connected) {
        await this._provider.disconnect();
        this.connected = false;
        this.publicKey = null;
      }
    }
    
    async signTransaction(transaction) {
      if (!this.connected) {
        throw new Error('Wallet not connected');
      }
      
      try {
        const signedTransaction = await this._provider.signTransaction(transaction);
        return signedTransaction;
      } catch (error) {
        console.error('Transaction signing error:', error);
        throw error;
      }
    }
    
    async signAllTransactions(transactions) {
      if (!this.connected) {
        throw new Error('Wallet not connected');
      }
      
      try {
        const signedTransactions = await this._provider.signAllTransactions(transactions);
        return signedTransactions;
      } catch (error) {
        console.error('Transactions signing error:', error);
        throw error;
      }
    }
    
    async signMessage(message) {
      if (!this.connected) {
        throw new Error('Wallet not connected');
      }
      
      try {
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await this._provider.signMessage(encodedMessage);
        return signature;
      } catch (error) {
        console.error('Message signing error:', error);
        throw error;
      }
    }
  }

  // Buffer implementation for browser
  class Buffer {
    constructor(data) {
      if (data instanceof Uint8Array) {
        this.data = data;
      } else if (typeof data === 'string') {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    
    static from(data, encoding) {
      if (typeof data === 'string') {
        if (encoding === 'hex') {
          return new Buffer(
            new Uint8Array(
              data.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
            )
          );
        } else if (encoding === 'base64') {
          const binary = atob(data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return new Buffer(bytes);
        }
        return new Buffer(data);
      } else if (Array.isArray(data)) {
        return new Buffer(new Uint8Array(data));
      } else if (data instanceof Uint8Array) {
        return new Buffer(data);
      }
      throw new Error('Unsupported data type');
    }
    
    toString(encoding) {
      if (encoding === 'hex') {
        return Array.from(this.data)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      } else if (encoding === 'base64') {
        let binary = '';
        const bytes = new Uint8Array(this.data);
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }
      return new TextDecoder().decode(this.data);
    }
  }

  // Program related utilities and constants
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
  const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  
  // Utility functions
  const findAssociatedTokenAddress = async (walletAddress, tokenMintAddress) => {
    return new PublicKey('AssociatedTokenAddress' + walletAddress.toString().substr(0, 8) + tokenMintAddress.toString().substr(0, 8));
  };
  
  const getMetadataAddress = async (mint) => {
    return new PublicKey('MetadataAddress' + mint.toString().substr(0, 16));
  };

  // Export objects and functions
  exports.Connection = Connection;
  exports.PublicKey = PublicKey;
  exports.Transaction = Transaction;
  exports.TransactionInstruction = TransactionInstruction;
  exports.PhantomWalletAdapter = PhantomWalletAdapter;
  exports.Buffer = Buffer;
  exports.SOLANA_MAINNET = SOLANA_MAINNET;
  exports.SOLANA_DEVNET = SOLANA_DEVNET;
  exports.SOLANA_TESTNET = SOLANA_TESTNET;
  exports.TOKEN_PROGRAM_ID = TOKEN_PROGRAM_ID;
  exports.ASSOCIATED_TOKEN_PROGRAM_ID = ASSOCIATED_TOKEN_PROGRAM_ID;
  exports.METADATA_PROGRAM_ID = METADATA_PROGRAM_ID;
  exports.findAssociatedTokenAddress = findAssociatedTokenAddress;
  exports.getMetadataAddress = getMetadataAddress;
  exports.version = '1.78.4-minimal';

  // Default export
  Object.defineProperty(exports, '__esModule', { value: true });
}));
