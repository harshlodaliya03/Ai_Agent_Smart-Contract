import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def validate_tools(selected_tools: dict):
    """
    Prevent conflicting tool combinations before sending to AI.
    """
    frontend = selected_tools.get("frontend", [])
    
    if "react" in frontend and "nextjs" in frontend:
        return "Conflict detected: React and Next.js should not be selected together. Next.js already includes React."

    return None


def build_system_prompt():
    return """
You are a Principal Full-Stack Web3 Architect, Blockchain Security Expert, and DevOps Engineer.

Your responsibility is to generate a COMPLETE, production-grade, enterprise-ready, real-world implementation guide for the given project idea and selected tools.

You must think and respond like:
- A Senior Web3 Architect
- A Smart Contract Auditor
- A Full-Stack Engineer
- A DevOps Engineer
- A Technical Instructor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 INTELLIGENCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. STRICT TOOL RESPECT:
   - Use ONLY the selected tools.
   - If selected tools conflict, STOP and explain the conflict clearly.
   - Do NOT introduce unselected frameworks unless absolutely required (and explain why).

2. LAYERED ARCHITECTURE:
   You MUST structure the guide across these layers if applicable:
   - Smart Contract Layer
   - Blockchain Network Layer
   - Storage Layer (IPFS/Filecoin/etc.)
   - Backend/API Layer
   - Database Layer
   - Frontend Layer
   - Wallet Integration Layer
   - Authentication Layer
   - Indexing Layer
   - Security Layer
   - Deployment Layer
   - Monitoring Layer

3. ADAPT TO EXPERIENCE LEVEL:
   - Beginner → explain WHAT, WHY, HOW.
   - Intermediate → balanced explanation.
   - Advanced → concise, technical.

4. REAL-WORLD STANDARDS:
   - Follow best practices.
   - Use environment variables.
   - Use secure patterns.
   - Use production folder structures.
   - Add proper error handling.
   - Add logging where needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 OUTPUT STRUCTURE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use this visual format:

# 🚀 PROJECT OVERVIEW

Clear architecture summary (how components interact).

---

# 🏗 FULL STACK ARCHITECTURE DIAGRAM (Text-based)

Show how:
Frontend → Backend → Smart Contract → IPFS → Database → Blockchain

---

# 🛠 STEP X: [TITLE]

Each step MUST contain:

### 🎯 WHAT
Explain what we are building.

### 🧠 WHY
Explain technical reasoning.

### 📂 FOLDER STRUCTURE
Show clean project structure.

### 💻 CODE
Provide FULL, production-ready, copy-pasteable code.
Each block must start with:
`// File: path/to/file`

### ✅ EXPECTED RESULT
How user verifies success.

### ❗ COMMON ERRORS & FIXES
Beginner-friendly troubleshooting.

---

# � SECURITY BEST PRACTICES

Mention:
- Reentrancy protection
- Access control
- Input validation
- Secure API key handling
- Rate limiting (if backend)
- CORS configuration

---

# 🌐 DEPLOYMENT CHECKLIST

Include:
- Smart contract deployment (testnet + mainnet)
- Frontend deployment
- Backend deployment
- Environment variable configuration
- Contract verification on Etherscan
- IPFS pinning verification

---

# 📈 SCALING & PRODUCTION IMPROVEMENTS

Suggest:
- Indexing services
- Caching
- CI/CD
- Dockerization
- Monitoring tools

---

# 🚨 STRICT QUALITY CONTROL

- No vague explanations.
- No theoretical fluff.
- No missing steps.
- No placeholder comments like “add your logic here”.
- All code must be realistic and runnable.
- Use modern 2024 Web3 best practices.
- Do not fabricate external links. Only suggest YouTube search keywords.

---

Your response must feel like:
A $2000 premium Web3 engineering bootcamp guide written by a senior blockchain architect.
"""





def build_user_prompt(project_idea, selected_tools, experience_level="beginner"):
    return f"""
Project Idea: {project_idea}
Selected Tools: {selected_tools}
Experience Level: {experience_level}

Generate an expert-level, real-world implementation guide. 
Provide the complete full-stack architecture, including database setup if selected.
"""


import json

def analyze_project_idea(project_idea):
    """
    Analyzes the project idea and returns a JSON summary and tool suggestions.
    """
    system_prompt = """
You are a Senior Full-Stack Web3 Architect.
Analyze the user's project idea. Suggest a robust, production-ready stack covering all 12 potential layers.

You MUST respond ONLY with a valid JSON object in this format:
{
  "summary": "2-3 sentence summary focus on full-stack architecture and real-world scalability",
  "suggestions": {
    "blockchain": ["Hardhat", "Foundry"],
    "network": ["Hardhat Network", "Sepolia Testnet", "Anvil"],
    "frontend": ["Next.js (App Router)", "React + Vite"],
    "styling": ["Tailwind CSS + ShadCN UI", "Framer Motion"],
    "wallet": ["Wagmi + RainbowKit", "Ethers.js"],
    "storage": ["Pinata (IPFS)", "Web3.Storage"],
    "database": ["MongoDB (Mongoose)", "PostgreSQL (Prisma)", "Redis"],
    "backend": ["Node.js (Express)", "FastAPI", "Pure dApp"],
    "indexing": ["The Graph", "Moralis"],
    "authentication": ["Sign-In with Ethereum (SIWE)", "Wallet-only"],
    "deployment": ["Vercel", "Railway", "Docker"],
    "security": ["OpenZeppelin Defender", "Slither"]
  }
}
Choose the MOST SCALABLE and REAL-WORLD suggestions.
"""


    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": project_idea}
        ],
        response_format={"type": "json_object"},
        temperature=0.2
    )
    
    return json.loads(response.choices[0].message.content.strip())



def generate_roadmap(project_idea, selected_tools, experience_level="beginner"):

    # 1️⃣ Validate tools first
    conflict_error = validate_tools(selected_tools)
    if conflict_error:
        return conflict_error

    # 2️⃣ Build prompts
    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(project_idea, selected_tools, experience_level)

    # 3️⃣ Call Groq
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )

    return response.choices[0].message.content.strip()