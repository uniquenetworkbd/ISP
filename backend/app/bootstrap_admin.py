from __future__ import annotations

import os
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db import SessionLocal
from app.models import Role, User, UserRole


def main() -> int:
    username = os.environ.get("BOOTSTRAP_ADMIN_USERNAME", "").strip()
    password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD", "")
    if not username or not password:
        print("Set BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD in the backend environment.", file=sys.stderr)
        return 2
    if len(password) < 14:
        print("BOOTSTRAP_ADMIN_PASSWORD must be at least 14 characters.", file=sys.stderr)
        return 2

    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.username == username))
        if existing is not None:
            print("That username already exists; no account or password was changed.", file=sys.stderr)
            return 3

        user = User(username=username, password_hash=hash_password(password), is_active=True)
        db.add(user)
        db.flush()

        for name, description in (
            ("admin", "Full platform administration"),
            ("operator", "Network operations"),
            ("viewer", "Read-only monitoring"),
        ):
            role = db.scalar(select(Role).where(Role.name == name))
            if role is None:
                role = Role(name=name, description=description)
                db.add(role)
                db.flush()
            if name == "admin":
                db.add(UserRole(user_id=user.id, role_id=role.id))

        db.commit()
        print(f"Created initial administrator account: {username}")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
