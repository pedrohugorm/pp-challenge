import os
import sys
import asyncio
from typing import Dict, Any
from openai import AsyncOpenAI
from dotenv import load_dotenv
# Removed import of ChatCompletionSystemMessageParam and ChatCompletionUserMessageParam
from rate_limiter import get_rate_limiter

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)


async def summarize_meta_description(q_item: Dict[str, Any]) -> str:
    """
    Summarizes the description content from a q_item dictionary using GPT-4
    without hallucinating or adding information not present in the original text.
    
    Args:
        q_item: A dictionary containing item data with description content
        
    Returns:
        A summarized version of the description content
    """

    # Initialize OpenAI client
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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

IMPORTANT:
- Only include information explicitly stated in the original text.
- Do NOT add any facts, details, or information not present in the source material.
- Do NOT infer, interpret, or reword content beyond what is directly stated.
- The summary must be a maximum of 160 characters.

Output Formatting Rules:
- Return only raw HTML using the allowed tags: <p>, <ul>, and <li>.
- Do not wrap the output in triple backticks or any code block annotations.
- Do not include any explanatory text outside of the HTML.
- Use <p> if needed to wrap the entire summary. Do not use any other tags.

Strict Limitations:
- You must not use any HTML tags besides <p>, <ul>, and <li>. Prohibited tags include <b>, <strong>, <em>, <span>, <div>, <h1>–<h6>, <br>, <sup>, <sub>, <table>, and others.
- Do not use HTML entities (e.g., &nbsp;, &copy;). Use plain characters only.
- Do not nest <p> tags inside <li> elements. Each <li> must contain plain text only.
- Do not include tag attributes, classes, or styles.
- It is invalid to place any header tags (<h1>–<h6>) inside paragraph tags (<p>). Headers and paragraphs must be separate elements.

## Original content:
{description_content}
### END OF Original content
"""

    try:
        print(f'Summarizing {q_item["drugName"]}...')
        
        # Get rate limiter for the model
        model = "gpt-4o"
        rate_limiter = get_rate_limiter(model)
        
        # Use rate limiter before making the API call
        async with rate_limiter:
            # Use GPT-4 for the best summarization quality
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a precise summarization assistant. Your task is to create accurate, concise summaries that contain only information explicitly stated in the source text. Never add facts, details, or information that is not present in the original content. Focus on extracting and condensing the key information while maintaining factual accuracy."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for more deterministic output
                max_tokens=500,  # Reasonable limit for summaries
            )

        print(f'Summarized {q_item["drugName"]}...')

        summary = response.choices[0].message.content.strip()
        return summary

    except Exception as e:
        print(f"Error during summarization: {e}")
        # Return a fallback summary or the original content
        return f"Error in summarization: {str(e)}"


async def summarize_description(q_item: Dict[str, Any]) -> str:
    """
    Summarizes the description content from a q_item dictionary using GPT-4
    without hallucinating or adding information not present in the original text.

    Args:
        q_item: A dictionary containing item data with description content

    Returns:
        A summarized version of the description content
    """

    # Initialize OpenAI client
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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

IMPORTANT:
- Only include information explicitly stated in the original text.
- Do NOT add any facts, details, or information not present in the source material.
- Do NOT infer, interpret, or reword content beyond what is directly stated.

Output Formatting Rules:
- Return only raw HTML using the allowed tags: <p>, <ul>, and <li>.
- Do not wrap the output in triple backticks or any code block annotations.
- Do not include any explanatory text outside of the HTML.
- Use <p> if needed to wrap the entire summary. Do not use any other tags.

Strict Limitations:
- You must not use any HTML tags besides <p>, <ul>, and <li>. Prohibited tags include <b>, <strong>, <em>, <span>, <div>, <h1>–<h6>, <br>, <sup>, <sub>, <table>, and others.
- Do not use HTML entities (e.g., &nbsp;, &copy;). Use plain characters only.
- Do not nest <p> tags inside <li> elements. Each <li> must contain plain text only.
- Do not include tag attributes, classes, or styles.
- It is invalid to place any header tags (<h1>–<h6>) inside paragraph tags (<p>). Headers and paragraphs must be separate elements.

## Original content:
{description_content}
### END OF Original content
"""

    try:
        print(f'Summarizing {q_item["drugName"]}...')

        # Get rate limiter for the model
        model = "gpt-4o"
        rate_limiter = get_rate_limiter(model)

        # Use rate limiter before making the API call
        async with rate_limiter:
            # Use GPT-4 for the best summarization quality
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a precise summarization assistant. Your task is to create accurate, concise summaries that contain only information explicitly stated in the source text. Never add facts, details, or information that is not present in the original content. Focus on extracting and condensing the key information while maintaining factual accuracy."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for more deterministic output
                max_tokens=500,  # Reasonable limit for summaries
            )

        print(f'Summarized {q_item["drugName"]}...')

        summary = response.choices[0].message.content.strip()
        return summary

    except Exception as e:
        print(f"Error during summarization: {e}")
        # Return a fallback summary or the original content
        return f"Error in summarization: {str(e)}"


