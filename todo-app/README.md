# TODOアプリ - Postgresデータベース

このアプリケーションは、Postgresデータベースを使用してTODOを管理します。

## Postgres設定

- **ユーザ名**: `udemy_learn_user`
- **パスワード**: `udemy_learn_password`
- **データベース名**: `udemy_learn_db`

## テーブル定義

以下の`todos`テーブルが使用されます。

```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Completed')) NOT NULL
);
```

