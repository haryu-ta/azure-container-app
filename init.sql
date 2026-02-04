CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMPTZ, -- タイムゾーン付きタイムスタンプに変更
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Completed')) NOT NULL
);

-- テストデータの挿入
INSERT INTO todos (title, description, due_date, status) VALUES
('Azureコンテナサービスの基本を学ぶ', 'UdemyコースでAzureコンテナサービスの基本を学習する', '2025-05-18T00:00:00.000Z', 'Not Started'),
('Dockerの基礎を復習する', 'Dockerの基本的なコマンドと概念を復習する', '2025-05-28T00:00:00.000Z', 'In Progress'),
('Azure Container Appsのデプロイを試す', 'Azure Container Appsのデプロイ方法を学ぶ', '2025-05-28T00:00:00.000Z', 'Not Started'),
('GitHub Actionsを継続的デプロイ', 'GitHub Actionsを使ってアプリを継続的にデプロイする', '2025-05-28T00:00:00.000Z', 'Not Started');