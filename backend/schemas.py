from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date
import uuid

from models import UserRole

# ---------------------- USERS ----------------------

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole
    program: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: uuid.UUID
    is_approved: bool
    is_blocked: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


# ---------------------- COURSES ----------------------

class CourseBase(BaseModel):
    title: str
    code: str
    credit_hours: int
    teacher_name: Optional[str] = None
    teacher_id: Optional[uuid.UUID] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    credit_hours: Optional[int] = None

# ---------------------- COURSE SECTIONS ----------------------

class CourseSectionBase(BaseModel):
    program: str

class CourseSectionCreate(BaseModel):
    course_id: int
    teacher_id: uuid.UUID
    program: str

class CourseSectionUpdate(CourseSectionBase):
    course_id: Optional[int] = None
    teacher_id: Optional[uuid.UUID] = None
    section: Optional[str] = None
    class_name: Optional[str] = None

class CourseSection(CourseSectionBase):
    id: int
    course_id: int
    teacher_id: uuid.UUID
    class_name: str
    teacher_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class Course(CourseBase):
    id: int
    sections: List[CourseSection] = []
    
    class Config:
        from_attributes = True


# ---------------------- ENROLLMENTS ----------------------

class EnrollmentCreate(BaseModel):
    course_id: int

class Enrollment(BaseModel):
    id: int
    student_id: uuid.UUID
    course_id: int
    course: Optional[Course] = None
    
    class Config:
        from_attributes = True


# ---------------------- MARKS ----------------------

class MarksBase(BaseModel):
    class_quiz: float = 0.0
    class_assignment: float = 0.0
    class_mid: float = 0.0
    class_final: float = 0.0
    class_total: float = 0.0

    lab_quiz: float = 0.0
    lab_assignment: float = 0.0
    lab_mid: float = 0.0
    lab_final: float = 0.0
    lab_total: float = 0.0

class MarksCreate(MarksBase):
    student_id: uuid.UUID
    course_id: int

class MarksUpdate(MarksBase):
    pass

class Marks(MarksBase):
    id: int
    student_id: uuid.UUID
    course_id: int
    total: float
    student_name: Optional[str] = None
    course_title: Optional[str] = None
    
    class Config:
        from_attributes = True


# ---------------------- ATTENDANCE ----------------------

class AttendanceCreate(BaseModel):
    student_id: uuid.UUID
    course_id: int
    date: date
    status: str

class Attendance(BaseModel):
    id: int
    student_id: uuid.UUID
    course_id: int
    date: date
    status: str
    
    class Config:
        from_attributes = True
