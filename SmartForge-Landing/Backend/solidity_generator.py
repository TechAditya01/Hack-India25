import os
import openai

# Set your Gemini API key
openai.api_key = os.environ.get("GOOGLE_API_KEY") # or replace with your actual key


def generate_code(prompt, language="python", max_tokens=200, temperature=0.5):
  """
  Generates code using the Gemini API.

  Args:
    prompt: The prompt describing the code to generate.  Be specific!
    language: The programming language for the generated code.
    max_tokens: The maximum number of tokens (words/characters) in the generated code.
    temperature: Controls the randomness of the generated code (0.0 - deterministic, 1.0 - very random).

  Returns:
    The generated code as a string.  Returns an error message if the API call fails.
  """
  try:
    response = openai.Completion.create(
      model="text-bison-001", # or other Gemini models as they become available
      prompt=f"```{language}\n{prompt}\n```", #Gemini likes prompts formatted in this way
      max_tokens=max_tokens,
      temperature=temperature,
      top_p=1, #Nucleus Sampling:  Alternative to temperature to control randomness
      frequency_penalty=0,
      presence_penalty=0
    )

    generated_code = response.choices[0].text.strip()
    return generated_code

  except openai.error.OpenAIError as e:
      return f"Error generating code: {e}"


if __name__ == "__main__":
    # Example usage: generate Python code for a simple function
    user_prompt = input("Describe the code you want to generate: ")
    generated_code = generate_code(user_prompt)

    print("\nGenerated Code:")
    print(generated_code)

    #Save to file (optional):
    save_to_file = input("Save code to file? (y/n): ")
    if save_to_file.lower() == 'y':
      filename = input("Enter filename (e.g., my_code.py): ")
      with open(filename, "w") as f:
        f.write(generated_code)
      print(f"Code saved to {filename}")