# 🗄️ Database Documentation - School Management Platform

## 📊 Database Overview

### Database Management System
- **DBMS**: PostgreSQL 15
- **Database Name**: `schoolmanagement`
- **Port**: 5432 (internal Docker network)
- **Character Set**: UTF-8
- **Timezone**: UTC

### Connection Details
```
Host: localhost (or school-management-db in Docker)
Port: 5432
Database: schoolmanagement
Username: postgres
Password: postgres
```

---

## 🏗️ Database Schema

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│    profiles     │
│  (User Accounts)│
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────┐         ┌─────────────────┐
│    schools      │ 1     N │   activities    │
│                 ◄─────────┤                 │
└────────┬────────┘         └────────┬────────┘
         │ 1                         │ 1
         │                           │
         │ N                         │ N
┌────────▼────────┐         ┌────────▼────────┐
│    teachers     │         │ activity_files  │
│                 │         │                 │
└────────┬────────┘         └─────────────────┘
         │ 1
         │
         │ N
┌────────▼────────┐
│teaching_sessions│
│                 │
└────────┬────────┘
         │ N
         │
         │ 1
┌────────▼────────┐         ┌─────────────────┐
│    classes      │ 1     N │    students     │
│                 ◄─────────┤                 │
└─────────────────┘         └─────────────────┘
```

---

## 📋 Table Definitions

### 1. **profiles** - User Accounts Table

Stores all user accounts (SuperAdmin, School Administrators, Teachers).

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
```

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email (login username) |
| `password_hash` | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| `full_name` | VARCHAR(255) | NOT NULL | User's full name |
| `school_id` | INTEGER | FOREIGN KEY | Associated school (NULL for SuperAdmin) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Relationships
- **school_id** → `schools.id` (Many-to-One)

#### Special Accounts
- **SuperAdmin**: `school_id = NULL`, email: `admin@superadmin.com`
- **School Admin**: `school_id = <school_id>`
- **Teacher**: `school_id = <school_id>`

#### Sample Data
```sql
-- SuperAdmin account
INSERT INTO profiles (id, email, password_hash, full_name, school_id)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin@superadmin.com',
    '$2a$10$encrypted_password_hash',
    'Super Administrator',
    NULL
);
```

---

### 2. **schools** - Schools Table

Stores information about educational institutions.

```sql
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schools_name ON schools(name);
```

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment school ID |
| `name` | VARCHAR(255) | NOT NULL | School name |
| `address` | TEXT | | School physical address |
| `phone` | VARCHAR(50) | | Contact phone number |
| `email` | VARCHAR(255) | | School email address |
| `logo_url` | TEXT | | URL to school logo (MinIO) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Relationships
- **One-to-Many** with `profiles` (school staff)
- **One-to-Many** with `teachers`
- **One-to-Many** with `students`
- **One-to-Many** with `classes`
- **One-to-Many** with `activities`

#### Sample Data
```sql
INSERT INTO schools (name, address, phone, email, logo_url)
VALUES (
    'Springfield Elementary',
    '123 Education St, Springfield',
    '555-0100',
    'info@springfield-elem.edu',
    'http://localhost:8080/api/storage/school-logos/logo-123.png'
);
```

---

### 3. **teachers** - Teachers Table

Stores teacher information.

```sql
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(255),
    phone VARCHAR(50),
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_school_id ON teachers(school_id);
CREATE INDEX idx_teachers_email ON teachers(email);
```

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment teacher ID |
| `full_name` | VARCHAR(255) | NOT NULL | Teacher's full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Teacher email |
| `subject` | VARCHAR(255) | | Primary subject taught |
| `phone` | VARCHAR(50) | | Contact phone |
| `school_id` | INTEGER | FK, NOT NULL | Associated school |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

#### Relationships
- **school_id** → `schools.id` (Many-to-One)
- **One-to-Many** with `teaching_sessions`

