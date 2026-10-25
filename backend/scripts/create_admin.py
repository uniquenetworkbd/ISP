import argparse
import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db import SessionLocal
from app.models import Role, User, UserRole


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or update an ISP NOC admin user")
    parser.add_argument("username")
    args = parser.parse_args()

    password = getpass.getpass("Admin password: ")
    if not password:
        raise SystemExit("Password cannot be empty")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == args.username))
        if user is None:
            user = User(username=args.username, password_hash=hash_password(password), is_active=True)
            db.add(user)
            db.flush()
        else:
            user.password_hash = hash_password(password)
            user.is_active = True

        role = db.scalar(select(Role).where(Role.name == "admin"))
        if role is None:
            raise SystemExit("Admin role is missing; run alembic upgrade head first")

        assignment = db.get(UserRole, {"user_id": user.id, "role_id": role.id})
        if assignment is None:
            db.add(UserRole(user_id=user.id, role_id=role.id))
        db.commit()
        print(f"Admin user ready: {user.username}")


if __name__ == "__main__":
    main()
