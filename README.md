# 🚀 TaskFlow - Multi-Organization Task Management System

A comprehensive, modern task management application built with Next.js 14, Prisma, and PostgreSQL. TaskFlow provides multi-organization and multi-workspace support with role-based access control, real-time time tracking, and advanced project management features.

## ✨ Features

### 🏢 **Multi-Organization & Multi-Workspace Support**
- **Organizations**: Create and manage multiple organizations
- **Workspaces**: Organize teams within organizations
- **Role-Based Access**: Super Admin, Admin, and User roles
- **Hierarchical Structure**: Organizations → Workspaces → Projects → Tasks

### 👥 **User Management**
- **Comprehensive User Management**: Add, edit, delete users
- **Role Assignment**: Assign roles and permissions
- **Organization Assignment**: Link users to organizations and workspaces
- **User Statistics**: Track user activity and contributions

### 📋 **Project & Task Management**
- **Project Creation**: Create projects within workspaces
- **Task Management**: Full CRUD operations for tasks
- **Kanban Board**: Visual task management with drag-and-drop
- **Task Assignment**: Assign tasks to team members
- **Status Tracking**: Track task progress with custom statuses

### ⏱️ **Time Tracking**
- **Real-Time Timer**: Start/stop/pause/resume timer functionality
- **Time Logging**: Manual time entry with descriptions
- **Time History**: View and manage time logs
- **Automatic Logging**: Timer sessions automatically create time logs
- **Time Analytics**: Track time spent across projects and tasks

### 🔍 **Advanced Search**
- **Global Search**: Search across tasks, projects, and users
- **Real-Time Results**: Instant search with debouncing
- **Keyboard Shortcuts**: ⌘K (Mac) or Ctrl+K (Windows) to open search
- **Recent Searches**: Save and reuse recent search queries
- **Role-Based Results**: See only relevant results based on permissions

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme switching with system preference detection
- **Component Library**: Built with Radix UI and Tailwind CSS
- **Accessibility**: WCAG compliant components
- **Toast Notifications**: User feedback for all actions

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Role-Based Access Control**: Granular permissions
- **Session Management**: Secure session handling
- **Activity Logging**: Audit trail for all actions

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Beautiful icons
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation
- **Date-fns**: Date manipulation

### **Backend**
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Relational database
- **JWT (jose)**: JSON Web Token handling
- **Bcryptjs**: Password hashing

### **Development Tools**
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Prisma Studio**: Database management

## 📁 Project Structure

```
taskflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main application pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── admin/             # Admin-specific components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Layout components
│   │   ├── organizations/     # Organization management
│   │   ├── projects/          # Project management
│   │   ├── search/            # Search functionality
│   │   ├── tasks/             # Task management
│   │   ├── timer/             # Time tracking
│   │   ├── ui/                # Reusable UI components
│   │   └── workspaces/        # Workspace management
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── services/              # Business logic services
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taskflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the following variables in `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/taskflow_db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-here"
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb taskflow_db
   
   # Run migrations
   npx prisma migrate dev
   
   # Generate Prisma client
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Credentials

After setup, you can use these default credentials:

- **Admin**: `admin@example.com` / `admin123`
- **Member**: `john@example.com` / `member123`
- **Member**: `jane@example.com` / `member123`

## 📊 Database Schema

### Core Models

#### **User**
- Authentication and profile information
- Role-based access control (ADMIN, MEMBER)
- Workspace assignments
- Workspace owners have ADMIN role

#### **Organization**
- Top-level organizational structure
- Contains multiple workspaces
- Managed by Super Admins

#### **Workspace**
- Team-level organization within organizations
- Contains projects and users
- Managed by Admins

#### **Project**
- Project-level organization within workspaces
- Contains tasks and team members
- Managed by project owners

#### **Task**
- Individual work items within projects
- Supports assignments, status tracking, and time logging
- Includes comments and sub-tasks

#### **Timer**
- Active timer sessions for time tracking
- Supports start/stop/pause/resume functionality
- Automatically creates time logs when stopped

