from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import re

from database import get_db
from models import User, Course, CourseSection as CourseSectionModel, Enrollment, UserRole, Attendance, Marks
from schemas import User as UserSchema, Course as CourseSchema, CourseCreate, CourseUpdate, CourseSectionCreate, CourseSection, CourseSectionUpdate
from routers.auth import get_current_user

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only admins can access this endpoint")
    return current_user

def validate_class_name(class_name: str):
    """
    Validate that class name follows the format:
    FAXX-XXX or SPXX-XXX
    where XX is year (22-25 for FA, 22-26 for SP)
    XXX is program code (BAI, BCS, BSE, etc.)
    """
    # Pattern for FA (Fall) classes: FA22-25 followed by program (no section)
    fa_pattern = r'^FA(2[2-5])-[A-Z]{2,4}$'
    # Pattern for SP (Spring) classes: SP22-26 followed by program (no section)
    sp_pattern = r'^SP(2[2-6])-[A-Z]{2,4}$'
    
    if not re.match(fa_pattern, class_name) and not re.match(sp_pattern, class_name):
        raise HTTPException(
            status_code=400, 
            detail="Invalid class name format. Must be FAXX-XXX or SPXX-XXX "
                   "where XX is year (22-25 for FA, 22-26 for SP) and "
                   "XXX is program code (BAI, BCS, BSE, etc.). "
                   "Example: FA23-BAI or SP24-BCS"
        )

