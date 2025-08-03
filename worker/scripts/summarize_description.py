import os
import sys
from typing import Dict, Any
from openai import OpenAI
from dotenv import load_dotenv
from openai.types.chat import ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)


def summarize_description(q_item: Dict[str, Any]) -> str:
    """
    Summarizes the description content from a q_item dictionary using GPT-4
    without hallucinating or adding information not present in the original text.
    
    Args:
        q_item: A dictionary containing item data with description content
        
    Returns:
        A summarized version of the description content
    """

    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    # Extract description content from q_item
    # Only grab the label.description value
    description_content = ""

    if 'label' in q_item and isinstance(q_item['label'], dict):
        if 'description' in q_item['label']:
            description_content = q_item['label']['description']

    # If no label.description found, return empty string
    if not description_content:
        return ""

    # Create a prompt that emphasizes summarization without hallucination
    prompt = f"""
Please summarize the following content accurately and concisely. 
IMPORTANT: Only include information that is explicitly stated in the original text. 
Do not add any facts, details, or information that is not present in the source material.
Do not make assumptions or inferences beyond what is directly stated.
The summary must have a max of 60 characters.

## Original content:
{description_content}
### END OF Original content"""

    try:
        print(f'Summarizing {q_item["drugName"]}...')
        # Use GPT-4 for the best summarization quality
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                ChatCompletionSystemMessageParam(role="system", content="You are a precise summarization assistant. Your task is to create accurate, concise summaries that contain only information explicitly stated in the source text. Never add facts, details, or information that is not present in the original content. Focus on extracting and condensing the key information while maintaining factual accuracy."),
                ChatCompletionUserMessageParam(role="user", content=prompt)
            ],
            temperature=0.1,  # Low temperature for more deterministic output
            max_tokens=500,  # Reasonable limit for summaries
            top_p=0.9
        )

        print(f'Summarized {q_item["drugName"]}...')

        summary = response.choices[0].message.content.strip()
        return summary

    except Exception as e:
        print(f"Error during summarization: {e}")
        # Return a fallback summary or the original content
        return f"Error in summarization: {str(e)}"
