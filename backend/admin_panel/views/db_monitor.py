import os
from django.conf import settings
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

class DatabaseMonitorView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        db_engine = settings.DATABASES['default']['ENGINE']
        is_postgresql = 'postgresql' in db_engine or 'postgis' in db_engine

        db_size = "N/A"
        tables_info = []
        db_version = "Unknown"
        connection_status = "Connected"
        conn_pool_size = 0
        total_rows = 0

        try:
            with connection.cursor() as cursor:
                if is_postgresql:
                    cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
                    db_size = cursor.fetchone()[0]

                    cursor.execute("SELECT version()")
                    db_version = cursor.fetchone()[0].split(',')[0]

                    cursor.execute("SELECT count(*) FROM pg_stat_activity")
                    conn_pool_size = cursor.fetchone()[0]

                    cursor.execute("""
                        SELECT 
                            relname AS table_name, 
                            n_live_tup AS row_count,
                            pg_size_pretty(pg_total_relation_size(relid)) AS table_size
                        FROM pg_stat_user_tables
                        ORDER BY n_live_tup DESC;
                    """)
                    for row in cursor.fetchall():
                        tables_info.append({
                            "name": row[0],
                            "rows": row[1],
                            "size": row[2]
                        })
                        total_rows += row[1]
                else:
                    db_version = "SQLite (Development)"
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                    tables = [r[0] for r in cursor.fetchall()]
                    for tbl in tables:
                        cursor.execute(f"SELECT count(*) FROM [{tbl}]")
                        cnt = cursor.fetchone()[0]
                        tables_info.append({
                            "name": tbl,
                            "rows": cnt,
                            "size": "N/A"
                        })
                        total_rows += cnt

                    db_name = settings.DATABASES['default']['NAME']
                    if os.path.exists(db_name):
                        sz = os.path.getsize(db_name)
                        db_size = f"{round(sz / (1024 * 1024), 2)} MB"

        except Exception as e:
            connection_status = f"Error: {str(e)}"

        return Response({
            "database_type": "PostgreSQL (Neon)" if is_postgresql else "SQLite",
            "database_version": db_version,
            "connection_status": connection_status,
            "database_size": db_size,
            "active_connections": conn_pool_size,
            "number_of_tables": len(tables_info),
            "number_of_rows": total_rows,
            "tables": tables_info,
            "storage_limit": "3 GB (Free Tier)" if is_postgresql else "Unlimited (Local)",
            "storage_used_pct": round((total_rows / 100000.0) * 100, 2) if is_postgresql else 0.0
        })
