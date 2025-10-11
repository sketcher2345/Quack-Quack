from fastapi import FastAPI
from app.routes import model1_routes, model2_routes, model3_routes

app = FastAPI(
    title="Hackathon Project API",
    description="API to manage team formation, room allocation, and score prediction for hackathon projects.",
    version="1.0.0"
)

# Routers
app.include_router(model1_routes.router, prefix="/model1", tags=["Team Assignment"])
app.include_router(model2_routes.router, prefix="/model2", tags=["Room Allocation"])
app.include_router(model3_routes.router, prefix="/model3", tags=["Score Prediction"])

@app.get("/")
def root():
    return {"message": "Hackathon Backend API is running 🚀"}
