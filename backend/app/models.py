from pydantic import BaseModel, EmailStr

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    email: EmailStr
    role: str
    plan: str
    name: str

class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
