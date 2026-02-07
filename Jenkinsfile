pipeline {
    agent any
    
    environment {
        // Jenkins Credentials から取得
        AZURE_CREDENTIALS = credentials('azure-credentials-id')
        ACR_NAME = credentials('acr-name')
        RESOURCE_GROUP = credentials('resource-group')
        CONTAINER_APP_NAME = credentials('container-app-name')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('todo-app') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('todo-app') {
                    sh 'npm test'
                }
            }
        }
        
        stage('Azure Login') {
            steps {
                script {
                    // Azure CLI を使用してログイン
                    sh '''
                        az login --service-principal \
                            --username ${AZURE_CREDENTIALS_USR} \
                            --password ${AZURE_CREDENTIALS_PSW} \
                            --tenant ${AZURE_TENANT_ID}
                    '''
                }
            }
        }
        
        stage('Build and Push to ACR') {
            steps {
                script {
                    def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    
                    sh """
                        az acr login --name ${ACR_NAME}
                        docker buildx create --use --name multiarch-builder || true
                        docker buildx build --platform linux/amd64 \
                            -t ${ACR_NAME}.azurecr.io/todo-app:${commitHash} \
                            -t ${ACR_NAME}.azurecr.io/todo-app:latest \
                            --push \
                            ./todo-app
                    """
                }
            }
        }
        
        stage('Deploy to Azure Container Apps') {
            steps {
                script {
                    def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    
                    sh """
                        az containerapp update \
                            --name ${CONTAINER_APP_NAME} \
                            --resource-group ${RESOURCE_GROUP} \
                            --image ${ACR_NAME}.azurecr.io/todo-app:${commitHash}
                    """
                }
            }
        }
    }
    
    post {
        always {
            // クリーンアップ
            sh 'docker buildx rm multiarch-builder || true'
        }
        success {
            echo 'Deployment succeeded!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}