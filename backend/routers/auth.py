from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import hashlib
import os
from dotenv import load_dotenv

from database import get_db
from models import User, UserRole
from schemas import UserCreate, UserLogin, Token, User as UserSchema

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "63bc66b32ca7e21c3fe87e85dd05c9d8c163f2c9f3d0c322ef94cc01fbed358a")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="User account is blocked")
    
    return user

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Teachers need approval, set is_approved to False
    is_approved = True if user.role != UserRole.TEACHER.value else False
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        program=getattr(user, 'program', None),
        is_approved=is_approved
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role})
    
    user_data = UserSchema.from_orm(new_user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_data)

@router.post("/login", response_model=Token)
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_login.email).first()
    
    if not user or not verify_password(user_login.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Your account has been blocked")
    
    if user.role == UserRole.TEACHER.value and not user.is_approved:
        raise HTTPException(status_code=403, detail="Your teacher account is pending approval")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    user_data = UserSchema.from_orm(user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_data)

@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user