from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes.auth import router as auth_router
from routes.teachers import router as teachers_router
from routes.booking import router as booking_router
from routes.reviews import router as reviews_router

app = FastAPI(title="Online Tutoring Booking System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(teachers_router)
app.include_router(booking_router)
app.include_router(reviews_router)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def root():
    return {"message": "Online Tutoring Booking System API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
