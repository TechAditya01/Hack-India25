from datetime import datetime
from pathlib import Path
from textwrap import dedent
from typing import Dict, Any, Optional, List

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.exa import ExaTools
from agno.embedder.google import GeminiEmbedder
from agno.vectordb.pgvector import PgVector
from agno.agent import AgentKnowledge

class SolidityCodeAgent:
    def __init__(self):
        # Initialize Gemini embedder
        self.embedder = GeminiEmbedder()
        
        # Initialize vector database for storing contract patterns and best practices
        self.knowledge_base = AgentKnowledge(
            vector_db=PgVector(
                db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
                table_name="solidity_patterns",
                embedder=self.embedder,
            ),
            num_documents=3,  # Retrieve top 3 most relevant patterns
        )
        
        # Initialize the main agent with Gemini embeddings
        self.agent = Agent(
            model=OpenAIChat(id="gpt-4"),
            tools=[ExaTools(start_published_date=datetime.now().strftime("%Y-%m-%d"), type="keyword")],
            description=dedent("""\
                You are SolidityMaster, an expert smart contract developer with deep knowledge of:
                - Solidity programming language
                - Ethereum blockchain architecture
                - Smart contract security best practices
                - Gas optimization techniques
                - OpenZeppelin contracts and patterns
                
                Your expertise lies in:
                - Writing secure and efficient smart contracts
                - Implementing best practices and design patterns
                - Optimizing gas usage
                - Adding comprehensive documentation
                - Creating testable and maintainable code
            """),
            instructions=dedent("""\
                Follow these steps when generating smart contracts:
                1. Analyze the requirements and security considerations
                2. Design the contract structure and inheritance
                3. Implement core functionality with proper access control
                4. Add events for important state changes
                5. Include NatSpec documentation
                6. Add security checks and validations
                7. Optimize gas usage
                8. Generate test cases
                9. Create deployment scripts
                
                Always follow these principles:
                - Use OpenZeppelin contracts where appropriate
                - Implement proper access control
                - Add comprehensive error messages
                - Include events for important operations
                - Follow the latest Solidity standards
                - Add proper documentation
            """),
            expected_output=dedent("""\
                A complete Solidity smart contract implementation:

                // SPDX-License-Identifier: MIT
                pragma solidity ^0.8.0;

                /**
                 * @title {Contract Name}
                 * @dev {Contract Description}
                 * @author SmartForge.ai
                 * @notice {Usage Instructions}
                 */
                contract {ContractName} {
                    // State variables
                    // Events
                    // Modifiers
                    // Constructor
                    // External functions
                    // Public functions
                    // Internal functions
                    // Private functions
                }
            """),
            markdown=True,
            show_tool_calls=True,
            add_datetime_to_instructions=True,
        )

    def _get_relevant_patterns(self, description: str) -> List[str]:
        """
        Retrieve relevant contract patterns and best practices using Gemini embeddings.
        
        Args:
            description: Contract description to find relevant patterns for
            
        Returns:
            List of relevant patterns and best practices
        """
        try:
            # Get embeddings for the description
            description_embedding = self.embedder.get_embedding(description)
            
            # Query the knowledge base for relevant patterns
            relevant_patterns = self.knowledge_base.query(
                query_embedding=description_embedding,
                top_k=3
            )
            
            return [pattern.content for pattern in relevant_patterns]
        except Exception as e:
            logger.error(f"Error retrieving patterns: {str(e)}")
            return []

    def generate_contract(self, description: str, contract_name: str) -> Dict[str, Any]:
        """
        Generate a Solidity smart contract using AGNO agent with Gemini embeddings.
        
        Args:
            description: Natural language description of the contract
            contract_name: Name of the contract to generate
            
        Returns:
            Dict containing the generated code and metadata
        """
        try:
            # Get relevant patterns using Gemini embeddings
            relevant_patterns = self._get_relevant_patterns(description)
            
            # Construct the prompt for the agent
            prompt = f"""
            Generate a Solidity smart contract with the following specifications:
            
            Contract Name: {contract_name}
            Description: {description}
            
            Relevant Patterns and Best Practices:
            {chr(10).join(relevant_patterns)}
            
            Requirements:
            1. Follow Solidity best practices
            2. Include proper security measures
            3. Optimize gas usage
            4. Add comprehensive documentation
            5. Include events for important operations
            6. Use OpenZeppelin contracts where appropriate
            7. Add proper access control
            8. Include NatSpec documentation
            9. Generate test cases
            10. Create deployment script
            
            Please provide:
            1. The complete Solidity contract code
            2. Test file
            3. Deployment script
            4. Security considerations
            5. Gas optimization suggestions
            """
            
            # Generate the response using AGNO agent
            response = self.agent.run(prompt)
            
            # Parse the response and extract components
            components = self._parse_agent_response(response)
            
            return {
                "status": "success",
                "code": components["contract_code"],
                "test_file": components["test_file"],
                "deployment_script": components["deployment_script"],
                "metadata": {
                    "contract_name": contract_name,
                    "timestamp": datetime.now().isoformat(),
                    "security_considerations": components["security_considerations"],
                    "gas_optimizations": components["gas_optimizations"],
                    "relevant_patterns": relevant_patterns
                }
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "code": None,
                "metadata": None
            }
    
    def _parse_agent_response(self, response: str) -> Dict[str, str]:
        """
        Parse the AGNO agent response into structured components.
        
        Args:
            response: Raw response from the AGNO agent
            
        Returns:
            Dict containing parsed components
        """
        # Split the response into sections
        sections = response.split("\n\n")
        
        # Initialize components
        components = {
            "contract_code": "",
            "test_file": "",
            "deployment_script": "",
            "security_considerations": [],
            "gas_optimizations": []
        }
        
        current_section = None
        
        for section in sections:
            if section.startswith("// SPDX-License-Identifier:"):
                current_section = "contract_code"
                components[current_section] = section
            elif section.startswith("// Test file"):
                current_section = "test_file"
                components[current_section] = section
            elif section.startswith("// Deployment script"):
                current_section = "deployment_script"
                components[current_section] = section
            elif section.startswith("Security Considerations:"):
                current_section = "security_considerations"
                components[current_section] = section.split("\n")[1:]
            elif section.startswith("Gas Optimizations:"):
                current_section = "gas_optimizations"
                components[current_section] = section.split("\n")[1:]
            elif current_section:
                components[current_section] += "\n" + section
        
        return components
    
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