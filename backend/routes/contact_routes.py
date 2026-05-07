from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime
from db import db
import uuid

router = APIRouter(prefix="/contact", tags=["contact"])

class ContactSubmission(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

@router.post("/submit")
async def submit_contact_form(submission: ContactSubmission):
    try:
        contact_doc = {
            "id": str(uuid.uuid4()),
            "name": submission.name,
            "email": submission.email,
            "subject": submission.subject,
            "message": submission.message,
            "submitted_at": datetime.utcnow().isoformat(),
            "status": "new"
        }
        
        await db.contact_submissions.insert_one(contact_doc)
        return {"status": "success", "message": "Message received! We will get back to you soon."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/submissions")
async def get_submissions():
    # This should be protected in production, but for now we'll keep it simple
    submissions = await db.contact_submissions.find({}, {"_id": 0}).to_list(100)
    return submissions
