"""
Главный API для CMS управления заявками.
Роуты: /auth/login, /tickets (GET/POST), /tickets/{id} (GET/PATCH),
       /dashboard, /ppr, /warehouse, /clients, /users
"""

import json
import os
import psycopg2
from datetime import datetime, date

SCHEMA = "t_p32918684_cms_zayavok_system"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(data, status=200):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(msg, status=400):
    return resp({"error": msg}, status)


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    raw_path = event.get("path", "/")
    # Убираем ID функции из пути: /abf93478-da2a.../auth/login → /auth/login
    parts = raw_path.split("/")
    # parts[0]="" parts[1]=uuid parts[2+]=route
    if len(parts) > 2 and len(parts[1]) > 30:
        path = "/" + "/".join(parts[2:])
    else:
        path = raw_path
    path = path.rstrip("/") or "/"
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # ── AUTH ──────────────────────────────────────────────────────────────────
    if path == "/auth/login" and method == "POST":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        if not email or not password:
            return err("Email и пароль обязательны")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, email, role, department, phone, position FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s AND active = true",
            (email, password),
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return err("Неверный email или пароль", 401)
        cols = ["id", "name", "email", "role", "department", "phone", "position"]
        user = dict(zip(cols, row))
        return resp({"user": user, "token": f"tok_{user['id']}"})

    # ── DASHBOARD ─────────────────────────────────────────────────────────────
    if path == "/dashboard" and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
                COUNT(*) FILTER (WHERE status = 'new') as new_count,
                COUNT(*) FILTER (WHERE status = 'inwork') as inwork_count,
                COUNT(*) FILTER (WHERE status = 'done' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW())) as done_month,
                COUNT(*) FILTER (WHERE status IN ('new','inwork') AND due_date < CURRENT_DATE) as overdue
            FROM {SCHEMA}.tickets
        """)
        stats_row = cur.fetchone()

        cur.execute(f"SELECT COUNT(DISTINCT id) FROM {SCHEMA}.clients")
        clients_count = cur.fetchone()[0]

        cur.execute(f"""
            SELECT u.id, u.name,
                COUNT(t.id) FILTER (WHERE t.status IN ('new','inwork')) as active_tasks
            FROM {SCHEMA}.users u
            LEFT JOIN {SCHEMA}.tickets t ON t.engineer_id = u.id
            WHERE u.role IN ('engineer','chief_engineer')
            GROUP BY u.id, u.name
            ORDER BY active_tasks DESC
            LIMIT 5
        """)
        engineers = [{"id": r[0], "name": r[1], "active_tasks": r[2]} for r in cur.fetchall()]

        cur.execute(f"""
            SELECT t.id, t.number, t.title, t.status, t.priority, t.due_date,
                   c.name as client_name, t.system_type,
                   u.name as engineer_name
            FROM {SCHEMA}.tickets t
            LEFT JOIN {SCHEMA}.clients c ON c.id = t.client_id
            LEFT JOIN {SCHEMA}.users u ON u.id = t.engineer_id
            ORDER BY t.created_at DESC LIMIT 6
        """)
        cols = ["id", "number", "title", "status", "priority", "due_date", "client_name", "system_type", "engineer_name"]
        recent_tickets = [dict(zip(cols, r)) for r in cur.fetchall()]

        conn.close()
        return resp({
            "stats": {
                "new": stats_row[0],
                "inwork": stats_row[1],
                "done_month": stats_row[2],
                "overdue": stats_row[3],
                "clients": clients_count,
            },
            "engineers": engineers,
            "recent_tickets": recent_tickets,
        })

    # ── TICKETS LIST ──────────────────────────────────────────────────────────
    if path == "/tickets" and method == "GET":
        params = event.get("queryStringParameters") or {}
        status_filter = params.get("status")
        engineer_filter = params.get("engineer_id")
        client_filter = params.get("client_id")
        search = params.get("q", "").strip()

        conditions = []
        values = []
        if status_filter and status_filter != "all":
            conditions.append(f"t.status = %s")
            values.append(status_filter)
        if engineer_filter:
            conditions.append(f"t.engineer_id = %s")
            values.append(int(engineer_filter))
        if client_filter:
            conditions.append(f"t.client_id = %s")
            values.append(int(client_filter))
        if search:
            conditions.append(f"(t.title ILIKE %s OR t.number ILIKE %s)")
            values.extend([f"%{search}%", f"%{search}%"])

        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT t.id, t.number, t.title, t.status, t.priority, t.system_type,
                   t.due_date, t.created_at,
                   c.name as client_name,
                   u.name as engineer_name,
                   u.id as engineer_id
            FROM {SCHEMA}.tickets t
            LEFT JOIN {SCHEMA}.clients c ON c.id = t.client_id
            LEFT JOIN {SCHEMA}.users u ON u.id = t.engineer_id
            {where}
            ORDER BY t.created_at DESC
        """, values)
        cols = ["id", "number", "title", "status", "priority", "system_type",
                "due_date", "created_at", "client_name", "engineer_name", "engineer_id"]
        tickets = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return resp({"tickets": tickets})

    # ── TICKET CREATE ─────────────────────────────────────────────────────────
    if path == "/tickets" and method == "POST":
        title = body.get("title", "").strip()
        if not title:
            return err("Тема заявки обязательна")

        conn = get_conn()
        cur = conn.cursor()

        # Генерируем номер
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tickets")
        count = cur.fetchone()[0]
        number = f"ЗВ-2026-{count + 1:04d}"

        # Автоназначение: инженер с наименьшей нагрузкой
        auto_engineer_id = body.get("engineer_id")
        if not auto_engineer_id and body.get("auto_assign", True):
            cur.execute(f"""
                SELECT u.id FROM {SCHEMA}.users u
                LEFT JOIN {SCHEMA}.tickets t ON t.engineer_id = u.id AND t.status IN ('new','inwork')
                WHERE u.role IN ('engineer') AND u.active = true
                GROUP BY u.id
                ORDER BY COUNT(t.id) ASC
                LIMIT 1
            """)
            row = cur.fetchone()
            if row:
                auto_engineer_id = row[0]

        due_date = body.get("due_date") or None
        client_id = body.get("client_id") or None
        created_by = body.get("created_by") or None

        cur.execute(f"""
            INSERT INTO {SCHEMA}.tickets
                (number, title, description, client_id, system_type, priority, engineer_id, created_by, due_date)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id, number, status
        """, (
            number,
            title,
            body.get("description", ""),
            client_id,
            body.get("system_type", ""),
            body.get("priority", "medium"),
            auto_engineer_id,
            created_by,
            due_date,
        ))
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return resp({"id": row[0], "number": row[1], "status": row[2]}, 201)

    # ── TICKET GET ONE ────────────────────────────────────────────────────────
    if path.startswith("/tickets/") and method == "GET":
        ticket_id = path.split("/")[-1]
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT t.id, t.number, t.title, t.description, t.status, t.priority,
                   t.system_type, t.due_date, t.created_at, t.updated_at,
                   c.name as client_name, c.id as client_id,
                   u.name as engineer_name, u.id as engineer_id,
                   cb.name as created_by_name
            FROM {SCHEMA}.tickets t
            LEFT JOIN {SCHEMA}.clients c ON c.id = t.client_id
            LEFT JOIN {SCHEMA}.users u ON u.id = t.engineer_id
            LEFT JOIN {SCHEMA}.users cb ON cb.id = t.created_by
            WHERE t.id = %s
        """, (ticket_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заявка не найдена", 404)
        cols = ["id", "number", "title", "description", "status", "priority",
                "system_type", "due_date", "created_at", "updated_at",
                "client_name", "client_id", "engineer_name", "engineer_id", "created_by_name"]
        ticket = dict(zip(cols, row))

        # Комментарии
        cur.execute(f"""
            SELECT tc.id, tc.text, tc.created_at, u.name
            FROM {SCHEMA}.ticket_comments tc
            JOIN {SCHEMA}.users u ON u.id = tc.user_id
            WHERE tc.ticket_id = %s ORDER BY tc.created_at
        """, (ticket_id,))
        ticket["comments"] = [{"id": r[0], "text": r[1], "created_at": r[2], "author": r[3]} for r in cur.fetchall()]
        conn.close()
        return resp({"ticket": ticket})

    # ── TICKET UPDATE ─────────────────────────────────────────────────────────
    if path.startswith("/tickets/") and method == "PATCH":
        ticket_id = path.split("/")[-1]
        allowed = ["status", "priority", "engineer_id", "due_date", "title", "description", "system_type"]
        updates = {k: v for k, v in body.items() if k in allowed}
        if not updates:
            return err("Нет данных для обновления")

        set_parts = ", ".join(f"{k} = %s" for k in updates)
        values = list(updates.values()) + [ticket_id]

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.tickets SET {set_parts}, updated_at = NOW() WHERE id = %s RETURNING id, number, status",
            values
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        if not row:
            return err("Заявка не найдена", 404)
        return resp({"id": row[0], "number": row[1], "status": row[2]})

    # ── COMMENT ADD ───────────────────────────────────────────────────────────
    if path.startswith("/tickets/") and path.endswith("/comments") and method == "POST":
        parts = path.split("/")
        ticket_id = parts[-2]
        text = body.get("text", "").strip()
        user_id = body.get("user_id")
        if not text or not user_id:
            return err("Текст и user_id обязательны")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.ticket_comments (ticket_id, user_id, text) VALUES (%s,%s,%s) RETURNING id",
            (ticket_id, user_id, text)
        )
        comment_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return resp({"id": comment_id}, 201)

    # ── PPR ───────────────────────────────────────────────────────────────────
    if path == "/ppr" and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT p.id, p.system_type, p.maintenance_type,
                   p.date_start, p.date_end, p.status, p.notes,
                   c.name as client_name,
                   u.name as engineer_name
            FROM {SCHEMA}.ppr_schedule p
            LEFT JOIN {SCHEMA}.clients c ON c.id = p.client_id
            LEFT JOIN {SCHEMA}.users u ON u.id = p.engineer_id
            ORDER BY p.date_start
        """)
        cols = ["id", "system_type", "maintenance_type", "date_start", "date_end",
                "status", "notes", "client_name", "engineer_name"]
        items = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return resp({"ppr": items})

    # ── WAREHOUSE ─────────────────────────────────────────────────────────────
    if path == "/warehouse" and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, name, category, unit, quantity, min_quantity, price, location
            FROM {SCHEMA}.warehouse_items ORDER BY name
        """)
        cols = ["id", "name", "category", "unit", "quantity", "min_quantity", "price", "location"]
        items = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return resp({"items": items, "low_stock": sum(1 for i in items if float(i["quantity"]) <= float(i["min_quantity"]))})

    # ── CLIENTS ───────────────────────────────────────────────────────────────
    if path == "/clients" and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, address, phone, email, contact_person FROM {SCHEMA}.clients ORDER BY name")
        cols = ["id", "name", "address", "phone", "email", "contact_person"]
        items = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return resp({"clients": items})

    # ── USERS ─────────────────────────────────────────────────────────────────
    if path == "/users" and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, name, email, role, department, phone, position, active
            FROM {SCHEMA}.users WHERE active = true ORDER BY name
        """)
        cols = ["id", "name", "email", "role", "department", "phone", "position", "active"]
        items = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return resp({"users": items})

    return err("Роут не найден", 404)