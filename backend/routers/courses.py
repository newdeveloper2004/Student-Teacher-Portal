from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Course, Enrollment, CourseSection
from schemas import Course as CourseSchema
from routers.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CourseSchema])
def get_all_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    courses = db.query(Course).all()
    
    result = []
    for course in courses:
        teacher = db.query(User).filter(User.id == course.teacher_id).first()
        course_data = CourseSchema.from_orm(course)
        course_data.teacher_name = teacher.full_name if teacher else "Unknown"
        result.append(course_data)
    
    return result

@router.get("/available", response_model=List[CourseSchema])
def get_available_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get all courses
    all_courses = db.query(Course).all()
    
    # Get enrolled course IDs for current student
    enrolled_course_ids = []
    if current_user.role == "STUDENT":
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
        enrolled_course_ids = [e.id for e in enrollments]
    
    # Filter out enrolled courses
    available_courses = [c for c in all_courses if c.id not in enrolled_course_ids]
    
    result = []
    for course in available_courses:
        teacher = db.query(User).filter(User.id == course.teacher_id).first()
        course_data = CourseSchema.from_orm(course)
        course_data.teacher_name = teacher.full_name if teacher else "Unknown"
        result.append(course_data)
    
    return result

@router.get("/{id}", response_model=CourseSchema)
def get_course(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    teacher = db.query(User).filter(User.id == course.teacher_id).first()
    course_data = CourseSchema.from_orm(course)
    course_data.teacher_name = teacher.full_name if teacher else "Unknown"
    
    # Include sections
    sections = db.query(CourseSection).filter(CourseSection.course_id == id).all()
    course_data.sections = sections
    
    return course_data