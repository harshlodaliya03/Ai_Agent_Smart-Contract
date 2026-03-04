from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
import json

# Agents & Utils
from agents.orchestrator import run_full_audit
from agents.generator_agent import evaluate_prompt, generate_contract
from agents.architect_agent import generate_roadmap, analyze_project_idea
from agents.learning_agent import LearningAgent, compile_solidity
from database import (
    init_db, save_history, get_history, get_history_detail, delete_history,
    get_user_progress, get_active_tasks, save_tasks, update_task_status
)

app = FastAPI()
init_db()

# Mount frontend
os.makedirs("frontend", exist_ok=True)
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def serve_frontend():
    return FileResponse("frontend/index.html")

# --- Audit & History Endpoints ---

@app.post("/audit/")
async def audit_contract(file: UploadFile = File(...), agent: str = Form("all"), wallet_address: Optional[str] = Form(None)):
    os.makedirs("contracts", exist_ok=True)
    file_path = f"contracts/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    with open(file_path, "r", encoding="utf-8") as f:
        contract_code = f.read()

    result = run_full_audit(file_path, contract_code, agent)

    if "error" in result:
        return JSONResponse(status_code=400, content=result)

    if wallet_address:
        save_history(wallet_address, "audit", file.filename, result)

    return {"report": result}

class GenerateRequest(BaseModel):
    prompt: str
    is_confirmed: bool = False
    wallet_address: Optional[str] = None

@app.post("/generate/")
async def generate_endpoint(req: GenerateRequest):
    # Step 1: Pre-evaluation (unless already confirmed)
    if not req.is_confirmed:
        improved_prompt = evaluate_prompt(req.prompt)
        
        # If AI says it's already clear, just generate it now
        if improved_prompt.strip().upper() == "CLEAR":
            code = generate_contract(req.prompt)
            if req.wallet_address:
                save_history(req.wallet_address, "generate", req.prompt[:30], {"fix": code})
            return {
                "status": "generating",
                "contract": code
            }
        
        # Otherwise, offer the improved prompt for confirmation
        return {
            "status": "clarification_needed",
            "improved_prompt": improved_prompt
        }
    
    # Step 2: Confirmed generation
    code = generate_contract(req.prompt)
    if req.wallet_address:
        save_history(req.wallet_address, "generate", req.prompt[:30], {"fix": code})
    
    return {
        "status": "generating",
        "contract": code
    }

class ArchitectGenerateRequest(BaseModel):
    project_idea: str
    selected_tools: dict
    experience_level: str
    wallet_address: Optional[str] = None

class ArchitectAnalyzeRequest(BaseModel):
    prompt: str

@app.post("/architect/analyze/")
async def architect_analyze_endpoint(req: ArchitectAnalyzeRequest):
    analysis = analyze_project_idea(req.prompt)
    return {"analysis": analysis}

@app.post("/architect/")
async def architect_endpoint(req: ArchitectGenerateRequest):
    roadmap = generate_roadmap(req.project_idea, req.selected_tools, req.experience_level)
    if req.wallet_address:
        save_history(req.wallet_address, "architect", req.project_idea[:30], {"roadmap": roadmap})
    return {"roadmap": roadmap}

@app.get("/history/{wallet_address}")
async def fetch_history(wallet_address: str):
    return get_history(wallet_address)

@app.get("/history/detail/{history_id}")
async def fetch_history_detail(history_id: int):
    detail = get_history_detail(history_id)
    if not detail:
        return JSONResponse(status_code=404, content={"error": "Not found"})
    return detail

@app.delete("/history/{history_id}")
async def delete_history_endpoint(history_id: int):
    delete_history(history_id)
    return {"status": "success"}

# --- Learning Platform Endpoints ---

class LearningGenerateRequest(BaseModel):
    wallet_address: str
    concepts: List[str]
    difficulty: str
    count: int = 3

class LearningSubmitRequest(BaseModel):
    wallet_address: str
    task_id: int
    code: str

@app.get("/learning/status/{wallet_address}")
async def learning_status_endpoint(wallet_address: str):
    progress = get_user_progress(wallet_address)
    tasks = get_active_tasks(wallet_address)
    return {
        "status": "success",
        "progress": {
            "xp": progress["xp"],
            "level": progress["level"],
            "badges": progress["badges"]
        },
        "active_tasks": tasks
    }

@app.post("/learning/generate/")
async def learning_generate_endpoint(req: LearningGenerateRequest):
    active = get_active_tasks(req.wallet_address)
    if active:
        return JSONResponse(status_code=400, content={"error": "Complete current tasks first"})
    
    result = LearningAgent.generate_tasks(req.concepts, req.difficulty, req.count)
    # Tasks are returned as a dict with "tasks" key
    save_tasks(req.wallet_address, result.get('tasks', []))
    return {"status": "success"}

@app.post("/learning/submit/")
async def learning_submit_endpoint(req: LearningSubmitRequest):
    # 1. Compile
    success, err = compile_solidity(req.code)
    if not success:
        return {
            "status": "COMPILER_ERROR",
            "error": err
        }
    
    # 2. Get task details
    all_active = get_active_tasks(req.wallet_address)
    task = next((t for t in all_active if t['id'] == req.task_id), None)
    
    if not task:
        return JSONResponse(status_code=404, content={"error": "Task not found"})
    
    # 3. AI Review
    review = LearningAgent.review_code(task['description'], req.code)
    
    # 4. Update status if accepted
    if review.get('status') == 'ACCEPTED':
        update_task_status(req.task_id, 'solved', review.get('feedback'))
    else:
        update_task_status(req.task_id, 'pending', review.get('explanation'))
        return {
            "status": "REJECTED",
            "explanation": review.get('explanation'),
            "why": review.get('why'),
            "hint": review.get('hint')
        }

    return {
        "status": "ACCEPTED",
        "feedback": review.get('feedback')
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)