@router.get("/pending-teachers", response_model=List[UserSchema])
def get_pending_teachers(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    teachers = db.query(User).filter(
        User.role == UserRole.TEACHER.value,
        User.is_approved == False
    ).all()
    return teachers

@router.put("/approve-teacher/{teacher_id}")
def approve_teacher(teacher_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Convert string to UUID
    try:
        teacher_uuid = uuid.UUID(teacher_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid teacher ID format")
        
    teacher = db.query(User).filter(User.id == teacher_uuid).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    if teacher.role != UserRole.TEACHER.value:
        raise HTTPException(status_code=400, detail="User is not a teacher")
    
    teacher.is_approved = True
    db.commit()
    
    return {"message": "Teacher approved successfully"}

@router.post("/create-course", response_model=CourseSchema)
def create_course(course_data: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Check if course code already exists
    existing_course = db.query(Course).filter(Course.code == course_data.code).first()
    if existing_course:
        raise HTTPException(status_code=400, detail="Course with this code already exists")
    
    # Validate credit hours
    if course_data.credit_hours < 2 or course_data.credit_hours > 4:
        raise HTTPException(status_code=400, detail="Credit hours must be between 2 and 4")
    
    # Create new course
    new_course = Course(
        title=course_data.title,
        code=course_data.code,
        credit_hours=course_data.credit_hours
    )
    
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    # Return course with empty sections list
    course_response = CourseSchema.from_orm(new_course)
    course_response.sections = []
    
    return course_response

@router.post("/add-course-section", response_model=CourseSection)
def add_course_section(section_data: CourseSectionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Generate class name based on program (remove any section suffix)
    # Format: FAXX-PROGRAM or SPXX-PROGRAM
    import datetime
    current_year = datetime.datetime.now().year
    current_month = datetime.datetime.now().month
    
    # Determine if it's Fall (FA) or Spring (SP) term
    # Fall term: August-December (month 8-12)
    # Spring term: January-July (month 1-7)
    if current_month >= 8:
        # Fall term
        year_suffix = str(current_year - 2000)  # Get last 2 digits of year
        class_name = f"FA{year_suffix}-{section_data.program}"
    else:
        # Spring term
        year_suffix = str(current_year - 2000)  # Get last 2 digits of year
        class_name = f"SP{year_suffix}-{section_data.program}"
    
    # Validate the generated class name
    validate_class_name(class_name)
    
    # Verify that the course exists
    course = db.query(Course).filter(Course.id == section_data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Verify that the teacher exists and is approved
    teacher = db.query(User).filter(User.id == section_data.teacher_id, User.role == UserRole.TEACHER.value).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found or invalid")
    
    if not teacher.is_approved:
        raise HTTPException(status_code=400, detail="Teacher is not approved")
    
    # Create new course section with auto-generated class name
    new_section = CourseSectionModel(
        course_id=section_data.course_id,
        teacher_id=section_data.teacher_id,
        program=section_data.program,
        class_name=class_name
    )
    
    db.add(new_section)
    db.commit()
    db.refresh(new_section)
    
    # Automatically enroll all students in this program
    students_in_program = db.query(User).filter(
        User.role == UserRole.STUDENT.value,
        User.program == section_data.program
    ).all()
    
    # Enroll each student in the course
    for student in students_in_program:
        # Check if student is already enrolled in this course
        existing_enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student.id,
            Enrollment.course_id == section_data.course_id
        ).first()
        
        if not existing_enrollment:
            enrollment = Enrollment(
                student_id=student.id,
                course_id=section_data.course_id
            )
            db.add(enrollment)
    
    db.commit()
    
    # Add teacher name to response
    section_response = CourseSection.from_orm(new_section)
    section_response.teacher_name = teacher.full_name
    
    return section_response

@router.get("/all-users", response_model=List[UserSchema])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    users = db.query(User).all()
    return users

@router.delete("/delete-user/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Convert string to UUID
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.query(User).filter(User.id == user_uuid).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.ADMIN.value:
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    # Delete related records first
    # Delete attendance records
    db.query(Attendance).filter(Attendance.student_id == user_uuid).delete()
    
    # Delete marks records
    db.query(Marks).filter(Marks.student_id == user_uuid).delete()
    
    # Delete enrollments
    db.query(Enrollment).filter(Enrollment.student_id == user_uuid).delete()
    
    # For teachers, delete their course sections and related data
    if user.role == UserRole.TEACHER.value:
        # Delete attendance records for courses with sections taught by this teacher
        db.query(Attendance).filter(Attendance.course_id.in_(
            db.query(CourseSectionModel.course_id).filter(CourseSectionModel.teacher_id == user_uuid)
        )).delete(synchronize_session=False)
        
        # Delete marks records for courses with sections taught by this teacher
        db.query(Marks).filter(Marks.course_id.in_(
            db.query(CourseSectionModel.course_id).filter(CourseSectionModel.teacher_id == user_uuid)
        )).delete(synchronize_session=False)
        
        # Delete enrollments for courses with sections taught by this teacher
        db.query(Enrollment).filter(Enrollment.course_id.in_(
            db.query(CourseSectionModel.course_id).filter(CourseSectionModel.teacher_id == user_uuid)
        )).delete(synchronize_session=False)
        
        # Delete course sections taught by this teacher
        db.query(CourseSectionModel).filter(CourseSectionModel.teacher_id == user_uuid).delete()
    
    # Finally delete the user
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.get("/all-courses", response_model=List[CourseSchema])
def get_all_courses(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    courses = db.query(Course).all()
    
    result = []
    for course in courses:
        # Get all sections for this course
        sections = db.query(CourseSectionModel).filter(CourseSectionModel.course_id == course.id).all()
        
        # Add teacher names to sections
        section_schemas = []
        for section in sections:
            teacher = db.query(User).filter(User.id == section.teacher_id).first()
            section_schema = CourseSection.from_orm(section)
            section_schema.teacher_name = teacher.full_name if teacher else "Unknown"
            section_schemas.append(section_schema)
        
        course_data = CourseSchema.from_orm(course)
        course_data.sections = section_schemas
        result.append(course_data)
    
    return result

@router.get("/course-enrollments/{course_id}", response_model=List[dict])
def get_course_enrollments(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Verify that the course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get all enrollments for this course
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    
    # Get student details for each enrollment
    result = []
    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.student_id).first()
        if student:
            result.append({
                "enrollment_id": enrollment.id,
                "student_id": str(student.id),
                "student_name": student.full_name,
                "student_email": student.email,
                "student_program": student.program
            })
    
    return result

@router.put("/update-course/{course_id}", response_model=CourseSchema)
def update_course(course_id: int, course_data: CourseUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Find the course
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Validate credit hours if being updated
    credit_hours_to_check = course_data.credit_hours if course_data.credit_hours is not None else course.credit_hours
    
    if credit_hours_to_check is not None:
        if credit_hours_to_check < 2 or credit_hours_to_check > 4:
            raise HTTPException(status_code=400, detail="Credit hours must be between 2 and 4")
    
    # Update course fields if provided
    if course_data.title is not None:
        course.title = course_data.title
    if course_data.code is not None:
        # Check if another course already has this code
        existing_course = db.query(Course).filter(Course.code == course_data.code, Course.id != course_id).first()
        if existing_course:
            raise HTTPException(status_code=400, detail="Course with this code already exists")
        course.code = course_data.code
    if course_data.credit_hours is not None:
        course.credit_hours = course_data.credit_hours
    
    db.commit()
    db.refresh(course)
    
    # Get all sections for this course
    sections = db.query(CourseSectionModel).filter(CourseSectionModel.course_id == course.id).all()
    
    # Add teacher names to sections
    section_schemas = []
    for section in sections:
        teacher = db.query(User).filter(User.id == section.teacher_id).first()
        section_schema = CourseSection.from_orm(section)
        section_schema.teacher_name = teacher.full_name if teacher else "Unknown"
        section_schemas.append(section_schema)
    
    course_data_response = CourseSchema.from_orm(course)
    course_data_response.sections = section_schemas
    
    return course_data_response

@router.delete("/delete-course/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}

@router.put("/update-section/{section_id}", response_model=CourseSection)
def update_section(section_id: int, section_data: CourseSectionUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # Find the section
    section = db.query(CourseSectionModel).filter(CourseSectionModel.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Validate class name if provided
    if section_data.class_name is not None:
        validate_class_name(section_data.class_name)
    
    # Update section fields if provided
    if section_data.course_id is not None:
        # Verify that the course exists
        course = db.query(Course).filter(Course.id == section_data.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        section.course_id = section_data.course_id
    
    if section_data.teacher_id is not None:
        # Verify that the teacher exists and is approved
        teacher = db.query(User).filter(User.id == section_data.teacher_id, User.role == UserRole.TEACHER.value).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found or invalid")
        if not teacher.is_approved:
            raise HTTPException(status_code=400, detail="Teacher is not approved")
        section.teacher_id = section_data.teacher_id
    
    if section_data.program is not None:
        section.program = section_data.program
    
    if section_data.section is not None:
        section.section = section_data.section
    
    if section_data.class_name is not None:
        section.class_name = section_data.class_name
    
    db.commit()
    db.refresh(section)
    
    # Add teacher name to response
    teacher = db.query(User).filter(User.id == section.teacher_id).first()
    section_response = CourseSection.from_orm(section)
    section_response.teacher_name = teacher.full_name if teacher else "Unknown"
    
    return section_response

@router.delete("/delete-section/{section_id}")
def delete_section(section_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    section = db.query(CourseSectionModel).filter(CourseSectionModel.id == section_id).first()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    db.delete(section)
    db.commit()
    
    return {"message": "Section deleted successfully"}