#### **TimeLog**
- Historical time tracking data
- Manual and automatic time entries
- Linked to tasks and users

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Organizations
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/[id]` - Get organization
- `PUT /api/organizations/[id]` - Update organization
- `DELETE /api/organizations/[id]` - Delete organization

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/[id]` - Get workspace
- `PUT /api/workspaces/[id]` - Update workspace
- `DELETE /api/workspaces/[id]` - Delete workspace

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Time Tracking
- `GET /api/timer` - Get active timer
- `POST /api/timer` - Timer actions (start/stop/pause/resume)
- `GET /api/time-logs` - List time logs
- `POST /api/time-logs` - Create time log
- `PUT /api/time-logs/[id]` - Update time log
- `DELETE /api/time-logs/[id]` - Delete time log

### Search
- `GET /api/search` - Global search across tasks, projects, users

### User Management
- `GET /api/users` - List users (Super Admin only)
- `POST /api/users` - Create user (Super Admin only)
- `GET /api/users/[id]` - Get user (Super Admin only)
- `PUT /api/users/[id]` - Update user (Super Admin only)
- `DELETE /api/users/[id]` - Delete user (Super Admin only)

## 🎯 User Roles & Permissions

### **Super Admin**
- Full system access
- Manage all organizations and workspaces
- Create, edit, and delete users
- Assign roles and permissions
- Access to all projects and tasks

### **Admin**
- Manage their assigned organization
- Create and manage workspaces within their organization
- Assign users to workspaces
- Access to all projects within their organization

### **User**
- Access to assigned workspaces only
- Create and manage projects within assigned workspaces
- Create and manage tasks within accessible projects
- Time tracking and task assignment

## 🔍 Search Functionality

### Global Search Features
- **Real-time search** with 300ms debouncing
- **Keyboard shortcuts**: ⌘K (Mac) or Ctrl+K (Windows)
- **Recent searches** with localStorage persistence
- **Role-based results** showing only accessible content
- **Rich result display** with metadata and context

### Search Scope
- **Tasks**: Search by title, description, labels
- **Projects**: Search by title, description, project name
- **Users**: Search by name, email (admin only)

## ⏱️ Time Tracking System

### Timer Features
- **Real-time display** in HH:MM:SS format
- **Start/Stop/Pause/Resume** functionality
- **Description support** for work notes
- **Automatic time logging** when stopped
- **State persistence** across page refreshes
- **One timer rule** per user

### Time Log Management
- **Manual entry** with custom dates
- **Edit/Delete** existing time entries
- **User attribution** and project context
- **Total time calculations** and summaries
- **Date-based organization**

## 🎨 UI Components

### Design System
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Consistent iconography
- **Responsive design**: Mobile-first approach
- **Dark/Light mode**: System preference detection

### Key Components
- **Dashboard Layout**: Main application shell
- **Navigation**: Sidebar and navbar with role-based menus
- **Data Tables**: Sortable, filterable data display
- **Forms**: Validated forms with error handling
- **Modals**: Accessible dialog components
- **Toast Notifications**: User feedback system

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build image
docker build -t taskflow .

# Run container
docker run -p 3000:3000 taskflow
```

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Set up reverse proxy (nginx/Apache)
4. Configure SSL certificate

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing

## 📈 Performance

### Optimization Features
- **Next.js 14**: Latest performance optimizations
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Static Generation**: Pre-rendered pages where possible
- **Database Indexing**: Optimized database queries

### Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Core Web Vitals tracking

## 🔧 Development

### Code Style
- **ESLint**: Code linting with Next.js rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Conventional Commits**: Standardized commit messages

### Git Workflow
1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Create pull request with detailed description
4. Code review and testing
5. Merge to `main` after approval

### Database Management
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Generate client
npx prisma generate
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [API Documentation](docs/api.md) - Complete API reference
- [Component Library](docs/components.md) - UI component documentation

### Getting Help
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Ask questions and share ideas
- **Email**: Contact the development team

### Common Issues

#### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists and is accessible

#### Authentication Issues
- Verify JWT_SECRET is set
- Check user credentials
- Clear browser cookies and localStorage

#### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`
- Check Node.js version compatibility

## 🎉 Acknowledgments

- **Next.js Team** for the amazing framework
- **Prisma Team** for the excellent ORM
- **Radix UI Team** for accessible components
- **Tailwind CSS Team** for the utility-first CSS framework
- **Vercel** for hosting and deployment platform

---

**Built with ❤️ using Next.js, Prisma, and modern web technologies.**
