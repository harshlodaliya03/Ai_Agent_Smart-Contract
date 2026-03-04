import os
import json
from groq import Groq
from dotenv import load_dotenv
from utils.mcp_client import mcp_client

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class LearningAgent:
    @staticmethod
    def generate_tasks(selected_concepts: list, difficulty: str, count: int = 3):
        """
        Agent 1: Task Generator Agent
        Generates Solidity tasks based on concepts and difficulty.
        """
        system_prompt = f"""
You are a Solidity Instructor creating real-world coding challenges.
Generate {count} Solidity tasks based on:
Concepts: {', '.join(selected_concepts)}
Difficulty: {difficulty}

Rules:
- Each task must simulate a real-world blockchain scenario.
- Do NOT give solution.
- Provide clear requirements.
- Provide constraints.
- Provide expected behavior.
- Do NOT repeat similar tasks.
- Each task must focus only on selected concepts.
- Tasks must require writing a full contract.

You MUST respond ONLY with a valid JSON object:
{{
  "tasks": [
    {{
      "title": "Task Title",
      "description": "Problem Description",
      "requirements": ["Req 1", "Req 2"],
      "constraints": ["Constraint 1"],
      "expected_behavior": "Detail on what should happen",
      "concepts": ["Concept 1", "Concept 2"],
      "difficulty": "Easy | Medium | Hard"
    }}
  ]
}}
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": system_prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        return json.loads(response.choices[0].message.content.strip())

    @staticmethod
    def review_code(task_description: str, user_code: str):
        """
        Agent 2: Code Reviewer Agent
        Performs logical review of student submission.
        """
        system_prompt = f"""
You are a strict Solidity code reviewer.
You are reviewing student submission for the following task:
{task_description}

Your job:
1. Check if task requirements are satisfied.
2. Detect logical issues. (Syntax will be checked by a compiler elsewhere).
3. If incorrect:
   - Explain the error clearly.
   - Explain WHY the error happens.
   - Provide a HINT only.
   - DO NOT give full solution.
4. If correct:
   - Return a JSON with "status": "ACCEPTED" and "feedback": "Short encouraging feedback".

You MUST respond ONLY with a valid JSON object:
{{
  "status": "ACCEPTED" | "REJECTED",
  "explanation": "Clear error explanation (if rejected)",
  "why": "Why it happened (if rejected)",
  "hint": "Hint only (if rejected)",
  "feedback": "Short feedback (if accepted)"
}}
Be strict but helpful.
"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Student Code:\n{user_code}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content.strip())

def compile_solidity(code: str):
    """
    Utility: Compile Solidity using the MCP Tool Server.
    Returns (success, error_message)
    """
    # Use the MCP tool for compilation
    result = mcp_client.call_tool("compile_contract", {"code": code})
    
    if "Compilation Successful" in result:
        return True, None
    else:
        # Return the error message from the compiler
        return False, result
