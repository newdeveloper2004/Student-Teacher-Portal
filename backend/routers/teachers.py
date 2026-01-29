from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from database import get_db
from models import User, Course, Enrollment, Marks, Attendance, UserRole, CourseSection
from schemas import Course as CourseSchema, Marks as MarksSchema, MarksUpdate, AttendanceCreate, Attendance as AttendanceSchema, CourseSection as CourseSectionSchema
from routers.auth import get_current_user

router = APIRouter()

def require_teacher(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.TEACHER.value:
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Your account is pending approval")
    return current_user

@router.get("/my-courses", response_model=List[CourseSchema])
def get_my_courses(db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    # Get course sections taught by this teacher
    sections = db.query(CourseSection).filter(CourseSection.teacher_id == current_user.id).all()
    
    # Get unique course IDs
    course_ids = list(set([section.course_id for section in sections]))
    
    # Get courses
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    
    result = []
    for course in courses:
        course_data = CourseSchema.from_orm(course)
        course_data.teacher_name = current_user.full_name
        
        # Include sections for this teacher
        course_sections = [section for section in sections if section.course_id == course.id]
        course_data.sections = course_sections
        
        result.append(course_data)
    
    return result

@router.get("/courses/{course_id}/students")
def get_course_students(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    # Check if teacher teaches this course through a section
    section = db.query(CourseSection).filter(
        CourseSection.course_id == course_id,
        CourseSection.teacher_id == current_user.id
    ).first()
    
    if not section:
        raise HTTPException(status_code=403, detail="You can only view students of your own courses")
    
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    
    students = []
    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.student_id).first()
        if student:
            students.append({
                "id": student.id,
                "name": student.full_name,
                "email": student.email
            })
    
    return students
    
@router.get("/marks/{student_id}/{course_id}", response_model=MarksSchema)
def get_student_marks(student_id: str, course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    # Convert student_id to UUID
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")

    # Verify teacher teaches this course through a section
    section = db.query(CourseSection).filter(
        CourseSection.course_id == course_id,
        CourseSection.teacher_id == current_user.id
    ).first()
    
    if not section:
        raise HTTPException(status_code=403, detail="You can only view marks for your own courses")
    
    # Get course to check if it has lab component
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Get marks record
    marks = db.query(Marks).filter(
        Marks.student_id == student_uuid,
        Marks.course_id == course_id
    ).first()
    
    if not marks:
        # Return empty marks structure if none exist yet
        return MarksSchema(
            id=0, # Placeholder
            student_id=student_uuid,
            course_id=course_id,
            class_quiz=0, class_assignment=0, class_mid=0, class_final=0, class_total=0,
            lab_quiz=0, lab_assignment=0, lab_mid=0, lab_final=0, lab_total=0,
            total=0
        )

    # Add student and course names to response
    student = db.query(User).filter(User.id == student_uuid).first()
    marks_response = MarksSchema.from_orm(marks)
    marks_response.student_name = student.full_name if student else "Unknown"
    marks_response.course_title = course.title if course else "Unknown"
    
    return marks_response

@router.post("/marks/{student_id}/{course_id}", response_model=MarksSchema)
def update_student_marks(student_id: str, course_id: int, marks_update: MarksUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    # Convert student_id to UUID
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")
    
    # Verify teacher teaches this course through a section
    section = db.query(CourseSection).filter(
        CourseSection.course_id == course_id,
        CourseSection.teacher_id == current_user.id
    ).first()
    
    if not section:
        raise HTTPException(status_code=403, detail="You can only update marks for your own courses")
    
    # Get course to check if it has lab component
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get or create marks record
    marks = db.query(Marks).filter(
        Marks.student_id == student_uuid,
        Marks.course_id == course_id
    ).first()
    
    if not marks:
        marks = Marks(student_id=student_uuid, course_id=course_id)
        db.add(marks)
    
    # Update class marks
    marks.class_quiz = marks_update.class_quiz
    marks.class_assignment = marks_update.class_assignment
    marks.class_mid = marks_update.class_mid
    marks.class_final = marks_update.class_final
    marks.class_total = marks.class_quiz + marks.class_assignment + marks.class_mid + marks.class_final
    
    # Update lab marks
    marks.lab_quiz = marks_update.lab_quiz
    marks.lab_assignment = marks_update.lab_assignment
    marks.lab_mid = marks_update.lab_mid
    marks.lab_final = marks_update.lab_final
    marks.lab_total = marks.lab_quiz + marks.lab_assignment + marks.lab_mid + marks.lab_final
    
    # Calculate weighted total (67% class, 33% lab)
    marks.total = (marks.class_total * 0.67) + (marks.lab_total * 0.33)
    
    db.commit()
    db.refresh(marks)
    
    # Add student and course names to response
    student = db.query(User).filter(User.id == student_uuid).first()
    marks_response = MarksSchema.from_orm(marks)
    marks_response.student_name = student.full_name if student else "Unknown"
    marks_response.course_title = course.title if course else "Unknown"
    
    return marks_response

@router.post("/attendance", response_model=AttendanceSchema)
def mark_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    # Verify teacher teaches this course through a section
    section = db.query(CourseSection).filter(
        CourseSection.course_id == attendance.course_id,
        CourseSection.teacher_id == current_user.id
    ).first()
    
    if not section:
        raise HTTPException(status_code=403, detail="You can only mark attendance for your own courses")
    
    # Check if attendance already marked for this date
    existing = db.query(Attendance).filter(
        Attendance.student_id == attendance.student_id,
        Attendance.course_id == attendance.course_id,
        Attendance.date == attendance.date
    ).first()
    
    if existing:
        existing.status = attendance.status
        db.commit()
        db.refresh(existing)
        return existing
    
    new_attendance = Attendance(
        student_id=attendance.student_id,
        course_id=attendance.course_id,
        date=attendance.date,
        status=attendance.status
    )
    
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    
    return new_attendance