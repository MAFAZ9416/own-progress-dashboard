from typing import TypedDict, List, Optional, Dict


class AttachmentDict(TypedDict):
    name: str
    content: str  # Base64 encoded content


class EmailPayloadDict(TypedDict, total=False):
    sender: Dict[str, str]
    to: List[Dict[str, str]]
    subject: str
    htmlContent: str
    textContent: Optional[str]
    replyTo: Optional[Dict[str, str]]
    attachment: Optional[List[AttachmentDict]]
