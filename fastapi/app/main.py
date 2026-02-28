"""
FastAPI main application
========================
Mounts all routers and configures:
  - SessionMiddleware  (cookie-based sessions, mirrors express-session)
  - CORSMiddleware     (same-origin + localhost dev origins)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .config import settings
from .routers import auth, layers, divisions, users, info

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CMU LGIA API",
    version="2.0.0",
    description="REST API for CMU LGIA — migrated from Node.js to FastAPI",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── Middleware ────────────────────────────────────────────────────────────────

# Session middleware must come BEFORE CORS middleware so that the session
# is available when route handlers run.
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    session_cookie="lgia_session",
    max_age=7 * 24 * 60 * 60,  # 7 days (seconds)
    https_only=False,           # set True in production behind HTTPS
    same_site="lax",
)

# Allowed origins: the React dev server + the production origin.
# Adjust / extend as needed.
ALLOWED_ORIGINS = [
    "http://localhost:5173",     # Vite React dev server
    "http://localhost:3000",     # Create-React-App / Node dev
    "http://localhost:8000",     # FastAPI itself (Swagger UI calls)
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,      # required for cookie / session to work cross-origin
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(layers.router)
app.include_router(divisions.router)
app.include_router(users.router)
app.include_router(info.router)


# ─── Health-check ─────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "CMU LGIA FastAPI", "version": "2.0.0"}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
