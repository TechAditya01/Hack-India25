import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the Gemini API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def get_gemini_api_key():
    """
    Get the Gemini API key from environment variables.
    Raises an error if the API key is not set.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not found in environment variables. Please check your .env file.")
    return GEMINI_API_KEY 