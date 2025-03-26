pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_DIR = '/var/lib/jenkins/real-es'
        GIT_REPO_URL = 'https://github.com/redaezziani/real-es.git'
        GIT_BRANCH = 'master'  // Consider changing this to a parameter if you want flexibility
    }

    stages {
        stage('Checkout Code from GitHub') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        // Clean and checkout the specified branch
                        sh 'git reset --hard'
                        sh 'git clean -fd'
                        sh "git checkout ${GIT_BRANCH}"
                        sh 'git pull origin ${GIT_BRANCH}'
                    }
                }
            }
        }

        stage('Load Environment Variables from .env') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        // Load environment variables while ignoring comments
                        sh '''
                        if [ -f .env ]; then
                            export $(grep -v ^# .env | xargs)
                        fi
                        '''
                    }
                }
            }
        }

        stage('Stop and Remove Old Containers') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        // Gracefully stop and remove old containers
                        sh 'docker-compose down'
                    }
                }
            }
        }

        stage('Build and Start New Containers') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        // Build and start new containers in detached mode
                        sh 'docker-compose up --build -d'
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        // Install npm dependencies for the app container
                        sh 'docker-compose exec real-es_app npm install'
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        // Run tests inside the container
                        sh 'docker-compose exec real-es_app npm run test'
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker system prune -f'
        }

        success {
            echo 'Build completed successfully!'
        }

        failure {
            echo 'Build failed, please check the logs for more details.'
        }
    }
}
