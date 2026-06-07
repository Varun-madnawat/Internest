from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from engine import get_recommendations

class UserInput(BaseModel):
    skills : str
    sector : str
    location : str
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def home():
    return {"message" : "Backend is Running"}

@app.post("/recommend")
def recommend(user : UserInput):
    recommendations = get_recommendations(user.skills, user.sector, user.location)
    return recommendations