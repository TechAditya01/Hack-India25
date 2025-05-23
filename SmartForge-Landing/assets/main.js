// Form validation and interactive features for SmartForge.ai
(function() {
  // Email validation function
  function validateEmail(email) {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email.toLowerCase());
  }

  // Get the API URL based on environment
  const API_URL = 'https://hackindia-spark-4-2025-coffee-coders-wn6r.onrender.com';

  console.log('Using API URL:', API_URL);

  // Handle form submission
  const emailForm = document.getElementById('emailForm');
  const emailInput = document.getElementById('emailInput');

  if (emailForm) {
    emailForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      
      if (!validateEmail(email)) {
        emailInput.classList.add('error');
        return;
      }
      
      emailInput.classList.remove('error');
      
      try {
        console.log('Sending email to server:', email);
        const response = await fetch(`${API_URL}/api/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify({ email })
        });

        console.log('Response status:', response.status);
        let data;
        try {
          const text = await response.text();
          console.log('Raw response:', text);
          data = JSON.parse(text);
          console.log('Parsed response data:', data);
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          throw new Error('Invalid response from server');
        }
        
        if (response.ok) {
          emailInput.value = '';
          alert('Thank you! You\'ve been added to our early access list.');
        } else {
          console.error('Server error response:', {
            status: response.status,
            statusText: response.statusText,
            data: data
          });
          alert(data.error || 'Server error. Please try again later.');
        }
      } catch (error) {
        console.error('Error submitting email:', error);
        if (error.message === 'Failed to fetch') {
          alert('Unable to connect to server. Please check your internet connection and try again later.');
        } else {
          alert('Failed to submit email. Please try again later.');
        }
      }
    });

    // Remove error styling when user starts typing again
    emailInput.addEventListener('input', function() {
      emailInput.classList.remove('error');
    });
  }

  // Mobile menu functionality (optional)
  const menuButton = document.querySelector('.menu-button');
  if (menuButton) {
    menuButton.addEventListener('click', function() {
      // We could implement a mobile menu here
      // For now, just log a message
      console.log('Menu clicked!');
    });
  }
  
  // Function to add a message to the chat
  function addMessage(content, type) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (type === 'ai') {
      try {
        // Use marked library to render markdown
        messageContent.innerHTML = marked.parse(content);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        messageContent.textContent = content;
      }
    } else {
      messageContent.textContent = content;
    }
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Function to handle sending a message
  async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    if (!chatInput || !chatMessages) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Get wallet information
    const walletInfo = await walletConnector.getWalletInfo();
    
    // Add user message to chat
    addMessage(message, 'user');
    chatInput.value = '';
    
    try {
      console.log('Sending message to:', `${API_URL}/api/chat`);
      // Show loading message
      const loadingId = Date.now();
      addMessage('Generating response...', 'system');
      
      // Create context object with wallet information
      const context = {
        walletConnected: walletInfo !== null,
        walletType: walletInfo?.type || null,
        walletAddress: walletInfo?.address || null,
        walletBalance: walletInfo?.balance || null,
        walletCurrency: walletInfo?.currency || null
      };
      
      // Send message to backend with wallet context
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          prompt: message,
          context: context
        })
      });
      
      console.log('Response status:', response.status);
      
      // Remove loading message
      const loadingMessage = document.querySelector('.system-message:last-child');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      try {
        const text = await response.text();
        console.log('Raw response:', text);
        
        // Parse the response
        const data = JSON.parse(text);
        
        if (data.data && data.data.message) {
          let finalMessage = '';
          
          // Add wallet information if connected
          if (walletInfo) {
            finalMessage += `**Connected Wallet Info:**\n`;
            finalMessage += `- Type: ${walletInfo.type === 'metamask' ? 'MetaMask (Ethereum)' : 'Phantom (Solana)'}\n`;
            finalMessage += `- Address: \`${walletInfo.address}\`\n`;
            finalMessage += `- Balance: ${walletInfo.balance} ${walletInfo.currency}\n\n`;
          }
          
          // Add the AI response
          const innerJsonMatch = data.data.message.match(/```json\n([\s\S]*?)\n```/);
          if (innerJsonMatch && innerJsonMatch[1]) {
            const innerData = JSON.parse(innerJsonMatch[1]);
            if (innerData.message) {
              const cleanedMessage = innerData.message
                .replace(/^# Response\s*\n+## Overview\s*\n+/i, '')
                .replace(/\s*## Related Topics[\s\S]*$/, '')
                .trim();
              
              finalMessage += cleanedMessage;
            }
          } else {
            finalMessage += data.data.message;
          }
          
          // Configure marked for better code formatting
          marked.setOptions({
            highlight: function(code, language) {
              if (language && hljs.getLanguage(language)) {
                return hljs.highlight(code, { language: language }).value;
              }
              return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
          });
          
          addMessage(finalMessage, 'ai');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error handling response:', error);
        addMessage('I apologize, but I encountered an error processing the response. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.message === 'Failed to fetch') {
        addMessage('Unable to connect to the server. Please check your internet connection and try again.', 'error');
      } else {
        addMessage('I apologize, but something went wrong. Please try again.', 'error');
      }
    }
  }
  
  /**
   * FUTURE AI MODEL INTEGRATION
   * --------------------------
   * The code below is commented out and shows how to connect to an external AI API
   * for generating more intelligent chat responses in the future.
   * To use this:
   * 1. Uncomment the function
   * 2. Replace the current sendMessage function with sendMessageWithAI
   * 3. Add your API key in the environment variables
   * 4. Install any required libraries (fetch or axios for API requests)
   */
  
  
  // Function to handle sending a message with AI integration
  async function sendMessageWithAI() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    if (!chatInput || !chatMessages) return;
    
    const message = chatInput.value.trim();
    if (message) {
      // Add user message to chat
      addMessage(message, 'user');
      
      // Clear input
      chatInput.value = '';
      
      // Show typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'message ai-message typing-indicator';
      typingIndicator.innerHTML = '<div class="message-content">SmartForge.ai is thinking...</div>';
      chatMessages.appendChild(typingIndicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      try {
        // Make a request to OpenAI API or another AI service
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // API key should be in environment variables
          },
          body: JSON.stringify({
            model: 'gpt-4', // Or another model like 'gpt-3.5-turbo'
            messages: [
              {
                role: 'system', 
                content: 'You are Coffee_coders.ai, an AI assistant specialized in helping users generate and deploy smart contracts. ' +
                         'You provide concise, technical, and helpful responses about blockchain, cryptocurrency, and smart contract development. ' +
                         'Always remain factual and offer solutions to user queries related to smart contract development.'
              },
              { role: 'user', content: message }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        chatMessages.removeChild(typingIndicator);
        
        // Get AI response from the API
        const aiResponse = data.choices[0].message.content;
        
        // Add AI response to chat
        addMessage(aiResponse, 'ai');
      } catch (error) {
        // Remove typing indicator
        chatMessages.removeChild(typingIndicator);
        
        // Show error message if AI request fails
        console.error('Error getting AI response:', error);
        addMessage('Sorry, I encountered an error while processing your request. Please try again later.', 'ai');
      }
    }
  }
  
  
  // Add event listeners for chat functionality
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.querySelector('.chat-send-button');

  if (chatInput && sendButton) {
    // Send message when clicking the send button
    sendButton.addEventListener('click', function() {
      sendMessage();
    });

    // Send message when pressing Enter in the input field
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Wallet connection functionality
  class WalletConnector {
    constructor() {
      this.connectedWallet = null;
      this.walletType = null;
      this.provider = null;
      this.balance = null;
    }

    async getBalance() {
      try {
        if (!this.isConnected()) return null;

        if (this.walletType === 'metamask') {
          const balance = await this.provider.request({
            method: 'eth_getBalance',
            params: [this.connectedWallet, 'latest']
          });
          // Convert from wei to ETH
          const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
          this.balance = ethBalance.toFixed(4);
          return this.balance;
        } else if (this.walletType === 'phantom') {
          const balance = await this.provider.connection.getBalance(this.provider.publicKey);
          // Convert from lamports to SOL
          const solBalance = balance / Math.pow(10, 9);
          this.balance = solBalance.toFixed(4);
          return this.balance;
        }
      } catch (error) {
        console.error('Error getting balance:', error);
        return null;
      }
    }

    async getWalletInfo() {
      if (!this.isConnected()) return null;

      const balance = await this.getBalance();
      return {
        address: this.connectedWallet,
        type: this.walletType,
        balance: balance,
        currency: this.walletType === 'metamask' ? 'ETH' : 'SOL'
      };
    }

    async connectMetaMask() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Check if the provider is actually MetaMask
          const isMetaMask = window.ethereum.isMetaMask;
          if (!isMetaMask) {
            throw new Error('Please use MetaMask wallet');
          }

          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          
          // Store provider reference
          this.provider = window.ethereum;
          this.connectedWallet = account;
          this.walletType = 'metamask';

          // Add event listeners for account changes
          this.provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
              // User disconnected their wallet
              this.disconnect();
              updateWalletUI();
            } else {
              // Account changed
              this.connectedWallet = accounts[0];
              updateWalletUI({ account: accounts[0], type: 'metamask' });
            }
          });

          return { success: true, account, type: 'metamask' };
        } catch (error) {
          console.error('MetaMask connection error:', error);
          throw new Error(error.message || 'Failed to connect to MetaMask');
        }
      } else {
        throw new Error('MetaMask is not installed. Please install MetaMask to connect.');
      }
    }

    async connectPhantom() {
      try {
        if (!('solana' in window)) {
          throw new Error('Phantom wallet is not installed. Please install Phantom to connect.');
        }

        const provider = window.solana;
        
        if (!provider.isPhantom) {
          throw new Error('Please use Phantom wallet');
        }

        // Connect to Phantom
        const response = await provider.connect();
        const publicKey = response.publicKey.toString();

        // Store provider reference
        this.provider = provider;
        this.connectedWallet = publicKey;
        this.walletType = 'phantom';

        // Add event listeners for account changes
        provider.on('disconnect', () => {
          this.disconnect();
          updateWalletUI();
        });

        provider.on('accountChanged', () => {
          // Handle account changes
          if (provider.publicKey) {
            this.connectedWallet = provider.publicKey.toString();
            updateWalletUI({ account: this.connectedWallet, type: 'phantom' });
          } else {
            this.disconnect();
            updateWalletUI();
          }
        });

        return { success: true, account: publicKey, type: 'phantom' };
      } catch (error) {
        console.error('Phantom connection error:', error);
        if (error.code === 4001) {
          throw new Error('Please approve the connection request in Phantom');
        }
        throw new Error(error.message || 'Failed to connect to Phantom');
      }
    }

    isConnected() {
      return this.connectedWallet !== null;
    }

    getConnectedAccount() {
      return {
        address: this.connectedWallet,
        type: this.walletType
      };
    }

    async disconnect() {
      if (this.walletType === 'phantom' && this.provider) {
        await this.provider.disconnect();
      }
      
      // Remove event listeners
      if (this.provider) {
        if (this.walletType === 'metamask') {
          this.provider.removeAllListeners('accountsChanged');
        } else if (this.walletType === 'phantom') {
          this.provider.removeAllListeners('disconnect');
          this.provider.removeAllListeners('accountChanged');
        }
      }

      this.provider = null;
      this.connectedWallet = null;
      this.walletType = null;
    }
  }

  // Initialize wallet connector
  const walletConnector = new WalletConnector();

  // Update UI based on wallet connection
  function updateWalletUI(walletInfo = null) {
    const connectWalletButton = document.querySelector('.wallet-button');
    if (!connectWalletButton) {
      console.error('Wallet button not found');
      return;
    }

    if (walletInfo && (walletInfo.account || walletInfo.address)) {
      // Get the address from either account or address field
      const address = walletInfo.account || walletInfo.address;
      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      const walletType = walletInfo.type;
      const walletIcon = walletType === 'metamask' ? '🦊' : '👻';
      
      connectWalletButton.innerHTML = `
        <span>${walletIcon} ${shortAddress}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      `;
      connectWalletButton.classList.add('connected');
      connectWalletButton.classList.add(walletType);
      connectWalletButton.setAttribute('data-connected', 'true');
    } else {
      connectWalletButton.innerHTML = `
        Connect Wallet
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      `;
      connectWalletButton.classList.remove('connected');
      connectWalletButton.classList.remove('metamask', 'phantom');
      connectWalletButton.removeAttribute('data-connected');
    }
  }

  // Create wallet selection modal
  function createWalletModal() {
    const modal = document.createElement('div');
    modal.className = 'wallet-modal';
    modal.innerHTML = `
      <div class="wallet-modal-content">
        <h3>Connect Wallet</h3>
        <div class="wallet-options">
          <button class="wallet-option metamask">
            <img src="/SmartForge-Landing/assets/images/metamask.svg" alt="MetaMask">
            <span>MetaMask</span>
          </button>
          <button class="wallet-option phantom">
            <img src="/SmartForge-Landing/assets/images/phantom.svg" alt="Phantom">
            <span>Phantom</span>
          </button>
        </div>
        <button class="close-modal">×</button>
      </div>
    `;
    return modal;
  }

  // Handle wallet connection
  async function handleWalletConnection(walletType) {
    try {
      let result;
      if (walletType === 'metamask') {
        result = await walletConnector.connectMetaMask();
      } else if (walletType === 'phantom') {
        result = await walletConnector.connectPhantom();
      }
      
      if (result && result.success) {
        const walletInfo = await walletConnector.getWalletInfo();
        updateWalletUI(walletInfo);
        // Close modal after successful connection
        const modal = document.querySelector('.wallet-modal');
        if (modal) {
          modal.remove();
        }
      }
    } catch (error) {
      alert(error.message);
    }
  }

  // Connect wallet button
  const connectWalletButton = document.querySelector('.cta-button, .connect-wallet-button');
  if (connectWalletButton) {
    // Add wallet-button class and update initial state
    connectWalletButton.classList.add('wallet-button');
    
    // Check if wallet is already connected and update UI accordingly
    if (walletConnector.isConnected()) {
      const walletInfo = walletConnector.getConnectedAccount();
      updateWalletUI(walletInfo);
    }
    
    connectWalletButton.addEventListener('click', function() {
      if (walletConnector.isConnected()) {
        // If wallet is connected, show disconnect option
        if (confirm('Do you want to disconnect your wallet?')) {
          walletConnector.disconnect();
          updateWalletUI();
        }
      } else {
        // Show wallet selection modal
        const modal = createWalletModal();
        document.body.appendChild(modal);

        // Add event listeners for wallet options
        const metamaskBtn = modal.querySelector('.wallet-option.metamask');
        const phantomBtn = modal.querySelector('.wallet-option.phantom');
        const closeBtn = modal.querySelector('.close-modal');

        metamaskBtn.addEventListener('click', () => handleWalletConnection('metamask'));
        phantomBtn.addEventListener('click', () => handleWalletConnection('phantom'));
        closeBtn.addEventListener('click', () => modal.remove());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });
      }
    });
  }
})();