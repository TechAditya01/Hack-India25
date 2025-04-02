import os
import json
import requests
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from agno_solidity_agent import SolidityCodeAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AGNO agent
solidity_agent = SolidityCodeAgent()

@require_POST
def generate_contract(request):
    try:
        # 1. Get the contract description from the request data
        data = json.loads(request.body)
        description = data.get('description', '')
        contract_name = data.get('contract_name', f'Contract_{datetime.now().strftime("%Y%m%d_%H%M%S")}')

        if not description:
            return JsonResponse({
                'success': False,
                'error': 'No contract description provided'
            }, status=400)

        # 2. First, use Gemini to process and enhance the natural language description
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            raise ValueError('Gemini API key not found in environment variables.')

        # 3. Construct Gemini API request for natural language processing
        gemini_url = "https://api.generativeai.google.com/v1beta2/models/gemini-pro:generateText?response_format=json"
        gemini_headers = {
            'Authorization': f'Bearer {gemini_api_key}',
            'Content-Type': 'application/json'
        }

        # 4. Create a structured prompt for Gemini
        gemini_prompt = f"""
        Analyze the following smart contract description and enhance it with:
        1. Security considerations
        2. Gas optimization suggestions
        3. Best practices
        4. Required OpenZeppelin contracts
        5. Event definitions
        
        Description: {description}
        
        Provide the enhanced description in a structured format.
        """

        gemini_payload = {
            "prompt": {
                "text": gemini_prompt
            },
            "temperature": 0.2,
            "max_output_tokens": 4096,
            "top_p": 0.95,
            "top_k": 40
        }

        # 5. Make the Gemini API request
        gemini_response = requests.post(gemini_url, headers=gemini_headers, json=gemini_payload)
        
        if gemini_response.status_code != 200:
            logger.error(f"Gemini API error: {gemini_response.status_code} - {gemini_response.text}")
            return JsonResponse({
                'success': False,
                'error': 'Error processing contract description with Gemini API.'
            }, status=500)

        # 6. Extract the enhanced description from Gemini
        gemini_data = gemini_response.json()
        enhanced_description = gemini_data['candidates'][0]['output']

        # 7. Use AGNO agent to generate the actual Solidity code
        agno_result = solidity_agent.generate_contract(enhanced_description, contract_name)
        
        if agno_result['status'] != 'success':
            logger.error(f"AGNO generation error: {agno_result.get('error', 'Unknown error')}")
            return JsonResponse({
                'success': False,
                'error': 'Error generating Solidity code with AGNO.'
            }, status=500)

        # 8. Validate the generated code
        validation_result = solidity_agent.validate_code(agno_result['code'])

        # 9. Prepare the response
        response_data = {
            'success': True,
            'message': 'Contract generated successfully',
            'contract': {
                'name': contract_name,
                'code': agno_result['code'],
                'test_file': agno_result['test_file'],
                'deployment_script': agno_result['deployment_script'],
                'metadata': agno_result['metadata'],
                'validation': validation_result,
                'enhanced_description': enhanced_description
            }
        }

        return JsonResponse(response_data)

    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'An unexpected error occurred while generating the contract.'
        }, status=500)