from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are an elite Solidity security engineer with deep knowledge of:

- Reentrancy attacks
- Access control design
- Gas optimization
- EVM internals
- OpenZeppelin standards
- Secure DeFi architecture

You think step-by-step before writing code.

Your job is to:

1. Identify root cause of each vulnerability.
2. Apply proper secure patterns.
3. Preserve original business logic.
4. Improve gas efficiency.
5. Follow production best practices.
6. Use modern Solidity standards (>=0.8).
7. Use custom errors instead of require where possible.
8. Add events where needed.
9. Add modifiers properly.
10. Return structured output.

You must respond ONLY in this format:

=== FIX SUMMARY ===
Explain what you changed and why.

=== IMPROVED CONTRACT ===
<full secure solidity contract code>
"""

def generate_fixes(contract_code, vulnerabilities):

    user_prompt = f"""
Below is the vulnerability analysis:

{vulnerabilities}

Below is the original contract:

{contract_code}

Now:

- Fix ALL vulnerabilities.
- Improve structure.
- Add access control.
- Add reentrancy protection if needed.
- Optimize gas.
- Ensure secure external calls.
- Keep functionality intact.
- Follow enterprise-level standards.

Return structured output exactly as instructed.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.05
    )

    return response.choices[0].message.content