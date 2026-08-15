import json
import re
import sys
from typing import Dict, Any, List

def generalize_path(path: str) -> str:
    """
    Replaces common URL patterns like integers and UUIDs with parameterized placeholders.
    e.g., /api/users/123 -> /api/users/{id}
          /items/550e8400-e29b-41d4-a716-446655440000 -> /items/{uuid}
    """
    # Replace UUIDs
    path = re.sub(r'[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}', '{uuid}', path)
    # Replace integers
    path = re.sub(r'\b\d+\b', '{id}', path)
    return path

class DiscoveryEngine:
    def __init__(self, official_spec_path: str = None, output_schema_path: str = "discovered_openapi.json"):
        self.output_schema_path = output_schema_path
        self.official_spec = {}
        self.discovered_schema = {
            "openapi": "3.0.0",
            "info": {
                "title": "Discovered API Schema",
                "version": "1.0.0"
            },
            "paths": {}
        }
        
        if official_spec_path:
            try:
                with open(official_spec_path, 'r') as f:
                    self.official_spec = json.load(f)
                print(f"[*] Loaded official spec from {official_spec_path}", file=sys.stderr)
            except Exception as e:
                print(f"[!] Failed to load official spec: {e}", file=sys.stderr)

    def process_transaction(self, txn) -> None:
        """
        Process a completed APITransaction, update the discovered schema,
        and emit a Shadow API alert if the endpoint isn't documented.
        """
        raw_path = txn.request.path
        method = txn.request.method.lower()
        
        # Generalize the path
        # Assuming path might have query params, strip them for path matching
        base_path = raw_path.split('?')[0]
        gen_path = generalize_path(base_path)
        
        # Check against official spec for Shadow API detection
        is_documented = False
        if "paths" in self.official_spec:
            for spec_path, path_entry in self.official_spec["paths"].items():
                # Convert OpenAPI path template (e.g. /api/documents/{doc_id}) to regex (^/api/documents/[^/]+$)
                regex_pattern = re.sub(r'\{[^}]+\}', r'[^/]+', spec_path)
                if re.match(f"^{regex_pattern}$", base_path):
                    if method in path_entry:
                        is_documented = True
                        break

        if not is_documented:
            print(f"[SHADOW API DETECTED] Unregistered endpoint accessed: {method.upper()} {raw_path}", file=sys.stderr)
            txn.threat_type = "SHADOW_API"

        # Update discovered schema
        paths = self.discovered_schema["paths"]
        if gen_path not in paths:
            paths[gen_path] = {}
        
        if method not in paths[gen_path]:
            paths[gen_path][method] = {
                "summary": f"Discovered {method.upper()} endpoint",
                "responses": {}
            }
            
        operation = paths[gen_path][method]
        
        # Record response status code
        if txn.response:
            status = str(txn.response.status_code)
            if status not in operation["responses"]:
                operation["responses"][status] = {
                    "description": "Auto-discovered response"
                }
                
        self._save_schema()

    def _save_schema(self):
        """Periodically dump the discovered schema."""
        try:
            with open(self.output_schema_path, 'w') as f:
                json.dump(self.discovered_schema, f, indent=2)
        except Exception as e:
            print(f"[!] Failed to save discovered schema: {e}", file=sys.stderr)

