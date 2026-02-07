### AzureResourceの作成

1. インフラ構成をdeploy  
   ```
   azd up
   # この時点ではContainerAppの作成はエラーになる
   ```
2. AzurePotralからデータベースにtodosを作成
3. PostgreSQLを作成してテーブル作成およびデータを投入
    ```
    init.sqlの中身を実行
    ```
4. dockerのリポジトリを作成
   1. acrにログイン
   ```
   az acr login --name itamuraudemytodoapp0125acr01
   ```
   2. dockerにpushする
   ```
   # MacのDocker Desktopを起動しておくこと
   docker push itamuraudemytodoapp0125acr01.azurecr.io/todo-app:latest
   ```
5. 追加でデプロイ  
   ```
   # ここでContainerAppへのデプロイが成功する
   azd up
   ```

6. 後処理（お掃除）
   ```
   azd down
   ```

### サービスプリンシパル登録
外部（GitHubActions/Jenkinsから接続する際に必要な認証情報を取得）
Azure認証情報（サービスプリンシパル）の登録

```bash
az ad sp create-for-rbac \
  --name "ToDoAppDeployAuth" \
  --role contributor \
  --scopes /subscriptions/8b5cb1ca-11cf-4569-afef-11417407a543/resourceGroups/rg-itamuraudemytodoapp0125 \
  --sdk-auth
# 実行結果のJSONはメモしておく
```

ACR への AcrPush 権限付与
```bash
az role assignment create \
  --assignee b3db4cc5-6d3b-4c4e-8297-01acb04fe965 \
  --role AcrPush \
  --scope /subscriptions/8b5cb1ca-11cf-4569-afef-11417407a543/resourceGroups/rg-itamuraudemytodoapp0125/providers/Microsoft.ContainerRegistry/registries/itamuraudemytodoapp0125acr01
# 実行結果のJSONはメモしておく
```

### jenkinsへの認証情報の登録
### jenkinsジョブの作成
### GitHubのWebhookの設定
---

### JENKINS接続

```
cd /Users/ryoheiitamura/Documents/aws_account
ssh -i udemysample.pem ec2-user@xx.xx.xx.xx

ls -l
sudo ./start.ksh

http://[PublicIPアドレス]:8080

jenkinsユーザ
itamura_ryohei
```