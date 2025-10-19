# 📚 School Management Platform - Complete Project Documentation

## 🎯 Project Overview

**School Management Platform** is a comprehensive educational management system designed for schools to manage students, teachers, classes, activities, and teaching sessions. The platform provides role-based access control with three main user types: SuperAdmin, School Administrators, and Teachers.

---

## 🏗️ Project Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│                  (React + TypeScript)                    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST API
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Nginx Reverse Proxy                    │
│              (Port 80 - Docker Container)                │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │                           │
         ▼                           ▼
┌────────────────┐          ┌────────────────┐
│   Frontend     │          │    Backend     │
│   (React)      │          │ (Spring Boot)  │
│   Port 80      │          │   Port 8080    │
└────────────────┘          └────────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                                  │
                    ▼                                  ▼
           ┌────────────────┐              ┌──────────────────┐
           │   PostgreSQL   │              │   MinIO Storage  │
           │   Port 5432    │              │   Port 9000/9001 │
           └────────────────┘              └──────────────────┘
```

---

## 📦 Technology Stack

### Backend
- **Framework**: Spring Boot 3.3.5
- **Language**: Java 17
- **Build Tool**: Maven
- **Database**: PostgreSQL 15
- **File Storage**: MinIO (S3-compatible object storage)
- **Security**: JWT Authentication
- **ORM**: Spring Data JPA with Hibernate
- **Validation**: Jakarta Bean Validation

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS 3.4.1
- **State Management**: TanStack Query (React Query) 5.56.2
- **Routing**: React Router DOM 6.26.2
- **HTTP Client**: Axios
- **Icons**: Lucide React

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (Alpine)
- **Database Container**: PostgreSQL 15
- **Storage Container**: MinIO
- **Package Manager (Frontend)**: npm

---

## 🗂️ Project Structure

### Root Directory
```
insight-bloom-ed-06780-42905-49682-99516/
├── .github/                    # GitHub configuration
│   └── copilot-instructions.md # AI assistant instructions
├── backend/                    # Spring Boot backend application
├── frontend/                   # React frontend application
├── docker/                     # Docker initialization scripts
├── migrations/                 # Database migration scripts
├── supabase/                   # Supabase configuration & migrations
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Docker services orchestration
├── setup-superadmin.sql        # SuperAdmin account setup script
├── setup.ps1                   # Windows setup script
└── setup.sh                    # Unix/Linux setup script
```

---

## 🔧 Backend Structure (Spring Boot)

### Directory Layout
```
backend/
├── src/
│   └── main/
│       ├── java/com/schoolmanagement/
│       │   ├── SchoolManagementApplication.java   # Main application entry point
│       │   ├── config/                            # Configuration classes
│       │   │   ├── CorsConfig.java               # CORS configuration
│       │   │   ├── DataInitializer.java          # Database initialization
│       │   │   ├── JwtAuthenticationFilter.java  # JWT filter
│       │   │   ├── MinioConfig.java              # MinIO storage config
│       │   │   ├── MinioLifecycleConfig.java     # MinIO lifecycle policies
│       │   │   └── SecurityConfig.java           # Spring Security config
│       │   ├── controller/                        # REST API endpoints
│       │   │   ├── ActivityController.java       # Activity management
│       │   │   ├── ActivityFileController.java   # File upload/download
│       │   │   ├── AuthController.java           # Authentication
│       │   │   ├── ClassController.java          # Class management
│       │   │   ├── ProfileController.java        # User profile management
│       │   │   ├── SchoolController.java         # School management
│       │   │   ├── SessionController.java        # Teaching session management
│       │   │   ├── StudentController.java        # Student management
│       │   │   └── TeacherController.java        # Teacher management
│       │   ├── dto/                               # Data Transfer Objects
│       │   │   ├── ActivityDTO.java
│       │   │   ├── AuthRequest.java
│       │   │   ├── AuthResponse.java
│       │   │   └── ... (other DTOs)
│       │   ├── entity/                            # JPA Entities (Database Models)
│       │   │   ├── Activity.java                 # Activity entity
│       │   │   ├── ActivityFile.java             # Activity file metadata
│       │   │   ├── Class.java                    # Class entity
│       │   │   ├── Profile.java                  # User profile entity
│       │   │   ├── School.java                   # School entity
│       │   │   ├── Student.java                  # Student entity
│       │   │   ├── Teacher.java                  # Teacher entity
│       │   │   └── TeachingSession.java          # Teaching session entity
│       │   ├── exception/                         # Exception handling
│       │   │   ├── GlobalExceptionHandler.java   # Global error handler
│       │   │   └── ResourceNotFoundException.java
│       │   ├── model/                             # Domain models
│       │   ├── repository/                        # Spring Data JPA Repositories
│       │   │   ├── ActivityFileRepository.java
│       │   │   ├── ActivityRepository.java
│       │   │   ├── ClassRepository.java
│       │   │   ├── ProfileRepository.java
│       │   │   ├── SchoolRepository.java
│       │   │   ├── StudentRepository.java
│       │   │   ├── TeacherRepository.java
│       │   │   └── TeachingSessionRepository.java
│       │   ├── security/                          # Security utilities
│       │   │   └── JwtUtil.java                  # JWT token utilities
│       │   ├── service/                           # Business logic layer
│       │   │   ├── ActivityFileService.java      # File management service
│       │   │   ├── ActivityService.java          # Activity business logic
│       │   │   ├── AuthService.java              # Authentication service
│       │   │   ├── ClassService.java             # Class management service
│       │   │   ├── ProfileService.java           # Profile service
│       │   │   ├── SchoolService.java            # School service
│       │   │   ├── SessionService.java           # Session service
│       │   │   ├── StudentService.java           # Student service
│       │   │   └── TeacherService.java           # Teacher service
│       │   └── util/                              # Utility classes
│       └── resources/
│           ├── application.properties             # Application configuration
│           └── application-docker.properties      # Docker-specific config
├── Dockerfile                                     # Backend Docker image
└── pom.xml                                        # Maven dependencies
```

### Key Backend Components

#### 1. **Controllers** (`controller/`)
REST API endpoints that handle HTTP requests and responses. Each controller manages a specific domain:
- **AuthController**: Login, registration, token management
- **SchoolController**: CRUD operations for schools
- **ActivityController**: Activity management (create, read, update, delete)
- **ActivityFileController**: File upload/download with MinIO
- **ClassController**: Class management
- **StudentController**: Student CRUD operations
- **TeacherController**: Teacher management
- **SessionController**: Teaching session tracking

#### 2. **Entities** (`entity/`)
JPA entities representing database tables:
- **Profile**: User accounts (SuperAdmin, School Admin, Teacher)
- **School**: School information
- **Activity**: Educational activities/lessons
- **ActivityFile**: File metadata for activity attachments
- **Class**: Class/grade information
- **Student**: Student details
- **Teacher**: Teacher information
- **TeachingSession**: Session records linking teachers, classes, and activities

#### 3. **Services** (`service/`)
Business logic layer:
- **ActivityFileService**: Handles file uploads to MinIO, generates signed URLs, manages file lifecycle
- **AuthService**: User authentication, JWT generation, password hashing
- **SchoolService**: School management logic
- **ActivityService**: Activity CRUD with layout data handling
- **ClassService**: Class management
- **StudentService**: Student operations
- **TeacherService**: Teacher management
- **SessionService**: Teaching session tracking

#### 4. **Security** (`config/`, `security/`)
- **SecurityConfig**: Spring Security configuration with JWT
- **JwtAuthenticationFilter**: Validates JWT tokens on each request
- **JwtUtil**: Token generation and validation utilities
- **CorsConfig**: Cross-Origin Resource Sharing configuration

#### 5. **Storage** (`config/MinioConfig.java`, `service/ActivityFileService.java`)
- **MinIO Integration**: S3-compatible object storage for files
- **Lifecycle Management**: Automatic deletion of old files (7-day TTL)
- **File Types Supported**: Images, PDFs, Videos

---

## 🎨 Frontend Structure (React)

### Directory Layout
```
frontend/
├── public/                        # Static assets
│   └── robots.txt
├── src/
│   ├── components/                # Reusable UI components
│   │   ├── activity/              # Activity-related components
│   │   │   ├── ActivityBuilder.tsx      # Activity creation/editing
│   │   │   ├── ActivityCard.tsx         # Activity list item
│   │   │   ├── ActivityList.tsx         # Activity list view
│   │   │   ├── ActivityViewer.tsx       # Activity display (manual layout)
│   │   │   ├── AutoActivityViewer.tsx   # Activity display (auto layout)
│   │   │   ├── FullscreenViewer.tsx     # Fullscreen media viewer
│   │   │   ├── PDFViewer.tsx            # PDF renderer
│   │   │   └── VideoViewer.tsx          # Video player
│   │   ├── auth/                  # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── layout/                # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── school/                # School management components
│   │   │   ├── SchoolCard.tsx
│   │   │   ├── SchoolForm.tsx
│   │   │   └── SchoolList.tsx
│   │   ├── student/               # Student components
│   │   │   ├── StudentForm.tsx
│   │   │   └── StudentList.tsx
│   │   ├── teacher/               # Teacher components
│   │   │   ├── TeacherForm.tsx
│   │   │   └── TeacherList.tsx
│   │   └── ui/                    # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── toast.tsx
│   │       └── ... (other UI components)
│   ├── config/                    # Configuration files
│   │   └── supabase.ts           # Supabase client config
│   ├── data/                      # Static data/constants
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-toast.ts          # Toast notification hook
│   │   └── use-mobile.tsx        # Mobile detection hook
│   ├── integrations/              # External integrations
│   │   └── supabase/             # Supabase React Query hooks
│   ├── lib/                       # Utility libraries
│   │   ├── api.ts                # API client (Axios)
│   │   ├── uploadToStorage.ts    # File upload utilities
│   │   └── utils.ts              # General utilities
│   ├── pages/                     # Page components (Routes)
│   │   ├── Index.tsx             # Landing page
│   │   ├── Login.tsx             # Login page
│   │   ├── Register.tsx          # Registration page
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   ├── Schools.tsx           # Schools management page
│   │   ├── SchoolDetail.tsx      # School detail page
│   │   ├── Students.tsx          # Students page
│   │   ├── Teachers.tsx          # Teachers page
│   │   ├── Classes.tsx           # Classes page
│   │   ├── Activities.tsx        # Activities page
│   │   ├── ActivityView.tsx      # Activity view page
│   │   ├── CreateActivity.tsx    # Activity creation page
│   │   └── Sessions.tsx          # Teaching sessions page
│   ├── types/                     # TypeScript type definitions
│   │   ├── activity.ts           # Activity types
│   │   ├── school.ts             # School types
│   │   ├── student.ts            # Student types
│   │   ├── teacher.ts            # Teacher types
│   │   └── auth.ts               # Auth types
│   ├── App.tsx                    # Main App component
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── Dockerfile                     # Frontend Docker image
├── nginx.conf                     # Nginx configuration
├── package.json                   # npm dependencies
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite build configuration
```

### Key Frontend Components

#### 1. **Pages** (`pages/`)
Top-level route components:
- **Index.tsx**: Landing page with navigation to login/register
- **Dashboard.tsx**: Main dashboard after login (shows statistics)
- **Schools.tsx**: SuperAdmin view to manage all schools
- **SchoolDetail.tsx**: Detailed view of a specific school with tabs for students, teachers, classes, activities
- **Activities.tsx**: List of all activities
- **CreateActivity.tsx**: Activity builder interface
- **ActivityView.tsx**: View and interact with an activity

#### 2. **Activity Components** (`components/activity/`)
- **ActivityBuilder.tsx**: Drag-and-drop activity creator with file upload support
- **AutoActivityViewer.tsx**: Smart activity renderer that auto-detects content type (PDF-only, video-only, images-only, or mixed)
- **PDFViewer.tsx**: PDF.js integration for PDF rendering
- **VideoViewer.tsx**: HTML5 video player with controls
- **FullscreenViewer.tsx**: Modal for fullscreen media viewing

#### 3. **API Layer** (`lib/api.ts`)
Centralized API client using Axios:
- **schoolApi**: School CRUD operations
- **activityApi**: Activity management
- **studentApi**: Student operations
- **teacherApi**: Teacher management
- **authApi**: Authentication endpoints
- **storageApi**: File upload/download

#### 4. **File Upload** (`lib/uploadToStorage.ts`)
Handles file uploads to backend:
- **uploadActivityFile()**: Upload files for activities
- **uploadSchoolLogo()**: Upload school logos
- **getPublicUrl()**: Get signed URLs for files
- **deleteActivityFile()**: Delete files from storage

#### 5. **Type Definitions** (`types/`)
TypeScript interfaces for type safety:
- **Activity**: Activity structure with layout data
- **ActivityElement**: Individual elements (text, image, PDF, video)
- **School**: School entity
- **Student, Teacher, Class**: Entity types
- **User, AuthResponse**: Authentication types

---

## 🔐 Authentication Flow

### JWT-Based Authentication

```
┌─────────┐                     ┌─────────┐                    ┌──────────┐
│ Client  │                     │ Backend │                    │ Database │
└────┬────┘                     └────┬────┘                    └────┬─────┘
     │                               │                              │
     │  POST /api/auth/login         │                              │
     │  {email, password}            │                              │
     ├──────────────────────────────>│                              │
     │                               │                              │
     │                               │  Query user by email         │
     │                               ├─────────────────────────────>│
     │                               │                              │
     │                               │  User data                   │
     │                               │<─────────────────────────────┤
     │                               │                              │
     │                               │ Verify password              │
     │                               │ Generate JWT token           │
     │                               │                              │
     │  200 OK                       │                              │
     │  {token, user}                │                              │
     │<──────────────────────────────┤                              │
     │                               │                              │
     │  Store token in localStorage  │                              │
     │                               │                              │
     │  GET /api/schools             │                              │
     │  Authorization: Bearer <token>│                              │
     ├──────────────────────────────>│                              │
     │                               │                              │
     │                               │ Validate JWT                 │
     │                               │ Extract user info            │
     │                               │                              │
     │                               │  Query schools               │
     │                               ├─────────────────────────────>│
     │                               │                              │
     │  200 OK {schools}             │                              │
     │<──────────────────────────────┤                              │
