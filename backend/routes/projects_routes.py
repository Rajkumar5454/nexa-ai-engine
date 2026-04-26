from fastapi import APIRouter, HTTPException, Depends
from models.project import Project
from models.user import User
from routes.auth_routes import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import List
from datetime import datetime, timezone

router = APIRouter(prefix="/projects", tags=["projects"])

from db import db


@router.get("", response_model=List[dict])
async def get_user_projects(current_user: User = Depends(get_current_user)):
    """Get all projects for current user"""
    projects = await db.projects.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    return projects


@router.post("/save")
async def save_project(project_data: dict, current_user: User = Depends(get_current_user)):
    """Save or update a project"""
    project_id = project_data.get("id")

    if project_id:
        existing_project = await db.projects.find_one({"id": project_id, "user_id": current_user.id})
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")

        project_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        project_data["user_id"] = current_user.id

        await db.projects.update_one(
            {"id": project_id},
            {"$set": project_data}
        )
    else:
        project_data["user_id"] = current_user.id
        project_data["created_at"] = datetime.now(timezone.utc).isoformat()
        project_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        await db.projects.insert_one(project_data)

    return {"message": "Project saved", "project_id": project_data.get("id")}


@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Delete a project"""
    result = await db.projects.delete_one({"id": project_id, "user_id": current_user.id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project deleted"}


@router.get("/{project_id}")
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific project"""
    project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user.id},
        {"_id": 0}
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project
