import json
import os
import sys
import asyncio
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


async def extract_tags(prompt: str) -> dict:
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

    try:
        # Get rate limiter for the model
        model = "gpt-4o"
        rate_limiter = get_rate_limiter(model)

        # Use rate limiter before making the API call
        async with rate_limiter:
            # Use GPT-4 for the best extraction quality
            response = await client.chat.completions.parse(
                model=model,
                messages=[
                    {"role": "system", "content": prompt},
                ],
                temperature=0,  # Low temperature for more deterministic output
                max_tokens=500,
                response_format=TagList,
            )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"Error during extraction: {e}")
        raise e


def get_extract_condition_tags_prompt(content):
    return f"""
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


async def extract_condition_tags(q_item: Dict[str, Any]) -> dict:
    content = q_item['label']['indicationsAndUsage']
    content += q_item['label']['dosageAndAdministration']
    content += q_item['label']['description']

    # If no content found, return an empty string
    if not content:
        return {"tags": []}

    content = remove_html_tags(content)
    tag_list = await extract_tags(get_extract_condition_tags_prompt(content))
    return tag_list


def get_extract_substance_tags_prompt(content):
    return f"""
You are a medical data extraction assistant. Your task is to extract the **substances or active pharmaceutical ingredients** mentioned in the drug description below. Focus only on the specific chemical or biologically active substances that serve as the therapeutic agents in a drug product.

## Output Format:
Return only a **JSON array** under the `"substances"` key. Each item must be a concise, human-readable name of a substance (e.g., "Lisinopril", "Acetaminophen", "Insulin glargine").

## Extraction Rules:
- Include only active **chemical substances**, **biologic agents**, or **defined ingredients**.
- **Do not include** brand names, excipients, inactive ingredients, or dosage forms.
- Normalize common spelling variants (e.g., “Paracetamol” → “Acetaminophen” if applicable).
- Use correct capitalization (e.g., “Metformin”, not “metformin” or “METFORMIN”).

## Example Input:
"This product contains metformin hydrochloride as the active ingredient. It also includes povidone, magnesium stearate, and microcrystalline cellulose."

## Expected Output:
```json
{{
  "tags": [
    "Metformin hydrochloride"
  ]
}}
```

Now extract the substances from the following input:

### Input:
{content}
"""


async def extract_substance_tags(q_item: Dict[str, Any]) -> dict:
    content = q_item['label']['description']

    # If no content found, return an empty string
    if not content:
        return {"tags": []}

    content = remove_html_tags(content)
    tag_list = await extract_tags(get_extract_substance_tags_prompt(content))
    return tag_list


def get_extract_indications_prompt(content: str) -> str:
    return f"""
You are a medical data extraction assistant. Your task is to extract the **indications** for which the drug is prescribed, based on the provided text. Focus only on medically recognized conditions or diseases that the drug is used to treat or manage.

## Output Format:
Return only a **JSON array** under the key `"indications"`. Each item must be a concise, human-readable medical term (e.g., "Hypertension", "Type 2 Diabetes", "Rheumatoid Arthritis").

## Extraction Rules:
- Include only **diagnosed conditions** or **disease names** that are explicitly treated by the drug.
- **Do not include** symptoms, patient populations, therapeutic goals, dosage details, or procedures.
- Use proper medical terminology (no slang, no abbreviations, no brand names).
- Normalize plurals (e.g., "infections" → "infection") and use sentence case (e.g., "Heart failure").

## Example Input:
"Lisinopril is indicated for the treatment of hypertension in adults and pediatric patients 6 years and older. It is also indicated to reduce signs and symptoms of heart failure and to improve survival in patients with acute myocardial infarction."