#### Cascade Behavior
- **ON DELETE CASCADE**: Deleting a school removes all associated teachers

---

### 4. **students** - Students Table

Stores student information.

```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(50),
    parent_email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_full_name ON students(full_name);
```

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment student ID |
| `full_name` | VARCHAR(255) | NOT NULL | Student's full name |
| `date_of_birth` | DATE | | Birth date |
| `gender` | VARCHAR(20) | | Gender (Male, Female, Other) |
| `class_id` | INTEGER | FK, NULLABLE | Current class assignment |
| `school_id` | INTEGER | FK, NOT NULL | School enrollment |
| `parent_name` | VARCHAR(255) | | Parent/Guardian name |
| `parent_phone` | VARCHAR(50) | | Parent contact phone |
| `parent_email` | VARCHAR(255) | | Parent email |
| `address` | TEXT | | Student address |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

#### Relationships
- **school_id** → `schools.id` (Many-to-One)
- **class_id** → `classes.id` (Many-to-One, Optional)

#### Cascade Behavior
- **ON DELETE CASCADE** (school): Deleting school removes students
- **ON DELETE SET NULL** (class): Deleting class keeps students (class_id = NULL)

---

### 5. **classes** - Classes/Grades Table

Stores class/grade information.

```sql
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(100),
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_classes_name ON classes(name);
```

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment class ID |
| `name` | VARCHAR(255) | NOT NULL | Class name (e.g., "Grade 5A") |
| `level` | VARCHAR(100) | | Education level (Primary, Middle, High) |
| `school_id` | INTEGER | FK, NOT NULL | Associated school |
| `academic_year` | VARCHAR(20) | | Academic year (e.g., "2024-2025") |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

#### Relationships
- **school_id** → `schools.id` (Many-to-One)
- **One-to-Many** with `students`
- **One-to-Many** with `teaching_sessions`

---

### 6. **activities** - Educational Activities Table

Stores educational activities, lessons, and course materials.

```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(100),
    layout_data TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_school_id ON activities(school_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_level ON activities(level);
CREATE INDEX idx_activities_created_by ON activities(created_by);
```

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique activity identifier |
| `school_id` | INTEGER | FK, NOT NULL | School that owns activity |
| `type` | VARCHAR(100) | NOT NULL | Activity type (Cours, Exercice, Evaluation) |
| `title` | VARCHAR(255) | NOT NULL | Activity title |
| `description` | TEXT | | Detailed description |
| `level` | VARCHAR(100) | | Education level (Primaire, Collège, Lycée) |
| `layout_data` | TEXT | | JSON string with activity elements |
| `is_published` | BOOLEAN | DEFAULT FALSE | Publication status |
| `created_by` | UUID | FK, NULLABLE | User who created activity |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Relationships
- **school_id** → `schools.id` (Many-to-One)
- **created_by** → `profiles.id` (Many-to-One)
- **One-to-Many** with `activity_files`
- **One-to-Many** with `teaching_sessions`

#### Layout Data Structure (JSON)
```json
{
  "elements": [
    {
      "id": "element-123456789",
      "type": "image",
      "content": "http://localhost:8080/api/activity-files/download/uuid",
      "position": {"x": 50, "y": 50},
      "size": {"width": 400, "height": 300},
      "style": {
        "fontSize": "16px",
        "color": "hsl(var(--foreground))",
        "backgroundColor": "transparent",
        "padding": "8px"
      },
      "fileId": "file-uuid",
      "fileName": "image.jpg"
    },
    {
      "id": "element-987654321",
      "type": "text",
      "content": "This is the lesson content...",
      "position": {"x": 50, "y": 400},
      "size": {"width": 600, "height": 200},
      "style": {
        "fontSize": "18px",
        "color": "hsl(var(--foreground))",
        "backgroundColor": "transparent",
        "padding": "12px"
      }
    }
  ]
}
```

