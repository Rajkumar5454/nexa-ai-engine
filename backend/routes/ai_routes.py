from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from models.project import ChatRequest, GenerateCodeRequest, Message, Project, File
from services.ai_service import AIService
from services.credit_service import require_and_deduct_credits
from motor.motor_asyncio import AsyncIOMotorClient
from services.auth_service import decode_token
import os
import json
import io
import zipfile
from datetime import datetime, timezone
from typing import Optional

router = APIRouter(prefix="/ai", tags=["ai"])
ai_service = AIService()

from db import db


async def get_user_id_from_token(authorization: Optional[str] = None):
    """Extract user_id from token if provided"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if payload:
        return payload.get("sub")
    return None


@router.post("/chat")
async def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    """Smart chat with project awareness — cofounder mode"""
    try:
        user_id = await get_user_id_from_token(authorization)
        credits_remaining = await require_and_deduct_credits(user_id, "chat")

        project = None
        if request.project_id:
            project_data = await db.projects.find_one({"id": request.project_id})
            if project_data:
                project = Project(**project_data)

        # Pass full project and history to AI for context-aware responses
        response = await ai_service.chat_message(
            request.message,
            request.session_id,
            conversation_history=project.messages if project else [],
            project=project
        )

        user_message = Message(role="user", content=request.message)
        assistant_message = Message(role="assistant", content=response)

        if not project:
            project = Project(
                name=request.message[:50],
                messages=[user_message, assistant_message]
            )
        else:
            project.messages.append(user_message)
            project.messages.append(assistant_message)
            project.updated_at = datetime.now(timezone.utc)

        project_dict = project.dict()
        if user_id:
            project_dict["user_id"] = user_id

        await db.projects.update_one(
            {"id": project.id},
            {"$set": project_dict},
            upsert=True
        )

        return {
            "message": assistant_message,
            "project_id": project.id,
            "credits_remaining": credits_remaining,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_msg = str(e)
        if "budget" in error_msg.lower() or "exceeded" in error_msg.lower():
            raise HTTPException(status_code=402, detail="AI budget exceeded. Please add more balance to your Universal Key under Profile -> Universal Key -> Add Balance.")
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/analyze/{project_id}")
async def analyze_project(project_id: str, authorization: Optional[str] = Header(None)):
    """Proactive project analysis — cofounder audit"""
    try:
        user_id = await get_user_id_from_token(authorization)
        credits_remaining = await require_and_deduct_credits(user_id, "analyze")

        project_data = await db.projects.find_one({"id": project_id})
        if not project_data:
            raise HTTPException(status_code=404, detail="Project not found")

        project = Project(**project_data)
        session_id = f"analyze-{project_id}"
        analysis = await ai_service.analyze_project(project, session_id)

        return {"analysis": analysis, "project_id": project_id, "credits_remaining": credits_remaining}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_code(request: GenerateCodeRequest, authorization: Optional[str] = Header(None)):
    """Generate code from prompt"""
    try:
        user_id = await get_user_id_from_token(authorization)
        credits_remaining = await require_and_deduct_credits(user_id, "generate", request.model)

        # Get existing project if modifying
        project = None
        existing_code = None
        if request.project_id:
            project_data = await db.projects.find_one({"id": request.project_id})
            if project_data:
                project = Project(**project_data)
                # Extract existing App.jsx code for context
                if project.files:
                    for f in project.files:
                        fp = f.get("path", "") if isinstance(f, dict) else f.path
                        if "App.jsx" in fp or "App.js" in fp:
                            existing_code = f.get("content", "") if isinstance(f, dict) else f.content
                            break

        # Generate code (pass existing code for modifications)
        result = await ai_service.generate_code(
            request.prompt,
            request.session_id,
            existing_code=existing_code,
            model=request.model,
        )

        if not project:
            # Create new project with name from prompt
            project_name = request.prompt[:60].strip()
            project = Project(name=project_name)

        # Update files
        if result.get("files"):
            new_files = []
            for file_data in result["files"]:
                file = File(**file_data)
                new_files.append(file.dict())
            project.files = new_files

        user_message = Message(role="user", content=request.prompt)
        result_files = [File(**f) if isinstance(f, dict) else f for f in result.get("files", [])]
        assistant_message = Message(
            role="assistant",
            content=result.get("message", "Generated code successfully"),
            files=result_files,
            steps=result.get("steps", [])
        )

        project.messages.append(user_message)
        project.messages.append(assistant_message)
        project.updated_at = datetime.now(timezone.utc)

        project_dict = project.dict()
        if user_id:
            project_dict["user_id"] = user_id

        await db.projects.update_one(
            {"id": project.id},
            {"$set": project_dict},
            upsert=True
        )

        return {
            "project_id": project.id,
            "project_name": project.name,
            "message": assistant_message,
            "files": project.files
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_msg = str(e)
        if "budget" in error_msg.lower() or "exceeded" in error_msg.lower():
            raise HTTPException(status_code=402, detail="AI budget exceeded. Please add more balance to your Universal Key under Profile -> Universal Key -> Add Balance.")
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/project/{project_id}")
async def get_project(project_id: str):
    """Get project by ID"""
    try:
        project_data = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project_data:
            raise HTTPException(status_code=404, detail="Project not found")
        return project_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects")
async def list_projects():
    """List all projects"""
    try:
        projects = await db.projects.find({}, {"_id": 0}).to_list(100)
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/stream")
async def generate_code_stream(request: GenerateCodeRequest, authorization: Optional[str] = Header(None)):
    """Stream code generation with SSE"""
    user_id = await get_user_id_from_token(authorization)
    # Enforce + deduct BEFORE opening the stream so 402 is returned as a real HTTP error.
    credits_remaining = await require_and_deduct_credits(user_id, "generate", request.model)

    # Get existing project for modification
    project = None
    existing_code = None
    if request.project_id:
        project_data = await db.projects.find_one({"id": request.project_id})
        if project_data:
            project = Project(**project_data)
            if project.files:
                for f in project.files:
                    fp = f.get("path", "") if isinstance(f, dict) else f.path
                    if "App.jsx" in fp or "App.js" in fp:
                        existing_code = f.get("content", "") if isinstance(f, dict) else f.content
                        break

    async def event_generator():
        try:
            async for event in ai_service.stream_generate_code(
                request.prompt, request.session_id, existing_code=existing_code, model=request.model
            ):
                if event["type"] == "status":
                    yield f"data: {json.dumps({'type': 'token', 'content': event['content']})}\n\n"
                
                elif event["type"] == "token":
                    yield f"data: {json.dumps({'type': 'token', 'content': event['content']})}\n\n"
                
                elif event["type"] == "done":
                    result = event["result"]
                    files = result.get("files", [])
                    
                    # Save project
                    if not project:
                        proj = Project(name=request.prompt[:60].strip(), files=files)
                    else:
                        proj = project
                        proj.files = files

                    is_mod = existing_code is not None
                    msg_content = result.get("message", f"Built premium {request.prompt}")
                    steps = result.get("steps", [])
                    analysis = result.get("analysis", "")

                    user_msg = Message(role="user", content=request.prompt)
                    
                    result_files = [File(**f) if isinstance(f, dict) else f for f in files]
                    asst_msg = Message(role="assistant", content=msg_content, files=result_files, steps=steps)

                    proj.messages.append(user_msg)
                    proj.messages.append(asst_msg)
                    proj.updated_at = datetime.now(timezone.utc)

                    proj_dict = proj.dict()
                    if user_id:
                        proj_dict["user_id"] = user_id

                    await db.projects.update_one({"id": proj.id}, {"$set": proj_dict}, upsert=True)

                    final_data = {
                        'type': 'done',
                        'project_id': proj.id,
                        'project_name': proj.name,
                        'message': msg_content,
                        'files': files,
                        'steps': steps,
                        'analysis': analysis,
                        'credits_remaining': credits_remaining,
                    }
                    yield f"data: {json.dumps(final_data)}\n\n"
                
                elif event["type"] == "error":
                    yield f"data: {json.dumps({'type': 'error', 'content': event['content']})}\n\n"

        except Exception as e:
            import traceback
            traceback.print_exc()
            # Refund the credits since generation failed
            if user_id:
                try:
                    from services.credit_service import get_generate_cost
                    cost = get_generate_cost(request.model)
                    await db.users.update_one({"id": user_id}, {"$inc": {"credits": cost}})
                except Exception:
                    pass

            yield f"data: {json.dumps({'type': 'error', 'detail': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/project/{project_id}/download")
async def download_project(project_id: str):
    """Download project as a zip file"""
    project_data = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = Project(**project_data)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        if project.files:
            for f in project.files:
                fp = f.get("path", "") if isinstance(f, dict) else f.path
                content = f.get("content", "") if isinstance(f, dict) else f.content
                # Remove leading slash for zip paths
                zip_path = fp.lstrip('/')
                zf.writestr(zip_path, content)

    zip_buffer.seek(0)
    safe_name = (project.name or "project").replace(" ", "-").lower()[:30]

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.zip"'}
    )
