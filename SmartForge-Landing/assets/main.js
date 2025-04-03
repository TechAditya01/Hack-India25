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
    
    // Add user message to chat
    addMessage(message, 'user');
    chatInput.value = '';
    
    try {
      console.log('Sending message to:', `${API_URL}/api/chat`);
      // Show loading message
      const loadingId = Date.now();
      addMessage('Generating response...', 'system');
      
      // Send message to backend
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ prompt: message })
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
          // Extract the inner JSON string from data.message
          const innerJsonMatch = data.data.message.match(/```json\n([\s\S]*?)\n```/);
          if (innerJsonMatch && innerJsonMatch[1]) {
            // Parse the inner JSON
            const innerData = JSON.parse(innerJsonMatch[1]);
            
            // Get just the message content without metadata
            if (innerData.message) {
              // Remove the Response and Overview headers
              const cleanedMessage = innerData.message
                .replace(/^# Response\s*\n+## Overview\s*\n+/i, '')
                .replace(/\s*## Related Topics[\s\S]*$/, '')
                .trim();
              
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
              
              addMessage(cleanedMessage, 'ai');
            } else {
              throw new Error('No message content in response');
            }
          } else {
            // If no JSON wrapper, use the message directly
            addMessage(data.data.message, 'ai');
          }
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