```

### User Roles
1. **SuperAdmin**: 
   - Manages all schools
   - Creates/edits/deletes schools
   - Views all activities across all schools
   
2. **School Administrator**:
   - Manages their school's data
   - Manages students, teachers, classes
   - Creates activities for their school
   
3. **Teacher**:
   - Views activities
   - Records teaching sessions
   - Tracks student progress

---

## 💾 File Storage Flow (MinIO)

### Upload Flow
```
1. User selects files in ActivityBuilder
2. Files stored temporarily in pendingFiles Map with preview URLs
3. On Save:
   a. Activity saved to database (without file URLs)
   b. Files uploaded to MinIO via POST /api/activity-files/upload/{activityId}
   c. Backend stores files in MinIO bucket: school-management/activity-files/
   d. File metadata saved to activity_files table
   e. Activity updated with file URLs: /api/activity-files/download/{fileId}
4. Frontend displays files using download endpoint
```

### Download Flow
```
1. Frontend requests file: GET /api/activity-files/download/{fileId}
2. Backend:
   a. Retrieves file metadata from database
   b. Fetches file from MinIO using minioKey
   c. Streams file to client with appropriate Content-Type
3. Browser displays/downloads file
```

### File Lifecycle
- Files stored in MinIO have a 7-day TTL (Time To Live)
- Lifecycle policy automatically deletes old files
- Prevents storage bloat

---

## 🐳 Docker Services

### Service Configuration
```yaml
services:
  db:              # PostgreSQL database
  minio:           # MinIO object storage
  backend:         # Spring Boot API
  frontend:        # React app with Nginx
