from mcp.server import Server
from mcp.types import Tool, TextContent, EmbeddedResource
import subprocess
import os
import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

# Configure environment for tools
SOLC_PATH = "/Users/harsh/.solc-select/artifacts/solc-0.8.20/solc-0.8.20"
os.environ["PATH"] = f"/Users/harsh/Desktop/Ai-agent/venv_mcp/bin:{os.path.dirname(SOLC_PATH)}:" + os.environ["PATH"]
os.environ["SOLC"] = SOLC_PATH

# Initialize MCP Server
mcp_server = Server("SmartContractTools")

# Tool Functions
def run_slither(contract_path: str) -> str:
    if not os.path.exists(contract_path):
        return f"Error: File not found at {contract_path}"
    
    # Use the absolute path for slither in the MCP venv
    slither_path = "/Users/harsh/Desktop/Ai-agent/venv_mcp/bin/slither"
    
    try:
        result = subprocess.run([slither_path, contract_path], capture_output=True, text=True)
        return result.stdout or result.stderr or "No output from Slither."
    except Exception as e:
        return f"Slither failed: {str(e)}"

def get_eth_balance(address: str) -> str:
    from web3 import Web3
    w3 = Web3(Web3.HTTPProvider("https://rpc.sepolia.org"))
    try:
        balance = w3.eth.get_balance(address)
        return f"{w3.from_wei(balance, 'ether')} ETH"
    except Exception as e:
        return f"Balance check failed: {str(e)}"

def compile_contract(code: str) -> str:
    temp_file = "mcp_temp.sol"
    with open(temp_file, "w") as f:
        f.write(code)
    try:
        # We use the absolute SOLC_PATH configured in the environment
        result = subprocess.run([os.environ["SOLC"], temp_file], capture_output=True, text=True)
        if result.returncode == 0:
            return "Compilation Successful."
        else:
            return f"Compilation Failed:\n{result.stderr}"
    except Exception as e:
        return f"Compiler execution failed: {str(e)}"
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

# Define Tools
@mcp_server.list_tools()
async def list_tools():
    return [
        Tool(
            name="run_slither",
            description="Run Slither security analysis",
            inputSchema={
                "type": "object",
                "properties": {
                    "contract_path": {"type": "string"}
                },
                "required": ["contract_path"]
            }
        ),
        Tool(
            name="get_eth_balance",
            description="Check ETH balance on Sepolia",
            inputSchema={
                "type": "object",
                "properties": {
                    "address": {"type": "string"}
                },
                "required": ["address"]
            }
        ),
        Tool(
            name="compile_contract",
            description="Verify Solidity syntax and compile code",
            inputSchema={
                "type": "object",
                "properties": {
                    "code": {"type": "string"}
                },
                "required": ["code"]
            }
        )
    ]

@mcp_server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "run_slither":
        result = run_slither(arguments["contract_path"])
    elif name == "get_eth_balance":
        result = get_eth_balance(arguments["address"])
    elif name == "compile_contract":
        result = compile_contract(arguments["code"])
    else:
        raise ValueError(f"Unknown tool: {name}")
    
    return [TextContent(type="text", text=result)]

# FastAPI Wrapper for HTTP MCP
app = FastAPI()

@app.get("/tools")
async def get_tools():
    tools = await list_tools()
    return {"tools": [t.model_dump() for t in tools]}

@app.post("/call")
async def handle_call(request: Request):
    data = await request.json()
    name = data.get("name")
    arguments = data.get("arguments", {})
    
    try:
        result = await call_tool(name, arguments)
        return {"result": [r.model_dump() for r in result]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    print("🚀 Smart Contract Tool Server starting on http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