#### Element Types
- **text**: Text content
- **image**: Image file (JPG, PNG, GIF, SVG)
- **pdf**: PDF document
- **video**: Video file (MP4, AVI, MOV, WEBM)

---

### 7. **activity_files** - Activity File Metadata Table

Stores metadata for files attached to activities (stored in MinIO).

```sql
CREATE TABLE activity_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    minio_key VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    file_type VARCHAR(50),
    element_id VARCHAR(100),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_files_activity_id ON activity_files(activity_id);
CREATE INDEX idx_activity_files_element_id ON activity_files(element_id);
```

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique file identifier |
| `activity_id` | UUID | FK, NOT NULL | Associated activity |
| `file_name` | VARCHAR(255) | NOT NULL | Original filename |
| `minio_key` | VARCHAR(500) | NOT NULL | MinIO storage path |
| `file_size` | BIGINT | NOT NULL | File size in bytes |
| `mime_type` | VARCHAR(100) | | MIME type (image/jpeg, application/pdf) |
| `file_type` | VARCHAR(50) | | File category (image, pdf, video, other) |
| `element_id` | VARCHAR(100) | | Element ID in layout_data |
| `position` | INTEGER | DEFAULT 0 | Display order |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

#### Relationships
- **activity_id** → `activities.id` (Many-to-One)

#### MinIO Storage Path Format
```
activity-files/{uuid}.{extension}

Example:
activity-files/1558345a-3345-4c6d-89c3-41d5add936d9.jpeg
```

#### File Lifecycle
- **TTL**: 7 days (configured in MinIO lifecycle policy)
- **Auto-deletion**: Old files automatically deleted by MinIO
- **Orphan cleanup**: Database records remain (for audit trail)

---

### 8. **teaching_sessions** - Teaching Session Records

Tracks teaching sessions where teachers use activities with classes.

```sql
CREATE TABLE teaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    session_date DATE NOT NULL,
    percentage_acquired INTEGER CHECK (percentage_acquired BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_school_id ON teaching_sessions(school_id);
CREATE INDEX idx_sessions_teacher_id ON teaching_sessions(teacher_id);
CREATE INDEX idx_sessions_class_id ON teaching_sessions(class_id);
CREATE INDEX idx_sessions_activity_id ON teaching_sessions(activity_id);
CREATE INDEX idx_sessions_date ON teaching_sessions(session_date);
```

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique session identifier |
| `school_id` | INTEGER | FK, NOT NULL | School where session occurred |
| `teacher_id` | INTEGER | FK, NOT NULL | Teacher who conducted session |
| `class_id` | INTEGER | FK, NOT NULL | Class that attended |
| `activity_id` | UUID | FK, NULLABLE | Activity used (optional) |
| `subject` | VARCHAR(255) | | Subject taught |
| `session_date` | DATE | NOT NULL | Date of session |
| `percentage_acquired` | INTEGER | CHECK 0-100 | Student comprehension percentage |
| `notes` | TEXT | | Session notes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

#### Relationships
- **school_id** → `schools.id` (Many-to-One)
- **teacher_id** → `teachers.id` (Many-to-One)
- **class_id** → `classes.id` (Many-to-One)
- **activity_id** → `activities.id` (Many-to-One, Optional)

#### Cascade Behavior
- **ON DELETE CASCADE**: School, teacher, or class deletion removes sessions
- **ON DELETE SET NULL**: Activity deletion keeps session (activity_id = NULL)

---

## 🔄 Database Triggers & Functions

### Update Timestamp Trigger

Automatically updates `updated_at` column on row modification.

```sql
-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_timestamp
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ... (repeat for other tables)
```

---

## 📊 Database Indexes

### Purpose
Indexes improve query performance for frequently accessed columns.

### Index Strategy
1. **Primary Keys**: Automatically indexed
2. **Foreign Keys**: Indexed for JOIN performance
3. **Lookup Columns**: Email, name fields
4. **Date Fields**: For date range queries

