from typing import Optional
from pydantic import BaseModel


class Highlights(BaseModel):
    """Represents the highlights section of a drug label"""
    dosageAndAdministration: Optional[str] = None


class Label(BaseModel):
    """Represents the main label information for a drug"""
    genericName: Optional[str] = None
    labelerName: Optional[str] = None
    productType: Optional[str] = None
    effectiveTime: Optional[str] = None
    title: Optional[str] = None
    indicationsAndUsage: Optional[str] = None
    dosageAndAdministration: Optional[str] = None
    dosageFormsAndStrengths: Optional[str] = None
    warningsAndPrecautions: Optional[str] = None
    adverseReactions: Optional[str] = None
    clinicalPharmacology: Optional[str] = None
    clinicalStudies: Optional[str] = None
    howSupplied: Optional[str] = None
    useInSpecificPopulations: Optional[str] = None
    description: Optional[str] = None
    nonclinicalToxicology: Optional[str] = None
    instructionsForUse: Optional[str] = None
    mechanismOfAction: Optional[str] = None
    contraindications: Optional[str] = None
    highlights: Optional[Highlights] = None
    boxedWarning: Optional[str] = None
    drugInteractions: Optional[str] = None


class DrugLabel(BaseModel):
    """Represents a complete drug label entry"""
    drugName: str
    setId: str
    slug: str
    labeler: str
    label: Label 