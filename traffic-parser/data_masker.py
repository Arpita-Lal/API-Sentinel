import re
from typing import Any, Dict

class DataMasker:
    # Common regex patterns for PII
    PATTERNS = [
        # Email
        re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'),
        # SSN (basic US format)
        re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
        # Credit Card (basic 16 digit format)
        re.compile(r'\b(?:\d[ -]*?){13,16}\b'),
        # Phone numbers (common international and US formats)
        re.compile(r'\+?\d{1,3}?[- .]?\(?(?:\d{2,3})\)?[- .]?\d\d\d[- .]?\d\d\d\d'),
    ]

    # Keys that should be masked regardless of their value
    SENSITIVE_KEYS = {
        'password', 'passwd', 'pwd', 
        'secret', 'token', 'access_token', 'refresh_token',
        'ssn', 'social_security',
        'credit_card', 'cc_number', 'card_number', 'cvv', 'cvc',
        'salary', 'income'
    }

    MASK_STRING = "***MASKED***"

    @classmethod
    def mask_string(cls, text: str) -> str:
        """Applies regex masking to a raw string."""
        if not text:
            return text
        masked_text = text
        for pattern in cls.PATTERNS:
            masked_text = pattern.sub(cls.MASK_STRING, masked_text)
        return masked_text

    @classmethod
    def mask_json(cls, data: Any) -> Any:
        """Recursively traverses a JSON structure and masks sensitive keys and string values."""
        if isinstance(data, dict):
            masked_dict = {}
            for key, value in data.items():
                # If the key itself implies sensitive data, mask the whole value
                if any(sens_key in key.lower() for sens_key in cls.SENSITIVE_KEYS):
                    masked_dict[key] = cls.MASK_STRING
                else:
                    masked_dict[key] = cls.mask_json(value)
            return masked_dict
        elif isinstance(data, list):
            return [cls.mask_json(item) for item in data]
        elif isinstance(data, str):
            return cls.mask_string(data)
        else:
            return data
