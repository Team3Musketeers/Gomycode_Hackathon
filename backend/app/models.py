from typing import Literal, Optional
from pydantic import BaseModel, Field

Recipe = Literal["python2to3", "js_callback_async"]
Confidence = Literal["safe_to_merge", "needs_human_review"]


class RefactorRequest(BaseModel):
    code: str = Field(..., min_length=1, description="Source code to migrate")
    recipe: Recipe
    filename: Optional[str] = None  # useful in repo mode (Layer 5), optional for single-snippet


class RefactorResponse(BaseModel):
    filename: Optional[str] = None
    recipe: Recipe
    refactored_code: str
    explanation: str          # Person B's "why this change" prompt output
    tests: str                # Person B's Layer 2 prompt output (text, dry-run framing)
    security_notes: str       # Person B's Layer 3 prompt output
    confidence: Confidence    # Layer 4 rule, added on top of the above
    confidence_reason: Optional[str] = None  # one-line reasoning string (Layer 4)


class RepoFile(BaseModel):
    filename: str
    code: str


class RefactorRepoRequest(BaseModel):
    recipe: Recipe
    files: list[RepoFile] = Field(..., min_length=1, max_length=10)


class RefactorRepoResponse(BaseModel):
    results: list[RefactorResponse]
    failed: list[dict] = Field(default_factory=list)  # [{filename, error}]