import pytest
import notify_service
from unittest.mock import patch, MagicMock
import datetime
import os
from dotenv import load_dotenv

# テスト開始時に.env.localを読み込む
load_dotenv('.env.local')

# get_todosのテスト
@patch('notify_service.get_pg_connection')
def test_get_todos_success(mock_get_pg_connection):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_cursor.fetchall.return_value = [
        {'id': 1, 'title': 'Test Task', 'dueDate': '2025-06-08'}
    ]
    mock_get_pg_connection.return_value = mock_conn
    todos = notify_service.get_todos()
    assert len(todos) == 1
    assert todos[0]['title'] == 'Test Task'

@patch('notify_service.get_pg_connection', return_value=None)
def test_get_todos_connection_fail(mock_get_pg_connection):
    todos = notify_service.get_todos()
    assert todos == []

# send_emailのテスト
@patch('smtplib.SMTP')
@patch.dict('os.environ', {'SENDER_EMAIL': 'a@example.com', 'EMAIL_PASSWORD': 'pw', 'RECIPIENT_EMAIL': 'b@example.com'})
def test_send_email_success(mock_smtp):
    instance = mock_smtp.return_value.__enter__.return_value
    notify_service.send_email('subject', 'body')
    instance.starttls.assert_called_once()
    instance.login.assert_called_once_with('a@example.com', 'pw')
    instance.sendmail.assert_called_once()

@patch('smtplib.SMTP')
def test_send_email_missing_env(mock_smtp):
    with patch.dict('os.environ', {}, clear=True):
        result = notify_service.send_email('subject', 'body')
        assert result is None

# create_email_bodyのテスト
def test_create_email_body():
    tasks = [{'title': 'Task1', 'dueDate': '2025-06-08'}]
    body = notify_service.create_email_body(tasks, '今日のタスク')
    assert 'Task1' in body
    assert '今日のタスク' in body
    assert '- Task1' in body
    assert '(Due: 2025-06-08)' in body

def test_create_email_body_empty():
    body = notify_service.create_email_body([], '今日のタスク')
    assert body == ''

# notify_due_tasksのテスト
@patch('notify_service.get_todos')
@patch('notify_service.send_email')
def test_notify_due_tasks(mock_send_email, mock_get_todos):
    today = datetime.datetime.now(notify_service.JST).date()
    tomorrow = today + datetime.timedelta(days=1)
    mock_get_todos.return_value = [
        {'id': 1, 'title': '今日', 'dueDate': str(today)},
        {'id': 2, 'title': '明日', 'dueDate': str(tomorrow)},
        {'id': 3, 'title': '期限切れ', 'dueDate': str(today - datetime.timedelta(days=1))},
    ]
    notify_service.notify_due_tasks()
    # 3回メール送信される
    assert mock_send_email.call_count == 3