async def summarize_use_and_conditions(q_item: Dict[str, Any]) -> str:
    """
    Summarizes the description content from a q_item dictionary using GPT-4
    without hallucinating or adding information not present in the original text.

    Args:
        q_item: A dictionary containing item data with description content

    Returns:
        A summarized version of the description content
    """

    # Initialize OpenAI client
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    content = q_item['label']['indicationsAndUsage']
    content += q_item['label']['dosageAndAdministration']

    # If no label.description found, return empty string
    if not content:
        return ""

    # Create a prompt that emphasizes summarization without hallucination
    prompt = f"""
You are a clinical documentation specialist. Your task is to extract and summarize the **therapeutic uses** of the drug and the **medical conditions it treats**, based solely on the content provided below.

Output Formatting Rules:
- Return **only raw HTML** using these allowed tags: `<p>`, `<ul>`, and `<li>`.
- Do **not** wrap the output in triple backticks (```) or any language annotations like `html`.
- Do **not** include any extraneous text before or after the HTML (e.g., explanations, labels, or markdown).
- Wrap section headings (e.g., "Approved Indications") in `<h3>` tags.
- Use `<ul>` and `<li>` for lists of specific indications or conditions.

Additional Restrictions:
- You must not use any HTML tags other than <p>, <ul>, and <li>. Prohibited tags include (but are not limited to): <b>, <strong>, <em>, <i>, <u>, <span>, <div>, <h1>–<h6>, <br>, <sup>, <sub>, <table>, <ol>, <blockquote>, <code>, and <style>.
- Do not use any inline CSS, tag attributes, or class names.
- Do not include HTML entities such as &nbsp;, &lt;, &gt;, &amp;, &copy;, etc. Use plain text characters only.
- If emphasis, sectioning, or formatting is necessary, convey it using plain language and the allowed tags only.
- Do not place <p> tags inside <li> elements. Each <li> must contain plain text only—no nested <p> tags.
- It is invalid to place any header tags (<h1>–<h6>) inside paragraph tags (<p>). Headers and paragraphs must be separate elements.
- Any output containing disallowed tags, attributes, or entities will be treated as invalid.

Clinical Guidelines:
- Use only the information contained in the provided data. Do **not** rely on external sources or medical knowledge.
- Extract and clearly identify:
  - Approved indications
  - Conditional or accelerated approvals
  - Off-label uses (only if explicitly stated)
- Include treatment context if present (e.g., line of therapy, target population).
- Do **not** fabricate or infer missing information.
- Exclude unrelated clinical details (e.g., dosage, pharmacokinetics) unless directly stated within an indication.

## BEGIN Drug Data:
{content}
## END Drug Data
"""

    try:
        print(f'Summarizing Uses and Conditions {q_item["drugName"]}...')
        
        # Get rate limiter for the model
        model = "gpt-4o"
        rate_limiter = get_rate_limiter(model)
        
        # Use rate limiter before making the API call
        async with rate_limiter:
            # Use GPT-4 for the best summarization quality
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": prompt},
                ],
                temperature=0.1,  # Low temperature for more deterministic output
                max_tokens=500,
            )

        print(f'Summarized Uses and Conditions {q_item["drugName"]}...')

        summary = response.choices[0].message.content.strip()
        return summary

    except Exception as e:
        print(f"Error during summarization: {e}")
        # Return a fallback summary or the original content
        return f"Error in summarization: {str(e)}"


