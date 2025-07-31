from temporalio import activity
from typing import Type, List, Optional
from langchain_core.pydantic_v1 import BaseModel, Field
from worker.services.structured_response import get_structured_response
from datetime import date
from pydantic import ConfigDict

class DosingInfo(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    group: str = Field(description="Target population or condition (e.g., adults, pediatrics, renal impairment).")
    amount: str = Field(description="Dose amount (e.g., 500mg)")
    frequency: str = Field(description="How often the drug should be taken (e.g., twice daily)")
    route: str = Field(description="Route of administration (e.g., oral, IV)")

class DrugData(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    drugName: str = Field(description="The name of the drug (brand or generic).")
    indications: List[str] = Field(description="Approved uses or conditions the drug treats.")
    contraindications: List[str] = Field(description="Conditions or factors that serve as reasons to not use the drug.")
    dosing: List[DosingInfo] = Field(description="Dosing instructions, potentially based on condition or age group.")
    warnings: List[str] = Field(description="Important warnings about the drug, including black-box warnings.")
    manufacturer: str = Field(description="The company that manufactures the drug.")
    sideEffects: Optional[List[str]] = Field(default=None, description="Known side effects of the drug.")
    interactions: Optional[List[str]] = Field(default=None, description="Known drug or substance interactions.")
    approvalDate: Optional[str] = Field(default=None, description="Date the drug was approved (e.g., FDA approval date).")
    rxNormCode: Optional[str] = Field(default=None, description="RxNorm Concept Unique Identifier (RxCUI).")
    ndcCode: Optional[str] = Field(default=None, description="National Drug Code in 10-digit format (e.g., 12345-6789-01).")
    atcCode: Optional[str] = Field(default=None, description="Anatomical Therapeutic Chemical (ATC) classification code.")
    emaId: Optional[str] = Field(default=None, description="European Medicines Agency identifier (optional).")

@activity.defn
async def process_unstructured_drug_information(unstructured_data: str) -> DrugData:

    system_prompt = """
    You are an extremely thorough data collection expert in medical information. 
    Your task is to extract structured drug information from unstructured text.

    When extracting information from HTML, be extremely thorough and precise. 
    Extract ALL relevant details, including—but not limited to—text content, numbers, names, and facts. 
    Aim to be as exact and verbatim as possible. 
    Do not worry about the length of the output—focus entirely on completeness. 
    It is critically important not to omit any information or make mistakes.
    
    Extract the following information:
    - Drug name (brand or generic)
    - Approved indications/uses
    - Contraindications
    - Dosing information (including target group, amount, frequency, route)
    - Important warnings
    - Manufacturer information
    - Side effects (if available)
    - Drug interactions (if available)
    - Approval date (if available)
    - RxNorm code (if available)
    - NDC code (if available)
    - ATC code (if available)
    - EMA ID (if available)
    
    Return the information in a structured format that matches the DrugData schema.
    """

    user_prompt = f"""
    Here is the unstructured drug information: 

    ```
    {unstructured_data}
    ```

    Please extract and structure the drug information strictly according to the schema requirements.
    """

    return get_structured_response(DrugData, system_prompt, user_prompt)