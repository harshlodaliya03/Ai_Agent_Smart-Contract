import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def evaluate_prompt(user_prompt):
    system_prompt = """
You are an AI requirements engineer for a Solidity Smart Contract developer platform.
Your job is to read a user's prompt asking to generate a smart contract.

If the user's prompt is written in clear English AND contains enough technical details (e.g., token name, features wanted, business logic), respond EXACTLY with the word: CLEAR

If it is written in broken English, is too vague, or lacks details, rewrite it into a highly detailed, professional Solidity smart contract requirement specification.
Respond ONLY with the rewritten prompt. DO NOT include "Here is the rewritten prompt:" or any conversational text.
Do NOT generate code. Only rewrite the requirements clearly so the user can confirm them.
"""
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )
    return response.choices[0].message.content.strip()

def generate_contract(user_prompt):
    system_prompt = """
You are an elite Solidity Senior Developer.
You ONLY write Solidity (>=0.8.0) Smart Contracts.
You will be given a prompt to write a contract.

CRITICAL RULES:
1. You MUST output ONLY the raw Solidity code inside a single Markdown code block (```solidity ... ```).
2. DO NOT output ANY other programming language. If the user asks to write in Python, Rust, JavaScript, etc., output a Solidity contract that contains a comment saying "// Error: Only Solidity is supported by this agent."
3. DO NOT include ANY conversational text, explanations, or summaries. ONLY output the Markdown code block.
4. Include essential security practices, custom errors instead of requires, comments, and modern patterns.
"""
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Write a smart contract based on these requirements:\n\n{user_prompt}"}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content.strip()