async def summarize_contra_indications(q_item: Dict[str, Any]) -> str:
    """
    Summarizes the description content from a q_item dictionary using GPT-4
    without hallucinating or adding information not present in the original text.

    Args:
        q_item: A dictionary containing item data with description content

    Returns:
        A summarized version of the description content
    """

    # Initialize OpenAI client
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    content = q_item['label']['contraindications']
    # content += q_item['label']['warningsAndPrecautions']

    # If no label.description found, return empty string
    if not content:
        return ""

    # Create a prompt that emphasizes summarization without hallucination
    prompt = f"""
You are a clinical documentation specialist. Your task is to extract and summarize the **contraindications** associated with the drug, based solely on the content provided below.

Output Formatting Rules:
- Return **only raw HTML** using the following allowed tags: `<p>`, `<ul>`, and `<li>`, `<h3>`.
- Do **not** include triple backticks (```) or any code block annotations (e.g., `html`).
- Do **not** include any explanatory or extra text outside of the HTML itself.
- Use `<h3>` for section labels (e.g., "Contraindications").
- Use `<ul>` and `<li>` for listing individual contraindications or warnings.

When No Contraindications Are Found:
- If no contraindications are explicitly stated in the input, return exactly the following:

`<p>No contraindications</p>`

Additional Restrictions:
- You must not use any HTML tags other than <p>, <ul>, and <li>. Prohibited tags include (but are not limited to): <b>, <strong>, <em>, <i>, <u>, <span>, <div>, <h1>–<h6>, <br>, <sup>, <sub>, <table>, <ol>, <blockquote>, <code>, and <style>.
- Do not use any inline CSS, tag attributes, or class names.
- Do not include HTML entities such as &nbsp;, &lt;, &gt;, &amp;, &copy;, etc. Use plain text characters only.
- If emphasis, sectioning, or formatting is necessary, convey it using plain language and the allowed tags only.
- Do not place <p> tags inside <li> elements. Each <li> must contain plain text only—no nested <p> tags.
- It is invalid to place any header tags (<h1>–<h6>) inside paragraph tags (<p>). Headers and paragraphs must be separate elements.
- Any output containing disallowed tags, attributes, or entities will be treated as invalid.

Clinical Guidelines:
- Extract only what is explicitly mentioned in the input. Do **not** infer or add information not clearly stated.
- Separate the following clearly:
  - **Contraindications** (i.e., conditions or factors where use of the drug is prohibited)
- Preserve any severity or condition-specific language (e.g., "Severe hepatic impairment," "Risk of QT prolongation").
- Exclude unrelated data (e.g., dosage or efficacy) unless it is directly tied to the contraindication.
- Do **not** use any external sources or general medical knowledge.

## BEGIN Drug Data:
{content}
## END Drug Data
"""

    try:
        print(f'Summarizing Uses and Conditions {q_item["drugName"]}...')
        
        # Get rate limiter for the model
        model = "gpt-4o"
        rate_limiter = get_rate_limiter(model)
        
        # Use rate limiter before making the API call
        async with rate_limiter:
            # Use GPT-4 for the best summarization quality
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": prompt},
                ],
                temperature=0.1,  # Low temperature for more deterministic output
                max_tokens=500,
            )

        print(f'Summarized Uses and Conditions {q_item["drugName"]}...')

        summary = response.choices[0].message.content.strip()
        return summary

    except Exception as e:
        print(f"Error during summarization: {e}")
        # Return a fallback summary or the original content
        return f"Error in summarization: {str(e)}"

async def summarize_warnings(q_item: Dict[str, Any]) -> str:
    """
    Summarizes the description content from a q_item dictionary using GPT-4
    without hallucinating or adding information not present in the original text.

    Args:
        q_item: A dictionary containing item data with description content

    Returns:
        A summarized version of the description content
    """

    # Initialize OpenAI client
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    content = q_item['label']['warningsAndPrecautions']

    # If no label.description found, return empty string
    if not content:
        return ""

    # Create a prompt that emphasizes summarization without hallucination
    prompt = f"""
You are a clinical documentation specialist. Your task is to extract and summarize the **warnings or precautions** associated with the drug, based solely on the content provided below.

Output Formatting Rules:
- Return **only raw HTML** using the following allowed tags: `<p>`, `<ul>`, and `<li>`, `<h3>`.
- Do **not** include triple backticks (```) or any code block annotations (e.g., `html`).
- Do **not** include any explanatory or extra text outside of the HTML itself.
- Use `<h3>` for section labels (e.g., "Warnings and Precautions").
- Use `<ul>` and `<li>` for listing individual contraindications or warnings.

Additional Restrictions:
- You must not use any HTML tags other than <p>, <ul>, and <li>. Prohibited tags include (but are not limited to): <b>, <strong>, <em>, <i>, <u>, <span>, <div>, <h1>–<h6>, <br>, <sup>, <sub>, <table>, <ol>, <blockquote>, <code>, and <style>.
- Do not use any inline CSS, tag attributes, or class names.
- Do not include HTML entities such as &nbsp;, &lt;, &gt;, &amp;, &copy;, etc. Use plain text characters only.
- If emphasis, sectioning, or formatting is necessary, convey it using plain language and the allowed tags only.
- Do not place <p> tags inside <li> elements. Each <li> must contain plain text only—no nested <p> tags.
- It is invalid to place any header tags (<h1>–<h6>) inside paragraph tags (<p>). Headers and paragraphs must be separate elements.
- Any output containing disallowed tags, attributes, or entities will be treated as invalid.

Clinical Guidelines:
- Extract only what is explicitly mentioned in the input. Do **not** infer or add information not clearly stated.
- Separate the following clearly:
  - **Warnings and Precautions** (i.e., safety considerations, boxed warnings, monitoring needs, risk factors)
- Preserve any severity or condition-specific language (e.g., "Severe hepatic impairment," "Risk of QT prolongation").
- Exclude unrelated data (e.g., dosage or efficacy) unless it is directly tied to the warning.
- Do **not** use any external sources or general medical knowledge.

## BEGIN Drug Data:
{content}
## END Drug Data
"""

    try:
        print(f'Summarizing Uses and Conditions {q_item["drugName"]}...')
        
        # Get rate limiter for the model
        model = "gpt-4o"
        rate_limiter = get_rate_limiter(model)
        
        # Use rate limiter before making the API call
        async with rate_limiter:
            # Use GPT-4 for the best summarization quality
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": prompt},
                ],
                temperature=0.1,  # Low temperature for more deterministic output
                max_tokens=500,
            )

        print(f'Summarized Uses and Conditions {q_item["drugName"]}...')

        summary = response.choices[0].message.content.strip()
        return summary

    except Exception as e:
        print(f"Error during summarization: {e}")
        # Return a fallback summary or the original content
        return f"Error in summarization: {str(e)}"


