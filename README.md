# DevOps Service - GitHub Workflow & Cron Job Manager

A Next.js application that helps developers manage GitHub workflows and cron jobs through an intuitive web interface. This service provides a centralized platform for creating, managing, and monitoring GitHub Actions workflows and scheduled tasks.

## Features

### 1. GitHub Workflow Management
- Create and manage GitHub Actions workflows
- Monitor workflow runs and their status
- Configure CI/CD pipelines for different project types
- View workflow execution history

### 2. Cron Job Management
- Create scheduled tasks using GitHub Actions
- Manage cron job schedules and commands
- View and monitor cron job executions
- Delete or modify existing cron jobs

### 3. Repository Integration
- Connect with GitHub repositories
- Manage multiple repositories
- Configure workflows and cron jobs per repository
- View repository-specific workflow runs

### 4. Authentication & Security
- GitHub OAuth integration
- Secure session management
- Role-based access control
- Audit logging for all actions

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Authentication**: NextAuth.js
- **GitHub Integration**: Octokit
- **Database**: Supabase (for audit logging and configuration storage)
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- GitHub account
- GitHub OAuth App credentials

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd devops-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_string
   NODE_ENV=development
   ```

4. Set up GitHub OAuth App:
   - Go to GitHub Settings > Developer Settings > OAuth Apps
   - Create a new OAuth App
   - Set Homepage URL to `http://localhost:3000`
   - Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
   - Copy Client ID and generate Client Secret
   - Update `.env.local` with these values

5. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

### Managing Workflows

1. Navigate to the Workflows page
2. Select a repository
3. Choose a workflow template
4. Configure workflow parameters
5. Deploy the workflow

### Managing Cron Jobs

1. Go to the Cron Jobs page
2. Select a repository
3. Click "Create Cron Job"
4. Configure:
   - Job name
   - Schedule (cron expression)
   - Command to execute
5. Save the cron job

### Monitoring

- View workflow runs in real-time
- Check cron job execution history
- Monitor repository status
- View audit logs

## API Endpoints

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `DELETE /api/workflows` - Delete workflow

### Cron Jobs
- `GET /api/cron` - List cron jobs
- `POST /api/cron` - Create cron job
- `DELETE /api/cron` - Delete cron job

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- Next.js team for the amazing framework
- GitHub for the Actions platform
