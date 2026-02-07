pipeline {
    agent any

    environment {
        AZURE_CREDENTIALS   = credentials('azure-credentials-id')
        ACR_NAME            = credentials('acr-name')
        RESOURCE_GROUP      = credentials('resource-group')
        CONTAINER_APP_NAME  = credentials('container-app-name')
    }

    triggers {
        githubPush()
    }

    options {
        // 同時実行防止（EC2 メモリ保護）
        disableConcurrentBuilds()
    }

    stages {

        stage('Install Dependencies') {
            steps {
                dir('todo-app') {
                    sh '''
                        rm -rf node_modules
                        npm ci --no-audit --no-fund
                    '''
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
                sh '''
                    az login --service-principal \
                        --username ${AZURE_CREDENTIALS_USR} \
                        --password ${AZURE_CREDENTIALS_PSW} \
                        --tenant ${AZURE_TENANT_ID}
                '''
            }
        }

        stage('Build and Push to ACR') {
            steps {
                script {
                    def commitHash = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    sh """
                        az acr login --name ${ACR_NAME}

                        docker buildx inspect multiarch-builder >/dev/null 2>&1 || \
                        docker buildx create --name multiarch-builder --use

                        docker buildx build \
                            --platform linux/amd64 \
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
                    def commitHash = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

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
