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
          body: JSON.stringify({ email })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
          emailInput.value = '';
          alert('Thank you! You\'ve been added to our early access list.');
        } else {
          alert(data.error || 'Something went wrong. Please try again.');
        }
      } catch (error) {
        console.error('Error submitting email:', error);
        alert('Failed to submit email. Please try again later.');
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
    
    // Check if content is markdown
    if (typeof content === 'string' && content.includes('#') || content.includes('*') || content.includes('`')) {
      // Use marked library to render markdown
      messageContent.innerHTML = marked.parse(content);
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
    
    // Add user message to chat
    addMessage(message, 'user');
    chatInput.value = '';
    
    try {
      // Send message to backend
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ prompt: message })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Add AI response to chat
        addMessage(data.data.message, 'ai');
        
        // If there's contract code, add it as a separate message
        if (data.data.contract_code) {
          addMessage('```solidity\n' + data.data.contract_code + '\n```', 'ai');
        }
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, I encountered an error. Please try again.', 'error');
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
  
  
  // Add event listeners for chat input
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.querySelector('.chat-send-button');
  
  if (chatInput && sendButton) {
    // Send on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send on Enter key
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Connect wallet button
  const connectWalletButton = document.querySelector('.cta-button');
  if (connectWalletButton) {
    connectWalletButton.addEventListener('click', async function() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          console.log('Connected account:', account);
          alert(`Connected to wallet: ${account}`);
          
          // Optionally, display the account on the UI
          // You can add code here to update the UI with the connected account
        } catch (error) {
          console.error('User denied account access:', error);
          alert('Please allow access to your wallet to connect.');
        }
      } else {
        alert('MetaMask is not installed. Please install it to connect your wallet.');
      }
    });
  }
})();