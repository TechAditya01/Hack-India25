from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SmartForge API",
    description="API for generating Solidity smart contracts using Gemini AI",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"]  # Expose all headers
)

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable is not set")
    raise ValueError("GEMINI_API_KEY environment variable is not set")

logger.info("Initializing Gemini API...")
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-pro"
    )
except Exception as e:
    logger.error(f"Failed to initialize Gemini API: {str(e)}")
    raise

# Pydantic models for request/response
class ChatRequest(BaseModel):
    prompt: str

class ContractRequest(BaseModel):
    contract_type: str
    contract_details: str

class ContractResponse(BaseModel):
    success: bool
    message: str
    contract: Dict[str, Any]

class ChatResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "SmartForge API is running",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/api/chat",
            "generate-contract": "/api/generate-contract"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.options("/api/chat")
async def options_chat():
    return {"status": "ok"}

@app.options("/api/generate-contract")
async def options_generate_contract():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request with prompt: {request.prompt}")
        
        # Check if the prompt is asking for a contract
        is_contract_request = any(keyword in request.prompt.lower() for keyword in [
            'contract', 'solidity', 'smart contract', 'erc20', 'erc721', 'erc1155',
            'token', 'nft', 'fungible', 'non-fungible', 'generate', 'create', 'write'
        ])
        
        if is_contract_request:
            # Create a structured prompt for contract generation
            prompt = f"""Generate a complete Solidity smart contract based on the following requirements:
{request.prompt}

Please provide the code in the following format:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contract Name: [Name]
// Description: [Brief description]
// Author: SmartForge.ai
// Version: 1.0.0

// Import statements
// [List all imports]

// Contract code
contract [ContractName] {{
    // State variables
    // [List all state variables]

    // Events
    // [List all events]

    // Modifiers
    // [List all modifiers]

    // Constructor
    // [Constructor code]

    // External functions
    // [List all external functions]

    // Public functions
    // [List all public functions]

    // Internal functions
    // [List all internal functions]

    // Private functions
    // [List all private functions]

    // View/Pure functions
    // [List all view/pure functions]

    // Fallback/Receive functions
    // [List fallback/receive functions]
}}
```

Requirements:
1. Use the latest Solidity version (^0.8.0)
2. Include proper NatSpec comments
3. Implement all necessary security checks
4. Use gas optimization techniques
5. Include events for important state changes
6. Add input validation
7. Handle edge cases
8. Include proper error messages
9. Use safe math operations
10. Follow Solidity best practices

The code should be production-ready and well-documented."""
        else:
            # Create a conversational prompt for general questions
            prompt = f"""You are SmartForge.ai, an AI assistant specializing in blockchain and smart contract development. 
Answer the following question in a conversational and helpful way:

{request.prompt}

If the question is about smart contracts or blockchain development, provide technical but accessible explanations.
If it's a general greeting or question, respond naturally without using code formatting."""

        logger.info("Generating response using Gemini...")
        # Generate response using Gemini
        response = model.generate_content(prompt)
        logger.info("Successfully generated response from Gemini")
        
        # Structure the response based on whether it's a contract request or not
        if is_contract_request:
            response_data = {
                "contract_code": response.text,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "model": "gemini-1.5-pro",
                    "version": "1.0.0"
                },
                "format": "solidity",
                "requirements": {
                    "solidity_version": "^0.8.0",
                    "includes_natspec": True,
                    "includes_security_checks": True,
                    "includes_gas_optimization": True,
                    "includes_events": True,
                    "includes_input_validation": True,
                    "includes_edge_cases": True,
                    "includes_error_messages": True,
                    "uses_safe_math": True
                }
            }
            return ChatResponse(
                success=True,
                message="Contract generated successfully",
                data=response_data
            )
        else:
            response_data = {
                "message": response.text,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "model": "gemini-1.5-pro",
                    "version": "1.0.0"
                }
            }
            return ChatResponse(
                success=True,
                message="Response generated successfully",
                data=response_data
            )

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "Failed to generate response",
                "error": str(e)
            }
        )

@app.post("/api/generate-contract")
async def generate_contract(request: ContractRequest):
    try:
        logger.info(f"Received contract generation request: {request.contract_type}")
        
        # Create a prompt for contract generation
        prompt = f"""
        Generate a Solidity smart contract with the following specifications and the code should be in a well structured markdown format:
        
        Contract Type: {request.contract_type}
        Contract Details: {request.contract_details}

        Please provide:
        1. The complete Solidity contract code
        2. A test file in JavaScript
        3. A deployment script
        4. Security considerations
        5. Gas optimizations
        """

        logger.info("Generating contract using Gemini...")
        # Generate contract using Gemini
        response = model.generate_content(prompt)
        logger.info("Successfully generated contract")
        
        # Structure the response
        contract_data = {
            "contract_code": response.text,
            "test_file": "// Test file will be generated here",
            "deployment_script": "// Deployment script will be generated here",
            "security_considerations": ["Security considerations will be listed here"],
            "gas_optimizations": ["Gas optimizations will be listed here"]
        }

        return {
            "success": True,
            "contract": contract_data
        }

    except Exception as e:
        logger.error(f"Error in generate-contract endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 