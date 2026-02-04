import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const isAzure = process.env.POSTGRES_HOST && process.env.POSTGRES_HOST.includes('postgres.database.azure.com');
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  ssl: isAzure ? { rejectUnauthorized: false } : false,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      // 特定のIDのTODOを取得
      const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
      }
      const todo = result.rows[0];
      todo.dueDate = todo.due_date; // タイムゾーン変換を行わずそのまま返す
      delete todo.due_date; // 不要なフィールドを削除
      return NextResponse.json(todo);
    } else {
      // 全TODOを取得
      const result = await pool.query('SELECT * FROM todos ORDER BY due_date ASC');
      const todos = result.rows.map((todo) => ({
        ...todo,
        dueDate: todo.due_date, // タイムゾーン変換を行わずそのまま返す
      }));
      return NextResponse.json(todos);
    }
  } catch (error) {
    console.error('Error fetching todos from Postgres:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, title, description, status, dueDate, createdAt, updatedAt } = body;

    // 必須フィールドの検証
    if (!id || !title || !description || !status || !dueDate || !createdAt || !updatedAt) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const formattedDueDate = new Date(dueDate).toISOString(); // ISO形式に変換

    const query = `
        INSERT INTO todos (id, title, description, status, due_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
    const values = [id, title, description, status, formattedDueDate, createdAt, updatedAt];
    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating todo in Postgres:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, description, status, dueDate, createdAt } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for updating a todo' }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    const formattedDueDate = new Date(dueDate).toISOString(); // ISO形式に変換

    const query = `
        UPDATE todos
        SET title = $2, description = $3, status = $4, due_date = $5, created_at = $6, updated_at = $7
        WHERE id = $1
        RETURNING *;
      `;
    const values = [id, title, description, status, formattedDueDate, createdAt, updatedAt];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating todo in Postgres:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deleting a todo' }, { status: 400 });
    }

    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo from Postgres:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
