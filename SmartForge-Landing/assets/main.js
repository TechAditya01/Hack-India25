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
            'Content-Type': 'application/json'
          },
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
    
    if (type === 'ai') {
      try {
        // If content is a string containing JSON, parse it and extract only the message
        if (typeof content === 'string') {
          try {
            const jsonContent = JSON.parse(content);
            if (jsonContent.message) {
              content = jsonContent.message;
            }
          } catch (e) {
            // If parsing fails, use the content as is
            console.log('Content is not JSON, using as is');
          }
        } else if (content.message) {
          // If content is already an object with message property
          content = content.message;
        }
        
        // Use marked library to render markdown
        messageContent.innerHTML = marked.parse(content);
      } catch (error) {
        console.error('Error parsing content:', error);
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
      // Send message to backend
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: message })
      });
      
      console.log('Response status:', response.status);
      let data;
      try {
        const text = await response.text();
        console.log('Raw response:', text);
        
        // First parse the outer JSON
        const outerData = JSON.parse(text);
        
        // Extract the inner JSON string from data.message
        const innerJsonMatch = outerData.data.message.match(/```json\n([\s\S]*?)\n```/);
        if (innerJsonMatch && innerJsonMatch[1]) {
          // Parse the inner JSON
          const innerData = JSON.parse(innerJsonMatch[1]);
          
          // Get the actual message content
          const messageContent = innerData.message
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            // Remove the header section
            .replace(/^# Response\s*## Overview\s*/g, '')
            // Remove the Related Topics section
            .replace(/\s*## Related Topics[\s\S]*$/, '')
            // Clean up any extra newlines
            .trim();
            
          addMessage(messageContent, 'ai');
        } else {
          console.error('Could not extract inner message from response');
          addMessage('Sorry, I encountered an error. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Error handling response:', error);
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