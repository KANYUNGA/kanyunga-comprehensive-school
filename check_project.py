from pathlib import Path
import re

issues = []

for file in Path("app").rglob("*.ts"):
    try:
        text = file.read_text()
    except:
        continue

    if 'import { sql } from "@/lib/db"' in text:
        issues.append(f"OLD SQL IMPORT: {file}")

    if "School_settings" in text:
        issues.append(f"MISSING TABLE REFERENCE: {file}")

for file in Path("app").rglob("*.tsx"):
    try:
        text = file.read_text()
    except:
        continue

    if 'import { sql } from "@/lib/db"' in text:
        issues.append(f"OLD SQL IMPORT: {file}")

    if "School_settings" in text:
        issues.append(f"MISSING TABLE REFERENCE: {file}")

if issues:
    print("\\nProblems found:\\n")
    for item in issues:
        print("-", item)
else:
    print("✅ No obvious import/database issues found.")