### Index List
```sql
-- profiles
idx_profiles_email
idx_profiles_school_id

-- schools
idx_schools_name

-- teachers
idx_teachers_school_id
idx_teachers_email

-- students
idx_students_school_id
idx_students_class_id
idx_students_full_name

-- classes
idx_classes_school_id
idx_classes_name

-- activities
idx_activities_school_id
idx_activities_type
idx_activities_level
idx_activities_created_by

-- activity_files
idx_activity_files_activity_id
idx_activity_files_element_id

-- teaching_sessions
idx_sessions_school_id
idx_sessions_teacher_id
idx_sessions_class_id
idx_sessions_activity_id
idx_sessions_date
```

---

## 🔐 Data Integrity Constraints

### Primary Key Constraints
All tables have primary keys ensuring unique row identification.

### Foreign Key Constraints
Enforce referential integrity between related tables.

### Unique Constraints
- `profiles.email`: Prevents duplicate user accounts
- `teachers.email`: Ensures unique teacher emails
- `students` + `teachers`: Same email can exist in both (different contexts)

### Check Constraints
- `teaching_sessions.percentage_acquired`: Must be between 0 and 100

### NOT NULL Constraints
Essential fields that must always have values:
- User emails, names
- School associations
- Activity titles
- Session dates

---

## 💾 Backup & Recovery

### Backup Strategy

#### Full Backup (Daily)
```bash
# Create full database backup
docker exec school-management-db pg_dump -U postgres schoolmanagement > backup_$(date +%Y%m%d).sql

# With compression
docker exec school-management-db pg_dump -U postgres schoolmanagement | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### Table-Specific Backup
```bash
# Backup single table
docker exec school-management-db pg_dump -U postgres -t activities schoolmanagement > activities_backup.sql
```

#### Data-Only Backup (no schema)
```bash
docker exec school-management-db pg_dump -U postgres --data-only schoolmanagement > data_backup.sql
```

### Restore Procedures

#### Full Restore
```bash
# Stop backend to prevent conflicts
docker-compose stop backend

# Drop and recreate database
docker exec -it school-management-db psql -U postgres -c "DROP DATABASE IF EXISTS schoolmanagement;"
docker exec -it school-management-db psql -U postgres -c "CREATE DATABASE schoolmanagement;"

# Restore from backup
docker exec -i school-management-db psql -U postgres schoolmanagement < backup_20251019.sql

# Start backend
docker-compose start backend
```

#### Restore from compressed backup
```bash
gunzip < backup_20251019.sql.gz | docker exec -i school-management-db psql -U postgres schoolmanagement
```

---

## 📈 Database Performance

### Query Optimization Tips

1. **Use Indexes**: Queries on indexed columns are faster
2. **Limit Results**: Use LIMIT clause for large datasets
3. **Avoid SELECT ***: Select only needed columns
4. **Use JOINs Efficiently**: Filter early in query
5. **Analyze Queries**: Use EXPLAIN ANALYZE

### Example Optimized Queries

```sql
-- Good: Uses index on school_id
SELECT id, title, type
FROM activities
WHERE school_id = 1
LIMIT 50;

-- Bad: Full table scan
SELECT *
FROM activities;

-- Good: JOIN with indexed columns
SELECT a.title, s.name AS school_name
FROM activities a
INNER JOIN schools s ON a.school_id = s.id
WHERE a.is_published = TRUE;
```

### Connection Pooling
Spring Boot uses HikariCP for connection pooling:
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

---

## 🔍 Common Queries

### Get All Activities for a School
```sql
SELECT 
    a.id,
    a.title,
    a.type,
    a.level,
    a.is_published,
    COUNT(af.id) AS file_count