```

### Networks
- **app-network**: Bridge network connecting all services

### Volumes
- **postgres_data**: Persistent database storage
- **minio_data**: Persistent file storage

### Health Checks
- **Database**: pg_isready check
- **MinIO**: mc ready check
- **Backend**: HTTP check on /actuator/health
- **Frontend**: HTTP check on port 80

---

## 🚀 Getting Started

### Prerequisites
- Docker Desktop installed
- Git installed
- Ports 80, 8080, 5432, 9000, 9001 available

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd insight-bloom-ed-06780-42905-49682-99516

# Start all services
docker-compose up -d

# Wait for services to be healthy (~30 seconds)

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8080
# MinIO Console: http://localhost:9001
```

### Default SuperAdmin Credentials
```
Email: admin@superadmin.com
Password: SuperAdmin@2024
```

---

## 📊 Data Flow Examples

### Creating an Activity with Files

```
1. User opens CreateActivity page
2. Fills in title, description, type, level
3. Clicks "Add Image" button
4. Selects image file from computer
5. File added to pendingFiles Map
   - elementId: unique ID
   - file: File object
   - preview: blob URL for preview
6. User clicks "Save Activity"
7. Frontend:
   - POST /api/activities (creates activity)
   - Receives activityId
   - POST /api/activity-files/upload/{activityId} with FormData
8. Backend:
   - Uploads file to MinIO
   - Saves metadata to activity_files table
   - Returns file info with download URL
9. Frontend:
   - Updates activity elements with real URLs
   - PUT /api/activities/{activityId} (updates layout_data)
10. Activity saved successfully
```

