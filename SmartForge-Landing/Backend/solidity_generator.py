import os
import json
import requests

from django.http import JsonResponse
from django.views.decorators.http import require_POST


@require_POST
def generate_contract(request):
    try:
        # 1. Get the contract description from the request data
        data = json.loads(request.body)
        description = data.get('description', '')

        # 2. Construct the Gemini API URL and headers
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            raise ValueError('Gemini API key not found in environment variables.')

        url = "https://api.generativeai.google.com/v1beta2/models/gemini-pro:generateText"  # Replace with correct Gemini endpoint
        headers = {
            'Authorization': f'Bearer {gemini_api_key}',
            'Content-Type': 'application/json'
        }


        # 3. Construct the request payload
        payload = {
            "prompt": {
                "text": description
            },
            "temperature": 0.7,
            "max_output_tokens": 512,
            "top_p": 0.95,
            "top_k": 40
        }

        # 4. Make the API request
        response = requests.post(url, headers=headers, json=payload)

        # 5. Handle errors
        if response.status_code != 200:
            print(f"Error communicating with Gemini API: {response.status_code} - {response.text}")  # Log the error for debugging
            return JsonResponse({'success': False, 'error': 'Error communicating with the Gemini API.'}, status=500)

        # 6. Extract the generated code from the response
        gemini_response_data = response.json()
        generated_code = gemini_response_data['candidates'][0]['output'] # Adjust based on actual Gemini response structure



        return JsonResponse({
            'success': True,
            'message': 'Code generated successfully',
            'generated_code': generated_code
        })

    except ValueError as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)  # Return 500 for API key error
    except Exception as e:
        print(f"An unexpected error occurred: {e}") # Log the error for debugging
        return JsonResponse({'success': False, 'error': 'An unexpected error occurred.'}, status=500)