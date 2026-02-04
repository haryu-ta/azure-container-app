# ベースイメージとしてPythonを使用
FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# 必要なファイルをコピー
COPY requirements.txt requirements.txt
COPY notify_service.py notify_service.py

# ライブラリをインストール
RUN pip install -r requirements.txt

# アプリケーションを起動
CMD ["python", "notify_service.py"]