FROM activities a
LEFT JOIN activity_files af ON a.id = af.activity_id
WHERE a.school_id = 1
GROUP BY a.id
ORDER BY a.created_at DESC;
```

### Get Teacher's Teaching Sessions with Activity Details
```sql
SELECT 
    ts.id,
    ts.session_date,
    ts.subject,
    ts.percentage_acquired,
    c.name AS class_name,
    a.title AS activity_title
FROM teaching_sessions ts
INNER JOIN classes c ON ts.class_id = c.id
LEFT JOIN activities a ON ts.activity_id = a.id
WHERE ts.teacher_id = 5
ORDER BY ts.session_date DESC;
```

### Get Students in a Class
```sql
SELECT 
    s.id,
    s.full_name,
    s.date_of_birth,
    s.gender,
    s.parent_name,
    s.parent_phone
FROM students s
WHERE s.class_id = 3
ORDER BY s.full_name;
```

### Get Activity with All Files
```sql
SELECT 
    a.id AS activity_id,
    a.title,
    a.description,
    a.layout_data,
    af.id AS file_id,
    af.file_name,
    af.file_size,
    af.mime_type,
    af.element_id
FROM activities a
LEFT JOIN activity_files af ON a.id = af.activity_id
WHERE a.id = 'uuid-here'
ORDER BY af.position;
```

### School Statistics Dashboard
```sql
SELECT 
    s.id,
    s.name,
    COUNT(DISTINCT t.id) AS teacher_count,
    COUNT(DISTINCT st.id) AS student_count,
    COUNT(DISTINCT c.id) AS class_count,
    COUNT(DISTINCT a.id) AS activity_count
FROM schools s
LEFT JOIN teachers t ON s.id = t.school_id
LEFT JOIN students st ON s.id = st.school_id
LEFT JOIN classes c ON s.id = c.school_id
LEFT JOIN activities a ON s.id = a.school_id
WHERE s.id = 1
GROUP BY s.id, s.name;
```

---

## 🛠️ Database Maintenance

### Vacuum (Cleanup)
PostgreSQL requires periodic vacuuming to reclaim storage.

```sql
-- Analyze tables (update statistics)
ANALYZE;

-- Vacuum all tables
VACUUM;

-- Full vacuum with table rewrite (locks tables)
VACUUM FULL;

-- Specific table
VACUUM ANALYZE activities;
```

### Reindex
Rebuild indexes to improve performance.

```sql
-- Reindex all tables
REINDEX DATABASE schoolmanagement;

-- Reindex specific table
REINDEX TABLE activities;

-- Reindex specific index
REINDEX INDEX idx_activities_school_id;
```

### Check Database Size
```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('schoolmanagement'));

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔒 Security Best Practices

1. **Strong Passwords**: Use complex passwords for database users
2. **Limited Permissions**: Grant minimum required privileges
3. **Network Isolation**: Use Docker networks, don't expose port 5432 publicly
4. **Encrypted Connections**: Use SSL/TLS for production
5. **Regular Backups**: Automated daily backups
6. **Audit Logging**: Enable PostgreSQL logging
7. **SQL Injection Prevention**: Use prepared statements (handled by JPA)

---

## 📚 Migration History

### Initial Schema (v1.0)
- Created all tables
- Established relationships
- Added indexes

### v1.1 - Activity Files
- Added `activity_files` table
- Added MinIO integration
- Added file lifecycle management

### v1.2 - Teaching Sessions
- Added `teaching_sessions` table
- Added session tracking
- Added percentage_acquired metric

---

## 🧪 Test Data

### Sample SuperAdmin
```sql
INSERT INTO profiles (id, email, password_hash, full_name, school_id)
VALUES (
    gen_random_uuid(),
    'admin@superadmin.com',
    '$2a$10$YourBcryptHashHere',
    'Super Administrator',
    NULL
);
```

### Sample School
```sql
INSERT INTO schools (name, address, phone, email)
VALUES (
    'Test School',
    '123 Test St',
    '555-1234',
    'info@testschool.edu'
);
```

---

**Last Updated**: October 19, 2025
