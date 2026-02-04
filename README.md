

## ローカル開発準備
init.sqlのタスクの更新日時を変更。稼働確認できるように、翌日などにする

PostgresのDockerを起動
```bash
docker-compose -f .\docker-compose-postgres.yml up -d
```

Postgresコンテナのログを確認
```bash
docker logs postgres_db
```

Postgresのコンテナに入る
```bash
docker exec -it postgres_db psql -U udemy_learn_user -d udemy_learn_db
```

テーブル一覧を確認
```sql
\dt
```

テーブルの中身を確認
```sql
\d todos
```

```sql
SELECT * FROM todos;
```

```sql
\q
```

#### そのほか
DockerのVolumeを削除
```bash
docker volume rm udemy-container-todo-app_postgres_data
```

## ローカル開発
### ToDoアプリ
.env.local ファイルを作成し、以下の内容を記述します。
```env
POSTGRES_USER=udemy_learn_user
POSTGRES_PASSWORD=udemy_learn_password
POSTGRES_DB=udemy_learn_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_SSLMODE=disable
```

モジュールをインストールします。
```bash
npm install
npm run dev
```

### 通知サービス
#### Googleメール送信

Googleアカウントにログインし、アプリパスワードを設定します。
https://myaccount.google.com/apppasswords
アプリ名とパスワードをコピーして控えておいてください。

.env ファイルを作成し、以下の内容を記述します。
SLEEP_SECONDSは、通知サービスが何秒ごとにデータベースを確認するかを指定します。動作確認のためであれば、60sなどに設定しておくと良いでしょう。

```env
POSTGRES_USER="udemy_learn_user"
POSTGRES_PASSWORD="udemy_learn_password"
POSTGRES_DB="udemy_learn_db"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_SSLMODE="disable"
SENDER_EMAIL="メールアドレス"
EMAIL_PASSWORD="Gmailのアプリパスワード"
RECIPIENT_EMAIL="メールアドレス"
SLEEP_SECONDS="3600"
```

VSCodeをnotify-serviceフォルダで開き、ターミナルを開いて以下のコマンドを実行します。
```bash
pip install -r requirements.txt
```
```bash
python notify_service.py
```


## Dockerビルドと起動

### ToDoアプリの環境変数ファイル
.env.local.containerファイルを作成し、以下の内容を記述します。
```env
POSTGRES_USER=udemy_learn_user
POSTGRES_PASSWORD=udemy_learn_password
POSTGRES_DB=udemy_learn_db
POSTGRES_HOST=postgres_db
POSTGRES_PORT=5432
```

### notifyサービスの環境変数ファイル
.env.local.containerファイルを作成し、以下の内容を記述します。
```env
POSTGRES_USER="udemy_learn_user"
POSTGRES_PASSWORD="udemy_learn_password"
POSTGRES_DB="udemy_learn_db"
POSTGRES_HOST="postgres_db"
POSTGRES_PORT="5432"
POSTGRES_SSLMODE="disable"
SENDER_EMAIL="メールアドレス"
EMAIL_PASSWORD="Gmailのアプリパスワード"
RECIPIENT_EMAIL="メールアドレス"
SLEEP_SECONDS="3600"
```

docker-compose.local.ymlを使用して、Dockerイメージをビルドして起動します。
```bash
docker-compose -f docker-compose.local.yml up -d
```

# Azureリソースの作成
前提
- Azure CLIがインストールされていること
- azdがインストールされていること
- VSCodeにBicep拡張機能がインストールされていること

### Azure CLIのログイン
```bash
az login
```

ログイン情報の確認
```bash
az account show
```

### Azureリソースの作成
```bash
cd .\infra
```

main.bicepのprefix名を一意な名前に変更します。小文字英字と数字のみにしましょう。
例）todoappshrkm0708
```bash
azd up
```

一意なリソース名：todoappなど
リージョンを選ぶ：japaneast
Postgresのパスワード：パスワード

```bash
PS C:\Users\AdmUser\Documents\Udemy\udemy-azure-container\udemy-container-todo-base> azd up
? Pick a resource group to use: 1. Create a new resource group
? Select a location to create the resource group in: 10. (Asia Pacific) Japan East (japaneast)
? Enter a name for the new resource group: (rg-todo) 

? Enter a name for the new resource group: rg-todo

Packaging services (azd package)


Provisioning Azure resources (azd provision)
Provisioning Azure resources can take some time.

Subscription: Microsoft Azure Education (8de42282-72ff-4d35-b380-ccfbf9e8f3fd)

  You can view detailed progress in the Azure Portal:
  https://portal.azure.com/#view/HubsExtension/DeploymentDetailsBlade/~/overview/id/%2Fsubscriptions%2F8de42282-72ff-4d35-b380-ccfbf9e8f3fd%2FresourceGroups%2Frg-todo%2Fproviders%2FMicrosoft.Resources%2Fdeployments%2Ftodo-1749365118

  (✓) Done: Container Registry: udemytodoappacr01 (10.141s)
demytodoapp-pg (5m8.903s)

Deploying services (azd deploy)


SUCCESS: Your up workflow to provision and deploy to Azure completed in 5 minutes 28 seconds.
```

### 各リソースへの設定と手動デプロイ&稼働確認
./infraフォルダ参照

- PostgreSQLにデータベース作成とテーブル作成、データ登録
- ACRにToDoアプリと通知サービスのコンテナイメージをプッシュ
- App ServiceにToDoアプリのデプロイ


### ContainerAppの作成

1. インフラ構成をdeploy  
   ```
   azd up
   ```
2. AzurePotralからデータベースにtodosを作成
3. PostgreSQLを作成してテーブル作成およびデータを投入
4. dockerのリポジトリを作成
   1. acrにログイン
   ```
   az acr login --name itamuraudemytodoapp0125acr01
   ```
   2. dockerにpushする
   ```
   docker push itamuraudemytodoapp0125acr01.azurecr.io/todo-app:latest
   ```
5. 追加でデプロイ  
   ```
   azd up
   ```
