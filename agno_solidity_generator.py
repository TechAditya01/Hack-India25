from typing import Dict, Any, List, Optional
import google.generativeai as genai
from config import get_gemini_api_key
from textwrap import dedent
import json
import os
from datetime import datetime

class AgnoSolidityGenerator:
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
        6. Use OpenZeppelin contracts where appropriate
        7. Include NatSpec documentation
        
        The code should be production-ready and follow the latest Solidity standards.
        """)
        
        # Create output directory if it doesn't exist
        self.output_dir = "generated_contracts"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def generate_contract(self, description: str, contract_name: str) -> Dict[str, Any]:
        """
        Generate Solidity code from natural language description using AGNO's approach.
        
        Args:
            description: Natural language description of the desired smart contract
            contract_name: Name of the contract to generate
            
        Returns:
            Dict containing the generated code and metadata
        """
        try:
            # Construct the prompt
            prompt = f"{self.system_prompt}\n\nContract Name: {contract_name}\nDescription: {description}\n\nGenerate the Solidity code:"
            
            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            # Process and structure the response
            code = response.text
            
            # Save the generated contract
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{contract_name}_{timestamp}.sol"
            filepath = os.path.join(self.output_dir, filename)
            
            with open(filepath, 'w') as f:
                f.write(code)
            
            # Generate metadata
            metadata = {
                "contract_name": contract_name,
                "filename": filename,
                "filepath": filepath,
                "timestamp": timestamp,
                "model": "gemini-pro",
                "safety_ratings": response.safety_ratings,
                "description": description
            }
            
            # Save metadata
            metadata_filepath = os.path.join(self.output_dir, f"{contract_name}_{timestamp}_metadata.json")
            with open(metadata_filepath, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            return {
                "status": "success",
                "code": code,
                "metadata": metadata
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
        warnings = []
        suggestions = []
        
        # Basic validation checks
        if "pragma solidity" not in code:
            warnings.append("Missing Solidity pragma directive")
            suggestions.append("Add 'pragma solidity ^0.8.0;' at the top of the file")
            
        if "// SPDX-License-Identifier:" not in code:
            warnings.append("Missing SPDX license identifier")
            suggestions.append("Add '// SPDX-License-Identifier: MIT' at the top of the file")
            
        if "contract" not in code:
            warnings.append("No contract declaration found")
            suggestions.append("Ensure the code contains at least one contract declaration")
            
        # Check for common security patterns
        if "require(" not in code:
            warnings.append("No require statements found")
            suggestions.append("Add input validation using require statements")
            
        if "event" not in code:
            warnings.append("No events defined")
            suggestions.append("Add events for important state changes")
            
        # Check for gas optimization patterns
        if "uint256" in code and "uint" not in code:
            warnings.append("Using uint256 instead of uint")
            suggestions.append("Consider using uint instead of uint256 for gas optimization")
            
        return {
            "status": "success",
            "is_valid": len(warnings) == 0,
            "warnings": warnings,
            "suggestions": suggestions
        }
    
    def generate_test_file(self, contract_name: str, code: str) -> Optional[str]:
        """
        Generate a test file for the contract.
        
        Args:
            contract_name: Name of the contract
            code: The contract code
            
        Returns:
            Generated test code or None if generation fails
        """
        try:
            test_prompt = f"""
            Generate a comprehensive test file for the following Solidity contract:
            
            {code}
            
            The test file should:
            1. Use Hardhat or Foundry testing framework
            2. Cover all public functions
            3. Include edge cases
            4. Test error conditions
            5. Use proper assertions
            """
            
            response = self.model.generate_content(test_prompt)
            return response.text
            
        except Exception as e:
            print(f"Error generating test file: {str(e)}")
            return None
    
    def generate_deployment_script(self, contract_name: str, code: str) -> Optional[str]:
        """
        Generate a deployment script for the contract.
        
        Args:
            contract_name: Name of the contract
            code: The contract code
            
        Returns:
            Generated deployment script or None if generation fails
        """
        try:
            deploy_prompt = f"""
            Generate a deployment script for the following Solidity contract:
            
            {code}
            
            The deployment script should:
            1. Use Hardhat or Foundry deployment framework
            2. Include constructor arguments
            3. Handle network configuration
            4. Include verification steps
            5. Log deployment information
            """
            
            response = self.model.generate_content(deploy_prompt)
            return response.text
            
        except Exception as e:
            print(f"Error generating deployment script: {str(e)}")
            return None 