### Viewing an Activity

```
1. User navigates to /activity/{activityId}
2. Frontend:
   - GET /api/activities/{activityId}
   - Receives activity with layout_data JSON
   - Parses elements array
3. AutoActivityViewer component:
   - Detects content types in elements
   - If only PDFs: renders PDF layout
   - If only images: renders image gallery
   - If mixed: renders auto grid layout
4. For each image/PDF/video element:
   - Renders <img>, <PDFViewer>, or <VideoViewer>
   - src points to: /api/activity-files/download/{fileId}
5. Browser requests file
6. Backend:
   - Validates fileId
   - Fetches from MinIO
   - Streams to browser
7. File displayed in browser
```

---

## 🔧 Configuration

### Environment Variables
```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=schoolmanagement

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=school-management

# Backend
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

# Spring profiles
SPRING_PROFILES_ACTIVE=docker
```

### Backend Configuration (`application.properties`)
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/schoolmanagement
spring.jpa.hibernate.ddl-auto=update

# MinIO
minio.endpoint=http://localhost:9000
minio.access-key=minioadmin
minio.secret-key=minioadmin
minio.bucket-name=school-management

# JWT
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION}

# File upload
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] SuperAdmin can login
- [ ] Invalid credentials rejected
- [ ] JWT token stored in localStorage
- [ ] Protected routes redirect to login

