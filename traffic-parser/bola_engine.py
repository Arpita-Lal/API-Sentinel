import sys
import re
from typing import Dict, Set
from models import APITransaction

class BOLAEngine:
    def __init__(self):
        # Maps object_id to a set of user_ids that have accessed/own it
        self.object_owners: Dict[str, Set[str]] = {}
        
        # Regex to extract an object ID from a RESTful path, e.g. /api/documents/123
        self.object_id_pattern = re.compile(r'^/api/[^/]+/([^/]+)$')

    def extract_user_id(self, txn: APITransaction) -> str:
        """Extracts the user identity from the request headers."""
        # Using a simple custom header for the prototype
        return txn.request.headers.get("x-user-id")

    def extract_object_id(self, txn: APITransaction) -> str:
        """Extracts the target object ID from the URL path."""
        match = self.object_id_pattern.match(txn.request.path)
        if match:
            # e.g., if path is /api/documents/doc-123, returns 'doc-123'
            return match.group(1)
        return None

    def process_transaction(self, txn: APITransaction):
        """Analyzes a transaction for BOLA vulnerabilities."""
        user_id = self.extract_user_id(txn)
        object_id = self.extract_object_id(txn)

        if not user_id or not object_id:
            # If we can't identify the user or the object, we can't run BOLA heuristics
            return

        method = txn.request.method.upper()

        if method == "POST":
            # Resource Creation: Map the new object to the user who created it
            if object_id not in self.object_owners:
                self.object_owners[object_id] = set()
            self.object_owners[object_id].add(user_id)
            
        elif method in ("GET", "PUT", "PATCH", "DELETE"):
            # Resource Access/Modification
            if object_id in self.object_owners:
                if user_id not in self.object_owners[object_id]:
                    # The object exists and is owned by someone else!
                    print(f"\n[BOLA ALERT] User '{user_id}' attempted unauthorized {method} access on Object '{object_id}'!", file=sys.stderr)
            else:
                # Object is accessed for the first time by this engine, assume ownership
                self.object_owners[object_id] = {user_id}
