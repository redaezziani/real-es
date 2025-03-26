pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_DIR = '/var/lib/jenkins/real-es'  
        GIT_REPO_URL = 'https://github.com/redaezziani/real-es.git'  
        GIT_BRANCH = 'master' 
    }

    stages {
        stage('Checkout Code from GitHub') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        sh 'git reset --hard'  
                        sh 'git clean -fd'  
                        sh "git checkout ${GIT_BRANCH}" 
                        sh 'git pull origin master'  
                    }
                }
            }
        }

        stage('Load Environment Variables from .env') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        // Ensure the .env file exists and load environment variables
                        sh 'if [ -f .env ]; then export $(cat .env | xargs); fi'  // Load .env variables
                    }
                }
            }
        }

        stage('Stop and Remove Old Containers') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        sh 'docker-compose down'  
                    }
                }
            }
        }

        stage('Build and Start New Containers') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        sh 'docker-compose up --build -d'  
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                       
                        sh 'docker-compose exec real-es_app npm install'  // Use 'real-es_app' as the backend service name
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        sh 'docker-compose exec real-es_app npm run test'  // Use 'real-es_app' as the backend service name
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker system prune -f'
        }
    }
}
