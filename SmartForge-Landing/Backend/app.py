from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from config import get_gemini_api_key
import uvicorn

app = FastAPI()

# Configure Gemini
genai.configure(api_key=get_gemini_api_key())
model = genai.GenerativeModel('gemini-pro')


class ContractRequest(BaseModel):
    description: str
    contract_name: str


@app.post("/generate-contract")
async def generate_contract(request: ContractRequest):
    try:
        prompt = f"""
        Generate a Solidity smart contract with the following details:
        Contract Name: {request.contract_name}
        Description: {request.description}

        Please create a secure, efficient, and well-documented smart contract.
        """

        response = model.generate_content(prompt)

        return {
            "status": "success",
            "code": response.text,
            "contract_name": request.contract_name
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"message": "Smart Contract Generator API"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)