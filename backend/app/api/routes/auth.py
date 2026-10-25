from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_roles, get_current_user
from app.audit import record_audit
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.db import get_db
from app.models import User
from app.schemas.auth import CurrentUser, LoginRequest, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.username == payload.username))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        record_audit(db, action="auth.login_failed", details={"username": payload.username})
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    roles = get_current_roles(user, db)
    token = create_access_token(user.id, user.username, roles)
    record_audit(
        db,
        action="auth.login_succeeded",
        user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        details={"roles": roles},
    )
    db.commit()
    return TokenResponse(access_token=token, expires_in=settings.access_token_minutes * 60)


@router.get("/me", response_model=CurrentUser)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CurrentUser:
    return CurrentUser(id=user.id, username=user.username, roles=get_current_roles(user, db))


@router.get("/roles")
def roles(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, list[str]]:
    return {"items": get_current_roles(user, db)}
