import openai
import os
from typing import Optional

from openai.types.chat import ChatCompletionUserMessageParam

prompt = """
You are an expert in clinical data presentation. Your task is to process raw HTML drug labeling content and convert it into clear, fully detailed, human-readable output suitable for healthcare providers.

The HTML may include:
- Tables with structured data (e.g. dosage forms, adverse reactions, pharmacokinetics)
- Headings and subheadings (e.g. INDICATIONS AND USAGE, WARNINGS AND PRECAUTIONS)
- Paragraph content
- Nested or complex HTML structures

Your instructions are:

1. **Preserve All Information**  
   Do not summarize, simplify, or omit any clinical content. Retain every detail, including medical terminology, dosage specifications, adverse reactions, numeric values, and regulatory language.

2. **Convert Tables to Text with Clear Labels**  
   For every table:
   - Spell out its contents as paragraph text or as a list.
   - Explicitly state row and column relationships (e.g., “Route of Administration: Oral” or “Adverse Reaction – Frequency: Headache – 12%”).
   - Maintain the structure and order of data as presented in the table.

3. **Clarify Implicit Structure**  
   Use full sentences when necessary to clarify conditional statements or lists. However, do not reword clinical terms or dilute the document’s regulatory tone.

4. **Maintain Document Structure and Headings**  
   Preserve all section titles and their order (e.g., “5 WARNINGS AND PRECAUTIONS”). Reflect the document’s original layout in your response.

5. **Restrict Output to Specific HTML Tags**  
   You must only use the following HTML tags in your output:  
   `<p>`, `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<ul>`, `<ol>`, `<li>`, `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>`
   All other tags (e.g., `<div>`, `<span>`, `<br>`, `<sup>`) must be removed or replaced with allowed structure.

6. **Enforce Table Semantics**  
   Every `<table>` element **must include** both `<thead>` and `<tbody>` tags. Tables must be well-formed, semantic, and accessible. Do not omit these structural tags, even for simple tables.

7. **Do Not Add or Invent Content**  
   You must not fabricate any medical, regulatory, or explanatory content. The output must strictly reflect the source HTML provided.

8. **Output Format**  
   Return valid HTML composed only of the permitted tags.  
   **Do not wrap the output in triple backticks (` ``` `) or any fenced code blocks. Output raw HTML only—no Markdown formatting, scripting, or metadata.**

9. **Target Audience**  
   The final content is intended for licensed clinicians (e.g., MDs, DOs, NPs, PharmDs) who require high-fidelity, regulation-compliant language—rendered in a clean, readable format for digital presentation.

10. **No Interpretation, No Inference, No Assumption**  
    Do not interpret the data or assume meaning beyond what is explicitly present in the HTML. If a term or value appears ambiguous, retain it as-is without rephrasing or explanation.

11. **Do Not Synthesize Clinical Recommendations**  
    You must not generate summaries, recommendations, or interpretations that suggest how a provider should act on the information. Your task is structural transformation only.

12. **No Content Creation from Context**  
    You are not permitted to infer or construct missing data based on context. If data appears incomplete or truncated in the HTML, leave it as-is and do not attempt to complete it.

13. **Reflect Only What Is Present**  
    Your response must be a one-to-one representation of the input, expressed in the permitted output format. Treat all input as authoritative. Do not incorporate external knowledge or training data.

14. **Avoid Generalization Phrases**  
    Do not use phrases such as “may include,” “commonly known as,” “often used for,” “typically,” or any other language that introduces generalized or external context.

15. **No External Language Model Knowledge**  
    This is a strict transformation task. You are prohibited from referencing or applying prior knowledge from training. Only operate on the provided HTML input.

16. Remove Superscript Tags and Content
    Superscript tags (<sup>) and their contents must be completely removed. Do not include superscripted characters, footnote markers, or similar inline annotations in the output.

Here is the HTML content to process:


"""

def enhance_content(text: str) -> str:
    """
    Enhances content using GPT-4o with the predefined clinical data presentation prompt.
    
    Args:
        text (str): The HTML content to be processed
        api_key (Optional[str]): OpenAI API key. If not provided, will use OPENAI_API_KEY environment variable.
    
    Returns:
        str: The enhanced content processed by GPT-4o
    
    Raises:
        ValueError: If no API key is provided and OPENAI_API_KEY environment variable is not set
        openai.OpenAIError: If there's an error with the OpenAI API call
    """
    # Get API key from parameter or environment variable
    api_key = os.getenv('OPENAI_API_KEY')
    # Initialize OpenAI client
    client = openai.OpenAI(api_key=api_key)
    
    try:
        # Create the full prompt by combining the predefined prompt with the input text
        full_prompt = prompt + text

        print('Enhancing Content...')

        # Call GPT-4o
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                ChatCompletionUserMessageParam(role="user", content=full_prompt)
            ],
            temperature=0.1,  # Low temperature for consistent, structured output
            max_tokens=4000   # Adjust based on your needs
        )

        print('Content enhanced')

        # Extract and return the response content
        return response.choices[0].message.content.strip()
        
    except openai.OpenAIError as e:
        raise openai.OpenAIError(f"Error calling OpenAI API: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error: {str(e)}")