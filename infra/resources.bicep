param prefix string
param location string
@secure()
param adminPassword string

// --------------------
// Azure Container Registry
// --------------------
resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: '${prefix}acr01'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// --------------------
// Log Analytics
// --------------------
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${prefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// --------------------
// PostgreSQL
// --------------------
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: '${prefix}-pg'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'pgadmin'
    administratorLoginPassword: adminPassword
    storage: {
      storageSizeGB: 32
    }
    highAvailability: {
      mode: 'Disabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
  }
}

// --------------------
// Firewall
// --------------------
// Allow public access from any Azure service within Azure
resource postgresFirewallAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// --------------------
// Container Apps Environment
// --------------------
resource containerEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${prefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// --------------------
// Container App
// --------------------
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${prefix}-app'
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'db-password'
          value: adminPassword
        }
      ]
    }
    
    template: {
      containers: [
        {
          name: 'todo-app'
          image: '${acr.properties.loginServer}/todo-app:latest'
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'POSTGRES_HOST'
              value: postgres.properties.fullyQualifiedDomainName
            }
            {
              name: 'POSTGRES_PORT'
              value: '5432'
            }
            {
              name: 'POSTGRES_USER'
              value: 'pgadmin'
            }
            {
              name: 'POSTGRES_PASSWORD'
              secretRef: 'db-password'
            }
            {
              name: 'POSTGRES_DB'
              value: 'todos'
            }
            {
              name: 'PORT'
              value: '3000'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// resource appServiceTodo 'Microsoft.Web/sites@2022-09-01' = {
//   name: '${prefix}-app'
//   location: location
//   kind: 'app,linux,container'
//   properties: {
//     serverFarmId: appServicePlan.id
//     httpsOnly: true
//     siteConfig: {
//       // linuxFxVersion: 'DOCKER|<todo-app-image>' // デプロイ時にイメージ名へ置換
//     }
//   }
// }

// resource appServiceNotify 'Microsoft.Web/sites@2022-09-01' = {
//   name: '${prefix}-notify'
//   location: location
//   kind: 'app,linux,container'
//   properties: {
//     serverFarmId: appServicePlan.id
//     httpsOnly: true
//     siteConfig: {
//       // linuxFxVersion: 'DOCKER|<notify-service-image>' // デプロイ時にイメージ名へ置換
//     }
//   }
// }