async def summarize_dosing(q_item: Dict[str, Any]) -> str:
    """
    Summarizes the description content from a q_item dictionary using GPT-4
    without hallucinating or adding information not present in the original text.

    Args:
        q_item: A dictionary containing item data with description content

    Returns:
        A summarized version of the description content
    """

    # Initialize OpenAI client
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    content = q_item['label']['dosageAndAdministration']
    content += q_item['label']['dosageFormsAndStrengths']

    # If no label.description found, return empty string
    if not content:
        return ""

    # Create a prompt that emphasizes summarization without hallucination
    prompt = f"""
You are a clinical documentation specialist. Your task is to extract and summarize **dosing information** for the drug, based solely on the content provided below.

Output Formatting Rules:
- Return **only raw HTML** using the following allowed tags: `<p>`, `<ul>`, and `<li>`.
- Do **not** wrap the output in triple backticks or any code block annotations.
- Do **not** include explanatory text outside of the HTML.
- Use `<h3>` to introduce labeled sections (e.g., "Adult Dosing", "Renal Impairment").
- Use `<ul>` and `<li>` for listing specific dose instructions, regimens, or population-specific details.

Additional Restrictions:
- You must not use any HTML tags other than <p>, <ul>, and <li>. Prohibited tags include (but are not limited to): <b>, <strong>, <em>, <i>, <u>, <span>, <div>, <h1>–<h6>, <br>, <sup>, <sub>, <table>, <ol>, <blockquote>, <code>, and <style>.
- Do not use any inline CSS, tag attributes, or class names.
- Do not include HTML entities such as &nbsp;, &lt;, &gt;, &amp;, &copy;, etc. Use plain text characters only.
- If emphasis, sectioning, or formatting is necessary, convey it using plain language and the allowed tags only.
- Do not place <p> tags inside <li> elements. Each <li> must contain plain text only—no nested <p> tags.
- It is invalid to place any header tags (<h1>–<h6>) inside paragraph tags (<p>). Headers and paragraphs must be separate elements.
- Any output containing disallowed tags, attributes, or entities will be treated as invalid.

Clinical Guidelines:
- Use **only** the content provided. Do **not** refer to external sources or general drug knowledge.
- Extract clear, structured details such as:
  - Adult and pediatric dosing
  - Initial and maintenance doses
  - Frequency, route, and duration
  - Dose adjustments for renal/hepatic impairment or other conditions
- Preserve exact values (e.g., "200 mg once daily") and qualifiers (e.g., "administer with food").
- Exclude unrelated information (e.g., indications, side effects) unless directly tied to dosing.

## BEGIN Drug Data:
{content}
## END Drug Data

"""

    try:
        print(f'Summarizing Uses and Conditions {q_item["drugName"]}...')
        
        # Get rate limiter for the model
        model = "gpt-4o"
        rate_limiter = get_rate_limiter(model)
        
        # Use rate limiter before making the API call
        async with rate_limiter:
            # Use GPT-4 for the best summarization quality
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": prompt},
                ],
                temperature=0.1,  # Low temperature for more deterministic output
                max_tokens=700,
            )

        print(f'Summarized Uses and Conditions {q_item["drugName"]}...')

        summary = response.choices[0].message.content.strip()
        return summary

    except Exception as e:
        print(f"Error during summarization: {e}")
        # Return a fallback summary or the original content
        return f"Error in summarization: {str(e)}"
