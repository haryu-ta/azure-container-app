import os
import psycopg2
from psycopg2.extras import RealDictCursor
import datetime
import smtplib
from email.mime.text import MIMEText
import pytz
import logging
from dateutil.parser import parse
import time
import sys

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', stream=sys.stdout)

# 定数（PostgreSQL用）
POSTGRES_USER = os.getenv('POSTGRES_USER')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
POSTGRES_DB = os.getenv('POSTGRES_DB')
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_SSLMODE = os.getenv('POSTGRES_SSLMODE', 'disable')
JST = pytz.timezone('Asia/Tokyo')
SLEEP_SECONDS = int(os.getenv('SLEEP_SECONDS', '3600'))  # デフォルトは3600秒（1時間）

print(f"PostgreSQL connection settings: {POSTGRES_USER}, {POSTGRES_DB}, {POSTGRES_HOST}, {POSTGRES_PORT}, {POSTGRES_SSLMODE}")

# PostgreSQL接続関数
def get_pg_connection():
    try:
        conn = psycopg2.connect(
            dbname=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            sslmode=POSTGRES_SSLMODE,
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        logging.error(f"Failed to connect to PostgreSQL: {e}")
        return None

def get_todos():
    """PostgreSQLからToDoタスクを取得"""
    conn = get_pg_connection()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, due_date as \"dueDate\" FROM todos")
            todos = cur.fetchall()
            logging.info(f"{len(todos)} tasks retrieved from PostgreSQL.")
            return todos
    except Exception as e:
        logging.error(f"Failed to retrieve tasks: {e}")
        return []
    finally:
        conn.close()

def send_email(subject, body):
    """メールを送信"""
    try:
        sender_email = os.getenv('SENDER_EMAIL')
        sender_password = os.getenv('EMAIL_PASSWORD')
        recipient_email = os.getenv('RECIPIENT_EMAIL')

        if not all([sender_email, sender_password, recipient_email]):
            logging.error("Email credentials or recipient email are not set.")
            return

        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = recipient_email

        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        logging.info(f"Email sent: {subject}")
    except smtplib.SMTPAuthenticationError as e:
        logging.error(f"Failed to send email due to authentication error: {e}. "
                      "Ensure you are using an application-specific password. "
                      "Refer to https://support.google.com/mail/?p=InvalidSecondFactor for more details.")
    except Exception as e:
        logging.error(f"Failed to send email: {e}")

def create_email_body(tasks, task_type):
    """メール本文を作成"""
    task_list = "\n".join([f"- {task['title']} (Due: {task['dueDate']})" for task in tasks])
    return f"{task_type}:\n{task_list}" if tasks else ""

def notify_due_tasks():
    """期限に応じてタスクを通知"""
    try:
        todos = get_todos()
        today = datetime.datetime.now(JST).date()
        tomorrow = today + datetime.timedelta(days=1)

        def get_due_date(todo):
            due = todo['dueDate']
            if isinstance(due, str):
                return parse(due).date()
            elif isinstance(due, datetime.datetime):
                return due.date()
            else:
                return None

        today_tasks = [todo for todo in todos if get_due_date(todo) == today]
        tomorrow_tasks = [todo for todo in todos if get_due_date(todo) == tomorrow]
        expired_tasks = [todo for todo in todos if get_due_date(todo) and get_due_date(todo) < today]

        if today_tasks:
            print(f"Tasks due today: {len(today_tasks)}")
            body = create_email_body(today_tasks, "Tasks due today")
            send_email("【Today's Tasks】", body)
        if tomorrow_tasks:
            print(f"Tasks due tomorrow: {len(tomorrow_tasks)}")
            body = create_email_body(tomorrow_tasks, "Tasks due tomorrow")
            send_email("【Tomorrow's Tasks】", body)
        if expired_tasks:
            print(f"Expired tasks: {len(expired_tasks)}")
            body = create_email_body(expired_tasks, "Tasks that are overdue")
            send_email("【Expired Tasks】", body)
    except Exception as e:
        logging.error(f"An error occurred while notifying tasks: {e}")
        

def main():
    logging.info("Notification service started.")
    try:
        while True:
            notify_due_tasks()  # SLEEP_SECONDSごとに通知を実行
            logging.info(f"Notification task completed. Waiting {SLEEP_SECONDS} seconds...")
            time.sleep(SLEEP_SECONDS)
    except Exception as e:
        logging.error(f"An error occurred during notification execution: {e}")

if __name__ == "__main__":
    main()