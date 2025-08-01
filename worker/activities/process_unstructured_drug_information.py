from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from temporalio import activity
import re
import json

from services.structured_response import get_structured_response


class DosingInfo(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    group: str = Field(description="Target population or condition (e.g., adults, pediatrics, renal impairment).")
    amount: str = Field(description="Dose amount (e.g., 500mg)")
    details: str = Field(description="Additional details about the dose.")
    frequency: str = Field(description="How often the drug should be taken (e.g., twice daily)")
    route: str = Field(description="Route of administration (e.g., oral, IV)")

class DrugData(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    drugName: str = Field(description="The name of the drug")
    genericName: str = Field(description="The generic name of the drug")
    companyName: str = Field(description="The company name that is the labeler of the drug")
    indications: List[str] = Field(description="Approved uses or conditions the drug treats.")
    contraindications: List[str] = Field(description="Conditions or factors that serve as reasons to not use the drug.")
    dosing: List[DosingInfo] = Field(description="Dosing instructions, potentially based on condition or age group.")
    administration: str = Field(description="How to administer the drug")
    warnings: List[str] = Field(description="Important warnings about the drug, including black-box warnings.")
    manufacturer: str = Field(description="The company that manufactures the drug.")
    sideEffects: Optional[List[str]] = Field(default=None, description="Known side effects of the drug and any extra details included.")
    adverseReactions: Optional[List[str]] = Field(description="List of all adverse reactions.")
    interactions: Optional[List[str]] = Field(default=None, description="Known drug or substance interactions.")
    approvalDate: Optional[str] = Field(default=None, description="Date the drug was approved (e.g., FDA approval date).")
    rxNormCode: Optional[str] = Field(default=None, description="RxNorm Concept Unique Identifier (RxCUI).")
    ndcCodes: List[str] = Field(default=None, description="National Drug Code in 10-digit format (e.g., 12345-6789-01).")
    atcCode: Optional[str] = Field(default=None, description="Anatomical Therapeutic Chemical (ATC) classification code.")
    emaId: Optional[str] = Field(default=None, description="European Medicines Agency identifier (optional).")
    confidenceScore: float = Field(description="A score between 0 and 100 that represents the confidence in the extracted information.")

def remove_html_tags(text):
    """Remove HTML tags from a string, keeping only the inner text."""
    if not isinstance(text, str):
        return text
    clean = re.compile('<.*?>')
    return re.sub(clean, '\n\n', text)

def clean_json_html(obj):
    """
    Recursively remove HTML tags from all string properties in a JSON-like object.
    Returns the cleaned object in the same structure.
    """
    if isinstance(obj, dict):
        return {k: clean_json_html(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json_html(item) for item in obj]
    elif isinstance(obj, str):
        return remove_html_tags(obj)
    else:
        return json.dumps(obj)

@activity.defn
async def process_unstructured_drug_information(unstructured_data: str) -> DrugData:

    unstructured_data = clean_json_html(unstructured_data)

    extraction_system_prompt = """
    You are an extremely thorough data collection expert in drug information. 
    Your task is to extract structured drug information from unstructured text.

    When extracting information, be extremely thorough and precise. 
    Extract ALL relevant details, including—but not limited to—text content, numbers, names, and facts. 
    Do not worry about the length of the output—focus entirely on completeness. 
    It is critically important not to omit any information or make mistakes.
    It is extremely important to only obtain the exact text extracted and not modify it.
    When extracting the information, make sure you did not omit anything before or after the text that is part of the same section.
    Make any information that has parenthesis includes all the information inside the parenthesis.
    
    Extract the following information ONLY if you find it in the unstructured text:
    - Drug name
    - Approved indications/uses
    - Contraindications
    - Dosing information (including target group, amount, frequency, route)
    - Important warnings - include any warning found anywhere in the text in the warning field list.
    - Manufacturer information
    - Side effects
    - Adverse reactions - Make sure you include a complete list of adverse reactions and details included in the text about them.
    - Drug interactions
    - Approval date make sure it is in the format `YYYY-MM-DD`
    - RxNorm code (if available)
    - NDC code (if available)
    - ATC code (if available)
    - EMA ID (if available)
    - Confidence score (a score between 0 and 100 that represents the confidence in the extracted information)
    
    Return the information in a structured format that matches the DrugData schema.
    
    It's extremely important that you do not use any other information from other sources.
    Only use the unstructured data provided and extract the information from it.

    Review the extracted information to make sure:
    * All side effects are included
    * All adverse reactions are included
    * All warnings are included
    * All dosing information is included
    * All indications are included
    * All contraindications are included
    * All interactions are included
    * All manufacturer information is included
    * All NDC codes have 10 digits, is dash separated following the format: 9999-9999-99
    * All information on dosing must be include. Do not omit any details.
    
    Review the extracted information to include extra information that is mentioned with any of the fields extracted that complement the information.
    
    Review the extracted information against the unstructured data a second time to make absolutely sure there are no information missing from the unstructured data.
    For any field filled, check again where you extracted the information from the unstructured data and include all information on the same area you found that is relevant.
    You MUST be as completionist as possible on this last review.
    """

    extraction_user_prompt = f"""
    Here is the unstructured drug information: 

    ```
    {unstructured_data}
    ```

    Please extract and structure the drug information strictly according to the schema requirements.
    """

    drug_data = await get_structured_response(DrugData, extraction_system_prompt, extraction_user_prompt)
    return drug_data


