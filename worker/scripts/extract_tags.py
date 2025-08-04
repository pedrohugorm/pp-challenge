import os
import sys
import asyncio
from openai.types.chat import ChatCompletionMessageParam
from typing import Dict, Any, List
from openai import AsyncOpenAI
from dotenv import load_dotenv
from pydantic import BaseModel

from rate_limiter import get_rate_limiter
from clean_json_html import remove_html_tags

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

class TagList(BaseModel):
    tags: List[str]

async def extract_condition_tags(q_item: Dict[str, Any]) -> TagList:
    """
    Extracts condition tags from a q_item dictionary using GPT-4
    without hallucinating or adding information not present in the original text.

    Args:
        q_item: A dictionary containing item data with description content

    Returns:
        A TagList object containing extracted condition tags
    """

    # Initialize OpenAI client
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    content = q_item['label']['indicationsAndUsage']
    content += q_item['label']['dosageAndAdministration']
    content += q_item['label']['description']

    # If no content found, return an empty string
    if not content:
        return TagList(tags=[])

    content = remove_html_tags(content)

    # Create a prompt that emphasizes extraction without hallucination
    prompt = f"""
You are a medical data extraction assistant. Your task is to extract the **conditions or diseases** that a drug is indicated to treat based on the text provided. Focus only on medically recognized conditions—not symptoms, signs, procedures, or populations.

## Output Format:
Return only a **JSON array** of distinct condition names. Each item must be a concise, human-readable term (e.g., "Hypertension", "Type 2 Diabetes", "Rheumatoid Arthritis").

## Extraction Rules:
- Include only diagnosed **conditions** or **diseases**.
- **Do not include** patient populations, treatment goals, symptoms, or dosage information.
- Return generic terms only (no brand names, abbreviations, or drug names).
- Normalize plurals (e.g., "infections" → "infection") and use sentence case.

## Example Input:
"Lisinopril is indicated for the treatment of hypertension in adults and pediatric patients 6 years and older. It is also indicated to reduce signs and symptoms of heart failure and to improve survival in patients with acute myocardial infarction."

## Expected Output:
```json
{{
  "tags": [
    "Hypertension",
    "Heart failure",
    "Acute myocardial infarction"
  ]
}}
```

Now extract the conditions from the following input:

### Input:
{content}
"""

    try:
        print(f'Extracting condition tags for {q_item["drugName"]}...')
        
        # Get rate limiter for the model
        model = "gpt-4o"
        rate_limiter = get_rate_limiter(model)
        
        # Use rate limiter before making the API call
        async with rate_limiter:
            # Use GPT-4 for the best extraction quality
            response = await client.chat.completions.parse(
                model=model,
                messages=[
                    ChatCompletionMessageParam(role="system", content=prompt),
                ],
                temperature=0,  # Low temperature for more deterministic output
                max_tokens=500,
                response_format=TagList,
            )

        print(f'Extracted condition tags for {q_item["drugName"]}...')

        return response.choices[0].message.parsed

    except Exception as e:
        print(f"Error during extraction: {e}")
        raise e