from utils.mcp_client import mcp_client
from agents.vulnerability_agent import analyze_vulnerabilities
from agents.gas_agent import analyze_gas
from agents.fix_agent import generate_fixes
from utils.scoring import calculate_risk

def run_full_audit(contract_path, contract_code, selected_agent="all"):
    # Validate that the file is actually Solidity code
    valid_indicators = ["contract ", "library ", "interface ", "pragma solidity"]
    if not any(indicator in contract_code for indicator in valid_indicators):
        return {"error": "No valid Solidity code detected in the uploaded file. Please upload a real smart contract."}

    # Initialize all variables to prevent UnboundLocalError
    vulnerability_analysis = None
    gas_analysis = None
    fixes = None
    risk_score = None
    
    if selected_agent in ["all", "vulnerability"]:
        # Use MCP Tool Server for Slither analysis
        slither_output = mcp_client.call_tool("run_slither", {"contract_path": contract_path})
        vulnerability_analysis = analyze_vulnerabilities(slither_output)
        risk_score = calculate_risk(slither_output)
    
    if selected_agent in ["all", "gas"]:
        gas_analysis = analyze_gas(contract_code)
        
    if selected_agent in ["all", "fix"]:
        # Fixes depend on vulnerabilities. If we didn't run vulnerability analysis yet, we need a basic prompt
        if vulnerability_analysis is None:
             fixes = generate_fixes(contract_code, "Optimize and fix all general security issues.")
        else:
             fixes = generate_fixes(contract_code, vulnerability_analysis)

    # Return structured dict to the API for the frontend
    return {
        "risk_score": risk_score,
        "vulnerability": vulnerability_analysis,
        "gas_optimization": gas_analysis,
        "fix": fixes
    }