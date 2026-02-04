// main.bicep
// 共通プレフィックスをパラメータ化し、最安構成でJapan Eastにリソースを作成
//
// このBicepファイルは、リソースグループスコープで主要なAzureリソース（ACR, PostgreSQL, App Service2種）をmoduleでデプロイします。
// 各リソース名の共通部分はprefixパラメータで指定できます。
// locationはデフォルトでJapan East（japaneast）です。
// adminPasswordはPostgreSQL用の管理者パスワードで、@secure()属性で安全に受け渡します。
//
// 【払い出すリソース一覧】
// - リソースグループ（${prefix}-rg）
//   └─ Azure Container Registry（${prefix}acr01, Basic）
//   └─ Azure Database for PostgreSQL Flexible Server（${prefix}-pg, Burstable最小構成）
//   └─ Azure App Service（${prefix}-app, todoアプリ用, Linuxコンテナ, F1 Freeプラン）
//   └─ Azure App Service（${prefix}-notify, 期限通知サービス用, Linuxコンテナ, F1 Freeプラン）
//
// ※各リソースの詳細設定はresources.bicep側で行います。

targetScope = 'resourceGroup'

param prefix string = 'itamuraudemytodoapp0125'
param location string = 'japaneast'
@secure()
param adminPassword string

module resources 'resources.bicep' = {
  name: 'resourcesModule'
  params: {
    prefix: prefix
    location: location
    adminPassword: adminPassword
  }
}
