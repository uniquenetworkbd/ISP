#!/usr/bin/env python3
"""Fail CI when frontend API calls drift from the shared API client contract."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
CLIENT = ROOT / "js" / "api-client.js"
JS_ROOT = ROOT / "js"

client = CLIENT.read_text(encoding="utf-8")
declared = set(re.findall(r"^ {4}([A-Za-z_$][\\w$]*)\\s*:", client, re.MULTILINE))
if not declared:
    raise SystemExit("No API client methods found")

errors = []
checked = 0
for path in sorted(JS_ROOT.rglob("*.js")):
    if path == CLIENT:
        continue
    source = path.read_text(encoding="utf-8")
    for match in re.finditer(r"\bapi\??\.([A-Za-z_$][\w$]*)\s*\(", source):
        method = match.group(1)
        checked += 1
        if method not in declared:
            line = source.count("\n", 0, match.start()) + 1
            errors.append(f"{path.relative_to(ROOT)}:{line}: api.{method}() is not declared in js/api-client.js")
    if path.name == "mikrotik-login-page.js":
        if "document.querySelector('[data-mk-form]')" not in source:
            errors.append("Loaded MikroTik form selector is missing or malformed")
        if "api.mikrotikTestConnection(" not in source or "api.mikrotikCreateServer(" not in source:
            errors.append("Loaded MikroTik page must use the declared test/save API methods")
        if "status('Saved & connected'" in source or "status('Saved & connected'," in source:
            errors.append("MikroTik save action must not claim a live connection before a successful probe")

if errors:
    print("Frontend API contract validation failed:")
    print("\n".join(f"- {error}" for error in errors))
    sys.exit(1)

print(f"Frontend API contract validation passed: {checked} API call sites checked against {len(declared)} declared client methods.")
