from __future__ import annotations

import sqlite3
from typing import Any

from fastapi import FastAPI, HTTPException, Query

app = FastAPI()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect("app.db")
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/users")
def list_users(
    search: str = Query("", description="Optional substring match on username"),
    page: int = Query(1, ge=1, description="1-based page number"),
    page_size: int = Query(25, ge=1, le=100, description="Rows per page"),
) -> dict[str, Any]:
    """Secure + paginated user listing endpoint.

    Fixes:
    1) Uses bound SQL parameters to prevent injection.
    2) Adds LIMIT/OFFSET pagination.
    3) Returns 404 when no rows are found for the requested page/filter.
    """

    offset = (page - 1) * page_size

    conn = get_connection()
    try:
        total = conn.execute(
            "SELECT COUNT(*) FROM users WHERE username LIKE ?",
            (f"%{search}%",),
        ).fetchone()[0]

        rows = conn.execute(
            """
            SELECT id, username, email
            FROM users
            WHERE username LIKE ?
            ORDER BY id
            LIMIT ? OFFSET ?
            """,
            (f"%{search}%", page_size, offset),
        ).fetchall()
    finally:
        conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="No users found")

    items = [dict(row) for row in rows]
    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }
