from fastapi import Request, HTTPException, status
from .schemas.auth import UserSession


def get_current_user(request: Request) -> UserSession:
    """Dependency: require an authenticated session."""
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return UserSession(**user)


def require_role(*roles: str):
    """Dependency factory: require the session user to have one of the given roles."""
    def _check(request: Request) -> UserSession:
        user = get_current_user(request)
        if user.auth not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return _check