#### School Management
- [ ] SuperAdmin can create school
- [ ] SuperAdmin can edit school
- [ ] SuperAdmin can delete school
- [ ] School list displays correctly

#### Activity Management
- [ ] Create activity with title/description
- [ ] Upload image file
- [ ] Upload PDF file
- [ ] Upload video file
- [ ] Activity saves successfully
- [ ] Activity displays in list
- [ ] Click activity opens detail view
- [ ] Files display correctly
- [ ] PDF renders properly
- [ ] Video plays correctly

#### File Storage
- [ ] Files uploaded to MinIO
- [ ] Files downloadable via API
- [ ] File metadata saved to database
- [ ] Old files cleaned up after 7 days

---

## 🐛 Common Issues & Solutions

### Issue: Files not displaying
**Symptom**: Activity created but images/PDFs don't show
**Solution**: 
- Check browser console for 404 errors
- Verify MinIO container is running
- Check activity_files table has records
- Verify layout_data has correct download URLs

### Issue: "CORS error" in console
**Symptom**: API calls blocked by CORS policy
**Solution**:
- Check CorsConfig.java allows frontend origin
- Verify docker-compose network configuration
- Restart backend container

### Issue: Database connection failed
**Symptom**: Backend fails to start with connection error
**Solution**:
- Verify PostgreSQL container is running
- Check POSTGRES_* environment variables
- Ensure database created: `schoolmanagement`
- Check logs: `docker-compose logs db`

---

## 📈 Future Enhancements

1. **Real-time Collaboration**: WebSocket support for live activity editing
2. **Advanced Analytics**: Student progress tracking dashboards
3. **Mobile App**: React Native mobile application
4. **Export/Import**: Bulk data import/export (CSV, Excel)
5. **Notification System**: Email/push notifications for assignments
6. **Calendar Integration**: Google Calendar sync for sessions
7. **Grade Management**: Automated grading system
8. **Parent Portal**: Parent access to student progress
9. **Multi-language Support**: i18n internationalization
10. **Advanced Search**: Elasticsearch integration

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Contributors

Developed by the School Management Platform Team.

---

## 📞 Support

For support, email: support@schoolmanagement.com

---

**Last Updated**: October 19, 2025
