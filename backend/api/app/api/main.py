from fastapi import APIRouter

from app.api.routes import (
    users,
    telegram,
    triggers,
    notifications,
    actions,
    action_types,
    orders,
)

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    notifications.router, prefix="/notifications", tags=["notifications"]
)
api_router.include_router(actions.router, prefix="/actions", tags=["actions"])
api_router.include_router(
    action_types.router, prefix="/action_types", tags=["action_types"]
)
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
api_router.include_router(triggers.router, prefix="/triggers", tags=["triggers"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