## Expected Output:
```json
{{
  "indications": [
    "Hypertension",
    "Heart failure",
    "Acute myocardial infarction"
  ]
}}

### Input:
{content}
"""


async def extract_indication_tags(q_item: Dict[str, Any]) -> dict:
    content = q_item['label']['indicationsAndUsage']
    content += q_item['label']['dosageAndAdministration']

    # If no content found, return an empty string
    if not content:
        return {"tags": []}

    content = remove_html_tags(content)
    tag_list = await extract_tags(get_extract_indications_prompt(content))
    return tag_list


def get_extract_strengths_and_concentrations(content) -> str:
    return f"""
You are a medical data extraction assistant. Your task is to extract the **strengths and concentrations** in which a drug is available, based on the provided text. Focus on clearly stated quantitative expressions of the amount of active ingredient per unit or per volume.

## Output Format:
Return only a **JSON array** under the key `"strengths"`. Each item must be a precise, human-readable string that reflects a dosage strength or concentration (e.g., "10 mg", "100 mg/mL", "0.1%").

## Extraction Rules:
- Include only values representing **strength**, **dose**, or **concentration** of the active ingredient.
- Valid formats include: `mg`, `g`, `mcg`, `mg/mL`, `%`, `Units/mL`, etc.
- **Do not include** package quantities (e.g., "30 tablets") or frequencies (e.g., "twice daily").
- If multiple strengths are mentioned, include each as a separate item in the array.
- Preserve correct casing and spacing as written in the input.

## Example Input:
"This product is supplied as tablets containing 10 mg, 20 mg, or 40 mg of lisinopril. An oral solution is also available in 1 mg/mL concentration."

## Expected Output:
```json
{{
  "strengths": [
    "10 mg",
    "20 mg",
    "40 mg",
    "1 mg/mL"
  ]
}}

### Input:
{content}
"""


async def extract_strengths_and_concentrations_tags(q_item: Dict[str, Any]) -> dict:
    content = q_item['label']['indicationsAndUsage']
    content += q_item['label']['dosageFormsAndStrengths']
    content += q_item['label']['description']

    # If no content found, return an empty string
    if not content:
        return {"tags": []}

    content = remove_html_tags(content)
    tag_list = await extract_tags(get_extract_strengths_and_concentrations(content))
    return tag_list


def get_extract_population(content) -> str:
    return f"""
You are a medical data extraction assistant. Your task is to extract the **population suitability** details from the provided drug labeling text. Focus only on clearly defined patient populations for which the drug is **approved**, **recommended**, or **restricted**.

## Output Format:
Return only a **JSON array** under the key `"populations"`. Each item must be a concise, human-readable population group (e.g., "Pediatric", "Pregnant", "Geriatric", "Renal impairment").

## Extraction Rules:
- Include only **explicitly referenced populations** (e.g., age-based groups, pregnancy/lactation, organ impairment).
- **Do not include** general usage notes, dosage instructions, or treatment goals.
- Normalize common phrases into consistent categories (e.g., “children 6 years and older” → “Pediatric”).
- Use sentence case for all population tags.

## Example Input:
"This medication is indicated in adults and children aged 6 years and older. Use in geriatric patients should be closely monitored. Safety during pregnancy has not been established. Dosage adjustment may be required in patients with renal impairment."

## Expected Output:
```json
{{
  "populations": [
    "Adult",
    "Pediatric",
    "Geriatric",
    "Pregnant",
    "Renal impairment"
  ]
}}

### Input:
{content}
"""


async def extract_population_tags(q_item: Dict[str, Any]) -> dict:
    content = q_item['label']['indicationsAndUsage']
    content += q_item['label']['dosageFormsAndStrengths']
    content += q_item['label']['description']

    # If no content found, return an empty string
    if not content:
        return {"tags": []}

    content = remove_html_tags(content)
    tag_list = await extract_tags(get_extract_population(content))
    return tag_list


def get_extract_contraindications(content) -> str:
    return f"""
You are a medical data extraction assistant. Your task is to extract the **contraindications** for a drug based on the provided text. Focus only on specific conditions, diseases, or patient scenarios where the drug is **explicitly not recommended** or **should be avoided**.

## Output Format:
Return only a **JSON array** under the key `"contraindications"`. Each item must be a concise, human-readable term (e.g., "Angioedema", "Pregnancy", "Severe renal impairment").

## Extraction Rules:
- Include only conditions, diagnoses, or population characteristics that are stated as contraindications.
- **Do not include** side effects, general warnings, dosage information, or indications.
- Normalize terms to sentence case (e.g., "Severe hepatic impairment").
- Use generic clinical terms only—do not include brand names or abbreviations.

## Example Input:
"Use of this drug is contraindicated in patients with a history of angioedema related to previous ACE inhibitor therapy. It should also not be used during pregnancy or in patients with severe renal impairment."

## Expected Output:
```json
{{
  "contraindications": [
    "Angioedema",
    "Pregnancy",
    "Severe renal impairment"
  ]
}}

### Input:
{content}
"""


async def extract_contraindications_tags(q_item: Dict[str, Any]) -> dict:
    content = q_item['label']['contraindications']

    # If no content found, return an empty string
    if not content:
        return {"tags": []}

    content = remove_html_tags(content)
    tag_list = await extract_tags(get_extract_contraindications(content))
    return tag_list
