pipeline {
    agent any

    environment {
        // The EC2 public URL where your app will be accessible
        APP_URL = "http://ec2-98-81-236-106.compute-1.amazonaws.com"
        FRONTEND_URL = "${APP_URL}:5173"
        // Docker image name for the test container
        TEST_IMAGE = "stp-selenium-tests"
        // Email of the collaborator who pushed (fetched dynamically)
        PUSHER_EMAIL = ""
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning repository from GitHub...'
                checkout scm
            }
        }

        stage('Get Pusher Email') {
            steps {
                script {
                    // Get the email of the person who pushed the commit
                    PUSHER_EMAIL = sh(
                        script: "git log -1 --format='%ae'",
                        returnStdout: true
                    ).trim()
                    echo "Push made by: ${PUSHER_EMAIL}"
                }
            }
        }

        stage('Build App') {
            steps {
                echo 'Building application with Docker Compose...'
                sh 'docker compose down --remove-orphans || true'
                sh 'docker compose build'
            }
        }

        stage('Deploy App') {
            steps {
                echo 'Starting application containers...'
                sh 'docker compose up -d'
                // Wait for the app to be fully up
                sh 'sleep 20'
                echo 'App deployed. Checking health...'
                sh "curl -f ${APP_URL}:8081/ || echo 'Backend not yet ready, continuing...'"
            }
        }

        stage('Build Test Image') {
            steps {
                echo 'Building Selenium test Docker image...'
                sh "docker build -f test-Dockerfile -t ${TEST_IMAGE} ."
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running Selenium test cases in container...'
                script {
                    // Run tests; capture output even if tests fail
                    def testResult = sh(
                        script: """
                            docker run --rm \
                                --network host \
                                -e BASE_URL=${FRONTEND_URL} \
                                ${TEST_IMAGE} \
                                python -m unittest test_app -v 2>&1 | tee test_output.txt
                        """,
                        returnStatus: true
                    )
                    // Store result for use in post section
                    env.TEST_EXIT_CODE = testResult.toString()
                    if (testResult != 0) {
                        echo "Some tests failed (exit code: ${testResult}). Will email results."
                        // Don't call error() here so we can still send email
                        currentBuild.result = 'UNSTABLE'
                    } else {
                        echo "All tests passed!"
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // Read test output
                def testOutput = ""
                try {
                    testOutput = readFile('test_output.txt')
                } catch (e) {
                    testOutput = "Could not read test output file."
                }

                def buildStatus = currentBuild.result ?: 'SUCCESS'
                def subject = "[Jenkins] ${buildStatus}: Selenium Tests - ${env.JOB_NAME} #${env.BUILD_NUMBER}"

                def body = """
Jenkins CI/CD Pipeline - Test Results
======================================
Job:          ${env.JOB_NAME}
Build #:      ${env.BUILD_NUMBER}
Status:       ${buildStatus}
Pushed by:    ${PUSHER_EMAIL}
Branch:       ${env.GIT_BRANCH ?: 'N/A'}
Commit:       ${env.GIT_COMMIT ?: 'N/A'}
Build URL:    ${env.BUILD_URL}

Test Output:
-----------
${testOutput}

--------------------------------------
This email was sent automatically by Jenkins.
                """.trim()

                // Send email to the pusher
                mail(
                    to: "${PUSHER_EMAIL}",
                    subject: subject,
                    body: body
                )

                echo "Test results emailed to: ${PUSHER_EMAIL}"
            }
        }

        success {
            echo 'Pipeline completed successfully.'
        }

        unstable {
            echo 'Pipeline completed with test failures.'
        }

        failure {
            echo 'Pipeline failed.'
        }
    }
}
