from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Course, Enrollment, Marks, Attendance, UserRole, CourseSection
from schemas import Enrollment as EnrollmentSchema, EnrollmentCreate, Marks as MarksSchema, Attendance as AttendanceSchema
from routers.auth import get_current_user

router = APIRouter()

def require_student(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.STUDENT.value:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    return current_user

@router.get("/enrolled-courses", response_model=List[EnrollmentSchema])
def get_enrolled_courses(db: Session = Depends(get_db), current_user: User = Depends(require_student)):
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
    
    result = []
    for enrollment in enrollments:
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        
        enrollment_data = EnrollmentSchema.from_orm(enrollment)
        if course:
            from schemas import Course as CourseSchema
            course_data = CourseSchema.from_orm(course)
            # Get the teacher name from course sections for this student's program
            course_section = db.query(CourseSection).filter(
                CourseSection.course_id == course.id,
                CourseSection.program == current_user.program
            ).first()
            if course_section:
                teacher = db.query(User).filter(User.id == course_section.teacher_id).first()
                course_data.teacher_name = teacher.full_name if teacher else "Unknown"
            else:
                course_data.teacher_name = "Unknown"
            enrollment_data.course = course_data
        
        result.append(enrollment_data)
    
    return result

@router.post("/enroll", response_model=EnrollmentSchema)
def enroll_in_course(enrollment: EnrollmentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_student)):
    # Check if course exists
    course = db.query(Course).filter(Course.id == enrollment.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already enrolled
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == enrollment.course_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    # Create enrollment
    new_enrollment = Enrollment(
        student_id=current_user.id,
        course_id=enrollment.course_id
    )
    
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)
    
    # Also create marks record
    marks_record = Marks(
        student_id=current_user.id,
        course_id=enrollment.course_id
    )
    db.add(marks_record)
    db.commit()
    
    return new_enrollment

@router.get("/marks", response_model=List[MarksSchema])
def get_my_marks(db: Session = Depends(get_db), current_user: User = Depends(require_student)):
    marks = db.query(Marks).filter(Marks.student_id == current_user.id).all()
    
    result = []
    for mark in marks:
        course = db.query(Course).filter(Course.id == mark.course_id).first()
        mark_data = MarksSchema.from_orm(mark)
        mark_data.course_title = course.title if course else "Unknown"
        result.append(mark_data)
    
    return result

@router.get("/attendance", response_model=List[AttendanceSchema])
def get_my_attendance(db: Session = Depends(get_db), current_user: User = Depends(require_student)):
    attendance = db.query(Attendance).filter(Attendance.student_id == current_user.id).all()
    return attendance

@router.delete("/unenroll/{course_id}")
def unenroll_from_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_student)):
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    db.delete(enrollment)
    db.commit()
    
    return {"message": "Successfully unenrolled from course"}