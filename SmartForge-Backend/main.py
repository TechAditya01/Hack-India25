from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = "postgresql://hackindia_652w_user:dx8XzlXYo01FhlVy5pBqg4ZJcgT1EWIA@dpg-cvmcpq15pdvs73f1vn1g-a.singapore-postgres.render.com/hackindia_652w"

# Initialize database connection
def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise

# Create tables if they don't exist
def init_db():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Create emails table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS emails (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Create chat_messages table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id SERIAL PRIMARY KEY,
                    user_message TEXT NOT NULL,
                    ai_response TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
        conn.commit()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise
    finally:
        conn.close()

# Initialize database tables
init_db()

# Initialize FastAPI app
app = FastAPI(
    title="SmartForge API",
    description="API for generating Solidity smart contracts using Gemini AI",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5504", "http://localhost:5504"],  # Add your local development URLs
    allow_credentials=False,  # Set to False since we're not using credentials
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

class EmailRequest(BaseModel):
    email: str

class EmailResponse(BaseModel):
    success: bool
    message: str

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
            prompt = f"""You are Coffee-coders.ai, an AI assistant specializing in blockchain and smart contract development.
Generate a complete Solidity smart contract based on the following requirements:

{request.prompt}

Format your response in clean markdown with:
- Clear headings for each section
- Code blocks with proper syntax highlighting
- Bullet points for features and considerations
- Proper spacing between sections

Include:
1. Contract Overview
2. Description
3. Key Features
4. Security Considerations
5. Technical Details
6. Contract Code (in a solidity code block)
"""
        else:
            # Create a conversational prompt for general questions
            prompt = f"""You are Coffee-coders.ai, an AI assistant specializing in blockchain and smart contract development. 
Answer the following question in a clear, well-structured format.

Question: {request.prompt}

Format your response in clean markdown with:
- Clear headings for each section
- Code blocks with proper syntax highlighting
- Bullet points for key information
- Proper spacing between sections

Do not include any JSON formatting or metadata in your response."""

        logger.info("Generating response using Gemini...")
        # Generate response using Gemini
        response = model.generate_content(prompt)
        logger.info("Successfully generated response from Gemini")
        
        # Store the chat message in the database
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO chat_messages (user_message, ai_response) VALUES (%s, %s)",
                    (request.prompt, response.text)
                )
            conn.commit()
        except Exception as e:
            logger.error(f"Error storing chat message: {str(e)}")
        finally:
            conn.close()
        
        return ChatResponse(
            success=True,
            message="Response generated successfully",
            data={
                "message": response.text
            }
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

@app.post("/api/subscribe", response_model=EmailResponse)
async def subscribe(request: EmailRequest):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO emails (email) VALUES (%s) ON CONFLICT (email) DO NOTHING",
                    (request.email,)
                )
            conn.commit()
            return EmailResponse(
                success=True,
                message="Email subscribed successfully"
            )
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "message": "Failed to store email",
                    "error": str(e)
                }
            )
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Error in subscribe endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "Failed to process request",
                "error": str(e)
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 