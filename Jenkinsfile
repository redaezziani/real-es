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
                        echo 'Cleaning workspace and checking out the branch...'
                        sh '''
                            git reset --hard
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
                        echo 'Building and starting new containers in detached mode...'
                        sh 'docker-compose up --build -d'
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    dir(DOCKER_COMPOSE_DIR) {
                        echo 'Installing npm dependencies...'
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
                        echo 'Running tests inside the container...'
                        // Run tests inside the container
                        sh 'docker-compose exec real-es_app npm run test'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker system...'
            // Clean up unused Docker images, containers, volumes, etc.
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
