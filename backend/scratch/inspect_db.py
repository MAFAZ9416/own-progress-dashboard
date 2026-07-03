import sqlite3
import os

db_path = 'db.sqlite3'
if not os.path.exists(db_path):
    print("Database not found!")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in database:")
for t in tables:
    t_name = t[0]
    cursor.execute(f"SELECT COUNT(*) FROM {t_name}")
    count = cursor.fetchone()[0]
    print(f"  {t_name}: {count} rows")

cursor.execute("SELECT id, username, is_staff, is_superuser FROM users_user;")
users = cursor.fetchall()
print("\nUsers in database:")
for u in users:
    print(f"  User: id={u[0]}, username={u[1]}, is_staff={u[2]}, is_superuser={u[3]}")

conn.close()
