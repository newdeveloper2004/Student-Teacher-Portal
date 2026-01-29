from sqlalchemy import Column, Integer, String, ForeignKey, Float, Date, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
import enum
from sqlalchemy.dialects.postgresql import UUID
import uuid

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    program = Column(String, nullable=True)
    is_approved = Column(Boolean, default=True)
    is_blocked = Column(Boolean, default=False)
    created_at = Column(String, nullable=True)
    updated_at = Column(String, nullable=True)
    
    # Relationships
    course_sections = relationship("CourseSection", back_populates="teacher")
    enrollments = relationship("Enrollment", back_populates="student")
    marks = relationship("Marks", back_populates="student")
    attendance = relationship("Attendance", back_populates="student")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    credit_hours = Column(Integer, nullable=False)
    teacher_id = Column(UUID(as_uuid=True), nullable=True)  # Fix type mismatch
        
    # Relationships
    sections = relationship("CourseSection", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")
    marks = relationship("Marks", back_populates="course")
    attendance = relationship("Attendance", back_populates="course")

class CourseSection(Base):
    __tablename__ = "course_sections"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    program = Column(String, nullable=False)
    section = Column(String, nullable=True)
    class_name = Column(String, nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="sections")
    teacher = relationship("User", back_populates="course_sections")

class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    
    # Relationships
    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class Marks(Base):
    __tablename__ = "marks"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))

    class_quiz = Column(Float, default=0.0)
    class_assignment = Column(Float, default=0.0)
    class_mid = Column(Float, default=0.0)
    class_final = Column(Float, default=0.0)
    class_total = Column(Float, default=0.0)

    lab_quiz = Column(Float, default=0.0)
    lab_assignment = Column(Float, default=0.0)
    lab_mid = Column(Float, default=0.0)
    lab_final = Column(Float, default=0.0)
    lab_total = Column(Float, default=0.0)

    total = Column(Float, default=0.0)
    
    # Relationships
    student = relationship("User", back_populates="marks")
    course = relationship("Course", back_populates="marks")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False)
    
    # Relationships
    student = relationship("User", back_populates="attendance")
    course = relationship("Course", back_populates="attendance")
