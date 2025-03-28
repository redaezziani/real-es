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
                        echo 'Cleaning workspace and checking out the branch...'
                        sh '''
                            git fetch origin
                            git reset --hard origin/${GIT_BRANCH}
                            git clean -fd
                            git checkout ${GIT_BRANCH}
                            git pull origin ${GIT_BRANCH}
                        '''
                    }
                }
            }
        }

        stage('Stop and Remove Old Containers') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        echo 'Stopping and removing old containers...'
                        sh 'docker-compose down --volumes --remove-orphans || true'
                    }
                }
            }
        }

        stage('Build and Start New Containers') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        echo 'Building and starting new containers in detached mode...'
                        sh '''
                            docker-compose build --no-cache app
                            docker-compose up -d
                        '''
                    }
                }
            }
        }

        stage('Install and Verify Dependencies') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        echo 'Checking container status and installing npm dependencies...'
                        sh '''
                            docker-compose ps
                            docker-compose exec -T real-es_app npm ci
                            docker-compose exec -T real-es_app npm audit
                        '''
                    }
                }
            }
        }

        stage('Build Project') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        echo 'Building the project...'
                        sh '''
                            docker-compose exec -T real-es_app npm run build
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker system...'
            sh 'docker system prune -f || true'
        }

        success {
            echo 'Build completed successfully!'
        }

        failure {
            echo 'Build failed, please check the detailed logs for more information.'
            script {
                // Optional: Add more detailed logging or error investigation steps
                sh '''
                    docker-compose logs app
                '''
            }
        }
    }
}