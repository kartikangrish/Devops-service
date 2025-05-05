// Get the latest LTS Node.js version
const LATEST_NODE_VERSION = "20.x";

export interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  default?: string | number | boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  variables: WorkflowVariable[];
  content: string;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "nodejs-cicd",
    name: "Node.js CI/CD",
    description: "Build, test, and deploy Node.js applications",
    type: "CI/CD",
    variables: [
      {
        name: "nodeVersion",
        type: "string",
        description: "Node.js version to use",
        required: true,
        default: LATEST_NODE_VERSION
      },
      {
        name: "buildCommand",
        type: "string",
        description: "Command to build the application",
        required: true,
        default: "npm run build"
      },
      {
        name: "testCommand",
        type: "string",
        description: "Command to run tests",
        required: true,
        default: "npm test"
      },
      {
        name: "deployCommand",
        type: "string",
        description: "Command to deploy the application",
        required: true,
        default: "npm run deploy"
      }
    ],
    content: `name: Node.js CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [ '{{ variables.nodeVersion }}' ]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js {{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: {{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: {{ variables.buildCommand }}
    
    - name: Test
      run: {{ variables.testCommand }}
    
    - name: Deploy
      if: github.ref == 'refs/heads/main'
      run: {{ variables.deployCommand }}`
  },
  {
    id: "java-gradle",
    name: "Java/Gradle CI/CD",
    description: "Build, test, and deploy Java applications using Gradle",
    type: "Java",
    variables: [
      {
        name: "javaVersion",
        type: "string",
        description: "Java version to use",
        required: true,
        default: "17"
      },
      {
        name: "gradleVersion",
        type: "string",
        description: "Gradle version to use",
        required: true,
        default: "8.5"
      },
      {
        name: "runTests",
        type: "boolean",
        description: "Run tests before deployment",
        required: false,
        default: true
      },
      {
        name: "publishArtifacts",
        type: "boolean",
        description: "Publish artifacts to repository",
        required: false,
        default: false
      }
    ],
    content: `name: Java/Gradle CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up JDK {{ variables.javaVersion }}
      uses: actions/setup-java@v3
      with:
        java-version: {{ variables.javaVersion }}
        distribution: 'temurin'
        cache: gradle
    - name: Setup Gradle {{ variables.gradleVersion }}
      uses: gradle/gradle-build-action@v2
      with:
        gradle-version: {{ variables.gradleVersion }}
    {{ if variables.runTests }}
    - name: Run tests
      run: ./gradlew test
    {{ endif }}
    - name: Build with Gradle
      run: ./gradlew build
    {{ if variables.publishArtifacts }}
    - name: Publish artifacts
      run: ./gradlew publish
    {{ endif }}`
  },
  {
    id: "go",
    name: "Go CI/CD",
    description: "Build, test, and deploy Go applications",
    type: "Go",
    variables: [
      {
        name: "goVersion",
        type: "string",
        description: "Go version to use",
        required: true,
        default: "1.21"
      },
      {
        name: "runTests",
        type: "boolean",
        description: "Run tests before deployment",
        required: false,
        default: true
      },
      {
        name: "buildBinary",
        type: "boolean",
        description: "Build binary for deployment",
        required: false,
        default: true
      }
    ],
    content: `name: Go CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Go {{ variables.goVersion }}
      uses: actions/setup-go@v4
      with:
        go-version: {{ variables.goVersion }}
    {{ if variables.runTests }}
    - name: Run tests
      run: go test -v ./...
    {{ endif }}
    {{ if variables.buildBinary }}
    - name: Build binary
      run: go build -o app
    {{ endif }}`
  },
  {
    id: "postgres",
    name: "PostgreSQL CI/CD",
    description: "Database migrations and tests for PostgreSQL",
    type: "Database",
    variables: [
      {
        name: "postgresVersion",
        type: "string",
        description: "PostgreSQL version to use",
        required: true,
        default: "15"
      },
      {
        name: "runMigrations",
        type: "boolean",
        description: "Run database migrations",
        required: false,
        default: true
      },
      {
        name: "runTests",
        type: "boolean",
        description: "Run database tests",
        required: false,
        default: true
      }
    ],
    content: `name: PostgreSQL CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  database:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:{{ variables.postgresVersion }}
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
    - uses: actions/checkout@v3
    {{ if variables.runMigrations }}
    - name: Run migrations
      run: |
        npm install -g db-migrate
        db-migrate up
    {{ endif }}
    {{ if variables.runTests }}
    - name: Run database tests
      run: npm run test:db
    {{ endif }}`
  },
  {
    id: "monorepo",
    name: "Monorepo CI/CD",
    description: "Build and test multiple packages in a monorepo",
    type: "Monorepo",
    variables: [
      {
        name: "packageManager",
        type: "string",
        description: "Package manager to use",
        required: true,
        default: "npm"
      },
      {
        name: "useTurbo",
        type: "boolean",
        description: "Use Turborepo for builds",
        required: false,
        default: true
      },
      {
        name: "runTests",
        type: "boolean",
        description: "Run tests for all packages",
        required: false,
        default: true
      }
    ],
    content: `name: Monorepo CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    {{ if variables.useTurbo }}
    - name: Install Turbo
      run: {{ variables.packageManager }} install -g turbo
    - name: Build with Turbo
      run: turbo run build
    {{ if variables.runTests }}
    - name: Test with Turbo
      run: turbo run test
    {{ endif }}
    {{ else }}
    - name: Install dependencies
      run: {{ variables.packageManager }} install
    - name: Build packages
      run: {{ variables.packageManager }} run build
    {{ if variables.runTests }}
    - name: Run tests
      run: {{ variables.packageManager }} run test
    {{ endif }}
    {{ endif }}`
  }
]; 