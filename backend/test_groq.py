
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API")
print(f"API Key found: {api_key[:10]}..." if api_key else "API Key NOT found")

client = Groq(api_key=api_key)


models = ["llama-3.3-70b-versatile", "llama3-70b-8192", "mixtral-8x7b-32768", "llama-3.2-11b-vision-preview"]

for model in models:
    try:
        print(f"Testing Groq API with model: {model}")
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Hello",
                }
            ],
            model=model,
        )
        print(f"Success with {model}!")
        print(chat_completion.choices[0].message.content)
        break # Stopy after first success
    except Exception as e:
        print(f"Error with {model}: {e}")
