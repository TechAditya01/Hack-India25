from typing import Dict, Any
import google.generativeai as genai
from config import get_gemini_api_key
from textwrap import dedent

class AgnoCodeGenerator:
    def __init__(self):
        # Configure Gemini
        genai.configure(api_key=get_gemini_api_key())
        self.model = genai.GenerativeModel('gemini-pro')
        
        # System prompt for code generation
        self.system_prompt = dedent("""
        You are an expert Solidity smart contract developer. Your task is to:
        1. Analyze the natural language description
        2. Generate clean, secure, and efficient Solidity code
        3. Include proper documentation and comments
        4. Follow best practices for gas optimization
        5. Implement proper error handling
        
        The code should be production-ready and follow the latest Solidity standards.
        """)
        
    def generate_contract(self, description: str) -> Dict[str, Any]:
        """
        Generate Solidity code from natural language description using AGNO's approach.
        
        Args:
            description: Natural language description of the desired smart contract
            
        Returns:
            Dict containing the generated code and metadata
        """
        try:
            # Construct the prompt
            prompt = f"{self.system_prompt}\n\nDescription: {description}\n\nGenerate the Solidity code:"
            
            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            # Process and structure the response
            code = response.text
            
            # Extract and validate the code
            # Note: In a production environment, you'd want to add more robust code extraction
            # and validation logic here
            
            return {
                "status": "success",
                "code": code,
                "metadata": {
                    "model": "gemini-pro",
                    "timestamp": response.prompt_feedback,
                    "safety_ratings": response.safety_ratings
                }
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "code": None,
                "metadata": None
            }
    
    def validate_code(self, code: str) -> Dict[str, Any]:
        """
        Validate the generated Solidity code.
        
        Args:
            code: Generated Solidity code to validate
            
        Returns:
            Dict containing validation results
        """
        # Add validation logic here
        # This could include:
        # - Syntax checking
        # - Security analysis
        # - Gas optimization suggestions
        # - Best practices compliance
        
        return {
            "status": "success",
            "is_valid": True,
            "warnings": [],
            "suggestions": []
        } 