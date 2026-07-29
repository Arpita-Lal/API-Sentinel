"""Database engine, session management, and demo data seeding."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from backend.auth import hash_password
from backend.config import get_settings
from backend.models import ApiInventory, Base, Order, Payment, User

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)


def get_db():
    """Yield a SQLAlchemy session for FastAPI dependencies."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables and ensure the SQLite directory exists."""

    if settings.database_url.startswith("sqlite"):
        db_path = Path(settings.database_url.replace("sqlite:///", "", 1))
        if not db_path.is_absolute():
            db_path = Path(__file__).resolve().parent.parent / db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=engine)


def seed_demo_data() -> None:
    """Seed realistic users, orders, and payments for testing."""

    with SessionLocal() as db:
        existing_users = db.scalar(select(func.count(User.id)))
        if existing_users and int(existing_users) > 0:
            return

        demo_users = [
            User(public_id="usr_alice", username="alice", email="alice@example.com", hashed_password=hash_password("password123"), role="user"),
            User(public_id="usr_bob", username="bob", email="bob@example.com", hashed_password=hash_password("secret456"), role="user"),
            User(public_id="usr_nina", username="nina", email="nina@api-sentinel.dev", hashed_password=hash_password("analyst789"), role="security_analyst"),
            User(public_id="usr_devon", username="devon", email="devon@api-sentinel.dev", hashed_password=hash_password("devpass321"), role="developer"),
            User(public_id="usr_viewer", username="viewer", email="viewer@api-sentinel.dev", hashed_password=hash_password("viewonly555"), role="viewer"),
            User(public_id="usr_admin", username="admin", email="admin@api-sentinel.dev", hashed_password=hash_password("Admin@9999"), role="admin"),
        ]

        db.add_all(demo_users)
        db.flush()

        alice = next(user for user in demo_users if user.username == "alice")
        bob = next(user for user in demo_users if user.username == "bob")

        demo_orders = [
            Order(public_id="ord_100", user_id=alice.id, status="completed", total_amount=99.97, items=[{"name": "Wireless Keyboard", "quantity": 1, "unit_price": 49.99}, {"name": "USB-C Hub", "quantity": 2, "unit_price": 24.99}]),
            Order(public_id="ord_101", user_id=alice.id, status="pending", total_amount=15.00, items=[{"name": "Mechanical Switch Tester", "quantity": 1, "unit_price": 15.00}]),
            Order(public_id="ord_200", user_id=bob.id, status="completed", total_amount=39.47, items=[{"name": "HDMI Cable 2m", "quantity": 3, "unit_price": 8.99}, {"name": "Screen Cleaner Kit", "quantity": 1, "unit_price": 12.50}]),
            Order(public_id="ord_201", user_id=bob.id, status="cancelled", total_amount=59.99, items=[{"name": "Ergonomic Mouse", "quantity": 1, "unit_price": 59.99}]),
        ]

        db.add_all(demo_orders)
        db.flush()

        db.add_all(
            [
                Payment(public_id="pay_100", user_id=alice.id, order_id=demo_orders[0].id, amount=99.97, card_last4="4242", status="completed"),
                Payment(public_id="pay_200", user_id=bob.id, order_id=demo_orders[2].id, amount=39.47, card_last4="1234", status="completed"),
                ApiInventory(endpoint="/login", category="known", status="known", notes="Authentication entry point"),
                ApiInventory(endpoint="/profile", category="known", status="known", notes="User profile lookup"),
                ApiInventory(endpoint="/orders", category="known", status="known", notes="List user orders"),
                ApiInventory(endpoint="/orders/{order_id}", category="known", status="known", notes="Order lookup with ownership validation"),
                ApiInventory(endpoint="/payment", category="known", status="known", notes="Create payment for pending order"),
                ApiInventory(endpoint="/user", category="known", status="known", notes="Self-service account deletion"),
                ApiInventory(endpoint="/old_login", category="deprecated", status="deprecated", notes="Deprecated login endpoint"),
                ApiInventory(endpoint="/v1/payment", category="deprecated", status="deprecated", notes="Deprecated payment endpoint"),
            ]
        )

        db.commit()