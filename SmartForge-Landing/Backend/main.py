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
    allow_origins=["*"],  # In production, replace with actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
class ContractRequest(BaseModel):
    contract_type: str
    contract_details: str

class ContractResponse(BaseModel):
    success: bool
    message: str
    contract: Dict[str, Any]

@app.post("/api/chat")
async def chat(request: ContractRequest):
    try:
        logger.info(f"Received chat request with message: {request.contract_details}")
        
        # Create a prompt for the chat
        # prompt = f"""
        # You are SmartForge.ai, an AI assistant specialized in helping users generate and deploy smart contracts.
        # You provide concise, technical, and helpful responses about blockchain, cryptocurrency, and smart contract development.
        # Always remain factual and offer solutions to user queries related to smart contract development.

        # User message: {request.contract_details}
        # """
        prompt = f"give me code for solidity contract for {request.contract_details}"

        logger.info("Generating response using Gemini...")
        # Generate response using Gemini
        response = model.generate_content(prompt)
        logger.info("Successfully generated response from Gemini")
        
        # Check if the message is about contract generation
        if any(keyword in request.contract_details.lower() for keyword in ['generate contract', 'create contract', 'write contract']):
            logger.info("Contract generation requested, generating contract...")
            # Generate contract using Gemini
            contract_prompt = f"""
            Generate a Solidity smart contract based on the following requirements:
            {request.contract_details}

            Please provide:
            1. The complete Solidity contract code
            2. A test file in JavaScript
            3. A deployment script
            4. Security considerations
            5. Gas optimizations
            """

            contract_response = model.generate_content(contract_prompt)
            logger.info("Successfully generated contract")
            
            # Parse the contract response and structure it
            contract_data = {
                "contract_code": contract_response.text,
                "test_file": "// Test file will be generated here",
                "deployment_script": "// Deployment script will be generated here",
                "security_considerations": ["Security considerations will be listed here"],
                "gas_optimizations": ["Gas optimizations will be listed here"]
            }

            return {
                "response": response.text,
                "contract_data": contract_data
            }

        return {"response": response.text}

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-contract")
async def generate_contract(request: ContractRequest):
    try:
        logger.info(f"Received contract generation request: {request.contract_type}")
        
        # Create a prompt for contract generation
        prompt = f"""
        Generate a Solidity smart contract with the following specifications:
        
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