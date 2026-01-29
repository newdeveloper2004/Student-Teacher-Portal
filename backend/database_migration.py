import psycopg2
import uuid
import os
from dotenv import load_dotenv
import hashlib

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/Student-Teacher-Portal")


def run_database_migrations():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Starting database migrations...\n")

        # ===================== USERS TABLE FIXES =====================

        # Ensure program column
        cur.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS program VARCHAR(50);
        """)

        # Ensure is_approved column
        cur.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
        """)

        # Ensure is_blocked column
        cur.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
        """)

        # Ensure created_at / updated_at columns
        cur.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS created_at VARCHAR;
        """)
        cur.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS updated_at VARCHAR;
        """)

        print("✓ Users table columns verified/created")

        # ===================== COURSES TABLE FIXES =====================

        # Ensure teacher_id exists and is UUID
        cur.execute("""
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS teacher_id UUID;
        """)

        print("✓ Courses table verified")

        # ===================== COURSE SECTIONS TABLE =====================

        cur.execute("""
            CREATE TABLE IF NOT EXISTS course_sections (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id),
                teacher_id UUID REFERENCES users(id),
                program VARCHAR(50) NOT NULL,
                section VARCHAR(20),
                class_name VARCHAR(100) NOT NULL
            );
        """)

        print("✓ Course sections table verified")

        # ===================== ENROLLMENTS TABLE =====================

        cur.execute("""
            CREATE TABLE IF NOT EXISTS enrollments (
                id SERIAL PRIMARY KEY,
                student_id UUID REFERENCES users(id),
                course_id INTEGER REFERENCES courses(id)
            );
        """)

        print("✓ Enrollments table verified")

        # ===================== MARKS TABLE =====================

        cur.execute("""
            CREATE TABLE IF NOT EXISTS marks (
                id SERIAL PRIMARY KEY,
                student_id UUID REFERENCES users(id),
                course_id INTEGER REFERENCES courses(id),

                class_quiz FLOAT DEFAULT 0.0,
                class_assignment FLOAT DEFAULT 0.0,
                class_mid FLOAT DEFAULT 0.0,
                class_final FLOAT DEFAULT 0.0,
                class_total FLOAT DEFAULT 0.0,

                lab_quiz FLOAT DEFAULT 0.0,
                lab_assignment FLOAT DEFAULT 0.0,
                lab_mid FLOAT DEFAULT 0.0,
                lab_final FLOAT DEFAULT 0.0,
                lab_total FLOAT DEFAULT 0.0,

                total FLOAT DEFAULT 0.0
            );
        """)

        print("✓ Marks table verified")

        # ===================== ATTENDANCE TABLE =====================

        cur.execute("""
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                student_id UUID REFERENCES users(id),
                course_id INTEGER REFERENCES courses(id),
                date DATE NOT NULL,
                status VARCHAR NOT NULL
            );
        """)

        print("✓ Attendance table verified")

        # ===================== ADMIN USER CREATION =====================

        cur.execute("SELECT id FROM users WHERE email = %s", ("admin@example.com",))
        existing = cur.fetchone()

        password_hash = hashlib.sha256("admin123".encode()).hexdigest()

        if not existing:
            user_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO users (
                    id, full_name, email, password_hash, role, 
                    created_at, updated_at, is_approved, is_blocked
                )
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW(), TRUE, FALSE)
            """, (user_id, "Administrator", "admin@example.com", password_hash, "ADMIN"))

            print("\n✓ Admin user created")
            print("  Email: admin@example.com")
            print("  Password: admin123")
        else:
            cur.execute("""
                UPDATE users 
                SET password_hash=%s, is_approved=TRUE, is_blocked=FALSE
                WHERE email='admin@example.com'
            """, (password_hash,))
            print("✓ Admin user updated")

        conn.commit()
        print("\nAll migrations completed successfully!")

    except Exception as e:
        print("\nERROR:", e)
        conn.rollback()
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    run_database_migrations()
