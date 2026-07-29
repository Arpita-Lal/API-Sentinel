import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from flask import Blueprint, render_template, request, g
from backend.database import get_db
from backend.auth import require_admin

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
def index():
    return render_template('index.html')

@dashboard_bp.route('/api/stats')
@require_admin
def get_stats():
    with get_db() as conn:
        total_requests = conn.execute('SELECT count(*) FROM request_logs').fetchone()[0]
        total_alerts = conn.execute('SELECT count(*) FROM alerts').fetchone()[0]
        # Active users: distinct user_ids in the last hour
        active_users = conn.execute('''
            SELECT count(DISTINCT user_id) FROM request_logs 
            WHERE timestamp >= datetime('now', '-1 hour') AND user_id IS NOT NULL
        ''').fetchone()[0]
        
        return {"total_requests": total_requests, "total_alerts": total_alerts, "active_users": active_users}

@dashboard_bp.route('/api/logs')
@require_admin
def get_logs():
    with get_db() as conn:
        logs = conn.execute('SELECT * FROM request_logs ORDER BY id DESC LIMIT 100').fetchall()
        return {"data": [dict(r) for r in logs]}

@dashboard_bp.route('/api/alerts')
@require_admin
def get_alerts():
    with get_db() as conn:
        alerts = conn.execute('SELECT * FROM alerts ORDER BY id DESC LIMIT 100').fetchall()
        return {"data": [dict(r) for r in alerts]}

@dashboard_bp.route('/api/inventory')
@require_admin
def get_inventory():
    with get_db() as conn:
        inventory = conn.execute('SELECT * FROM api_inventory').fetchall()
        return {"data": [dict(r) for r in inventory]}
