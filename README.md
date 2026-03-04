# 🤖 Smart Contract Suite

A powerful local-first platform for **Auditing**, **Generating**, and **Architecting** smart contracts, powered by specialized AI agents and the **Model Context Protocol (MCP)**.

---

## ✨ Features

-   🛡 **Smart Contract Audit**: High-speed security analysis using **Slither** and specialized AI agents.
-   💻 **Contract Generator**: Senior-level Solidity generation with 2-step requirement verification.
-   🏗 **Project Architect**: 12-layer technical roadmaps for building full-stack dApps.
-   🎓 **Learning Platform**: Gamified Solidity challenges with real-time compiler feedback.
-   📜 **History Management**: Persistent local storage of every audit and generation.

---

## 🚀 Local Setup Guide

Follow these steps to get the platform running on your local machine.

### 1. Prerequisites
- **Python 3.12** (Required for the MCP Tool Server)
- **Python 3.9+** (For the main Web Application)
- **Solidity (solc)**: Follow [Solidity Installation](https://docs.soliditylang.org/en/latest/installing-solidity.html) or use `brew install solidity`.
- **Slither**: `pip install slither-analyzer`

### 2. Installation

Clone the repository and install dependencies for both the main app and the tool server.

#### Web Application (Main App)
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### MCP Tool Server
```bash
# Create a dedicated environment for the MCP server (requires Python 3.12)
python3.12 -m venv venv_mcp
source venv_mcp/bin/activate

# Install MCP server requirements
pip install mcp slither-analyzer web3 fastapi uvicorn requests solc-select
```

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and add your **Groq API Key**.

### 4. Running the Platform

You need to run **two** separate servers simultaneously.

#### Step A: Start the MCP Tool Server (Port 8001)
The Tool Server handles the heavy lifting like security scans and compilation.
```bash
# Ensure venv_mcp is active
./venv_mcp/bin/python3.12 mcp_server.py
```

#### Step B: Start the Web Application (Port 8000)
In a new terminal window:
```bash
# Ensure venv is active
./venv/bin/python3 main.py
```

### 5. Access the UI
Open your browser and navigate to:
**[http://localhost:8000](http://localhost:8000)**

---

## 🛠 Tech Stack

- **Backend**: FastAPI, Python (Agents)
- **Frontend**: Vanilla HTML/CSS/JS (Brutalist Monochrome Theme)
- **Toolbox**: Slither, Solc, Web3.js
- **Intelligence**: Model Context Protocol (MCP), Groq (Llama 3.3)
- **Database**: SQLite (Local Persistence)
