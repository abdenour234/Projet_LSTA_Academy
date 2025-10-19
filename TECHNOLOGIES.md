# 🛠️ Technology Stack Documentation - School Management Platform

## 📋 Table of Contents
1. [Backend Technologies](#backend-technologies)
2. [Frontend Technologies](#frontend-technologies)
3. [Database & Storage](#database--storage)
4. [DevOps & Infrastructure](#devops--infrastructure)
5. [Development Tools](#development-tools)
6. [Security Technologies](#security-technologies)
7. [Third-Party Libraries](#third-party-libraries)

---

## 🔧 Backend Technologies

### 1. **Spring Boot 3.3.5**
**Purpose**: Java-based backend framework for building production-ready applications.

**Why Spring Boot?**
- ✅ Enterprise-grade framework with robust ecosystem
- ✅ Built-in dependency injection (IoC container)
- ✅ Auto-configuration reduces boilerplate
- ✅ Production-ready features (health checks, metrics)
- ✅ Excellent community support and documentation

**Key Features Used:**
- **Spring Boot Starter Web**: REST API development
- **Spring Boot Starter Data JPA**: Database ORM
- **Spring Boot Starter Security**: Authentication & authorization
- **Spring Boot Starter Validation**: Input validation

**Configuration:**
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.5</version>
</parent>
```

**Official Documentation**: https://spring.io/projects/spring-boot

---

### 2. **Java 17**
**Purpose**: Primary programming language for backend development.

**Why Java 17?**
- ✅ LTS (Long Term Support) version
- ✅ Modern language features (records, pattern matching, sealed classes)
- ✅ Improved performance over Java 11
- ✅ Strong typing and compile-time safety
- ✅ Excellent tooling support

**Key Features Used:**
- **Records**: Immutable data classes (DTOs)
- **var keyword**: Type inference
- **Switch Expressions**: Cleaner conditional logic
- **Text Blocks**: Multi-line strings

**Example:**
```java
// Using Java 17 Records
public record AuthResponse(String token, String email, String fullName) {}

// Text blocks for SQL
String query = """
    SELECT * FROM activities 
    WHERE school_id = ?
    ORDER BY created_at DESC
    """;
```

**Official Site**: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html

---

### 3. **Spring Data JPA**
**Purpose**: Object-Relational Mapping (ORM) for database operations.

**Why Spring Data JPA?**
- ✅ Eliminates boilerplate CRUD code
- ✅ Type-safe queries with method names
- ✅ Automatic transaction management
- ✅ Built on Hibernate ORM
- ✅ Supports custom queries with @Query

**Key Features:**
```java
public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findBySchoolIdOrderByCreatedAtDesc(Integer schoolId);
    List<Activity> findBySchoolIdAndIsPublished(Integer schoolId, Boolean isPublished);
    
    @Query("SELECT a FROM Activity a WHERE a.type = :type AND a.level = :level")
    List<Activity> findByTypeAndLevel(@Param("type") String type, @Param("level") String level);
}
```

**Official Documentation**: https://spring.io/projects/spring-data-jpa

---

### 4. **Hibernate ORM**
**Purpose**: JPA implementation for database persistence.

**Why Hibernate?**
- ✅ Industry standard JPA provider
- ✅ Advanced caching mechanisms
- ✅ Lazy loading support
- ✅ Complex relationship mapping
- ✅ Database-agnostic SQL generation

**Configuration:**
```properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

**Official Site**: https://hibernate.org/

---

### 5. **Spring Security**
**Purpose**: Authentication and authorization framework.

**Why Spring Security?**
- ✅ Comprehensive security framework
- ✅ JWT token support
- ✅ Role-based access control
- ✅ Protection against common attacks (CSRF, XSS)
- ✅ Flexible configuration

**Security Configuration:**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

**Official Documentation**: https://spring.io/projects/spring-security

---

### 6. **JWT (JSON Web Tokens)**
**Purpose**: Stateless authentication mechanism.

**Why JWT?**
- ✅ Stateless authentication (no server-side sessions)
- ✅ Cross-domain authentication
- ✅ Scalable for microservices
- ✅ Self-contained (includes user info)
- ✅ Secure with HMAC signature

**JWT Structure:**
```
Header.Payload.Signature

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Library Used:** `io.jsonwebtoken:jjwt-api:0.11.5`

**Official Site**: https://jwt.io/

---

### 7. **MinIO Java SDK**
**Purpose**: S3-compatible object storage client.

**Why MinIO SDK?**
- ✅ AWS S3-compatible API
- ✅ Simple file upload/download
- ✅ Bucket lifecycle management
- ✅ Streaming support for large files
- ✅ Presigned URL generation

**Usage Example:**
```java
@Configuration
public class MinioConfig {
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
            .endpoint("http://minio:9000")
            .credentials("minioadmin", "minioadmin")
            .build();
    }
}
```

**Dependency:**
```xml
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.7</version>
</dependency>
```

**Official Documentation**: https://min.io/docs/minio/linux/developers/java/minio-java.html

---

### 8. **Maven**
**Purpose**: Build automation and dependency management.

**Why Maven?**
- ✅ Standardized project structure
- ✅ Central repository for dependencies
- ✅ Plugin ecosystem
- ✅ Multi-module project support
- ✅ Industry standard for Java projects

**pom.xml Structure:**
```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.schoolmanagement</groupId>
    <artifactId>school-management-backend</artifactId>
    <version>1.0.0</version>
    
    <dependencies>
        <!-- Spring Boot, JPA, Security, etc. -->
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**Official Site**: https://maven.apache.org/

---

### 9. **Lombok**
**Purpose**: Reduce boilerplate code in Java classes.

**Why Lombok?**
- ✅ Auto-generates getters/setters
- ✅ Constructor generation
- ✅ Builder pattern
- ✅ Logging annotations
- ✅ Cleaner code

**Example:**
```java
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {
    @Id
    @GeneratedValue
    private UUID id;
    
    private String title;
    private String description;
    
    // No need to write getters, setters, constructors!
}
```

**Dependency:**
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

**Official Site**: https://projectlombok.org/

---

## 🎨 Frontend Technologies

### 1. **React 18.3.1**
**Purpose**: Component-based UI library for building interactive interfaces.

**Why React?**
- ✅ Component reusability
- ✅ Virtual DOM for performance
- ✅ Huge ecosystem of libraries
- ✅ Strong community support
- ✅ Hooks for state management

**Key Concepts:**
- **Components**: Reusable UI pieces
- **Hooks**: useState, useEffect, useContext
- **JSX**: JavaScript XML syntax
- **Props**: Component parameters
- **State**: Component data

**Example Component:**
```tsx
import { useState } from 'react';

export const ActivityCard = ({ activity }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="card">
      <h3>{activity.title}</h3>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
      {isExpanded && <p>{activity.description}</p>}
    </div>
  );
};
```

**Official Documentation**: https://react.dev/

---

### 2. **TypeScript 5.5.3**
**Purpose**: Typed superset of JavaScript for better developer experience.

**Why TypeScript?**
- ✅ Static type checking catches errors early
- ✅ Better IDE autocomplete and IntelliSense
- ✅ Interfaces for data structures
- ✅ Refactoring safety
- ✅ Self-documenting code

**Example:**
```typescript
interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'Cours' | 'Exercice' | 'Evaluation';
  level: 'Primaire' | 'Collège' | 'Lycée';
  elements: ActivityElement[];
}

interface ActivityElement {
  id: string;
  type: 'text' | 'image' | 'pdf' | 'video';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}
```

**Official Site**: https://www.typescriptlang.org/

---

### 3. **Vite 5.4.2**
**Purpose**: Next-generation frontend build tool.

**Why Vite?**
- ✅ Lightning-fast HMR (Hot Module Replacement)
- ✅ Native ES modules support
- ✅ Optimized production builds
- ✅ Plugin ecosystem
- ✅ Much faster than Webpack

**Configuration (vite.config.ts):**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
```

**Official Site**: https://vitejs.dev/

---

### 4. **React Router DOM 6.26.2**
**Purpose**: Client-side routing for single-page applications.

**Why React Router?**
- ✅ Declarative routing
- ✅ Nested routes
- ✅ Dynamic route parameters
- ✅ Route guards
- ✅ Browser history management

**Example:**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schools/:schoolId" element={<SchoolDetail />} />
        <Route path="/activity/:activityId" element={<ActivityView />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Official Documentation**: https://reactrouter.com/

---

### 5. **TanStack Query (React Query) 5.56.2**
**Purpose**: Data fetching and state management library.

**Why React Query?**
- ✅ Automatic caching and cache invalidation
- ✅ Background refetching
- ✅ Loading and error states
- ✅ Pagination and infinite scrolling
- ✅ Optimistic updates

**Example:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function Activities() {
  const queryClient = useQueryClient();
  
  // Fetch activities
  const { data, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityApi.getAll(),
  });
  
  // Create activity mutation
  const createMutation = useMutation({
    mutationFn: activityApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

**Official Documentation**: https://tanstack.com/query/latest

---

### 6. **Tailwind CSS 3.4.1**
**Purpose**: Utility-first CSS framework.

**Why Tailwind?**
- ✅ Rapid UI development
- ✅ No need to write custom CSS
- ✅ Consistent design system
- ✅ Responsive design utilities
- ✅ Purge unused CSS in production

**Example:**
```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    View Details
  </button>
</div>
```

**Configuration (tailwind.config.ts):**
```typescript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
      },
    },
  },
  plugins: [],
};
```

**Official Documentation**: https://tailwindcss.com/

---

### 7. **shadcn/ui**
**Purpose**: Re-usable component library built on Radix UI.

**Why shadcn/ui?**
- ✅ Copy-paste components (not npm package)
- ✅ Full control over code
- ✅ Accessible (Radix UI primitives)
- ✅ Customizable with Tailwind
- ✅ Beautiful default styling

**Components Used:**
- Button, Card, Input, Select
- Dialog, Dropdown Menu, Popover
- Toast, Alert, Badge
- Table, Tabs, Accordion

**Example:**
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Activity Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Activity description here...</p>
    <Button variant="default" size="lg">
      Start Activity
    </Button>
  </CardContent>
</Card>
```

**Official Site**: https://ui.shadcn.com/

---

### 8. **Axios**
**Purpose**: HTTP client for API requests.

**Why Axios?**
- ✅ Promise-based API
- ✅ Request/response interceptors
- ✅ Automatic JSON transformation
- ✅ Request cancellation
- ✅ Error handling

**API Client (lib/api.ts):**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const activityApi = {
  getAll: () => api.get('/activities').then(res => res.data),
  getById: (id: string) => api.get(`/activities/${id}`).then(res => res.data),
  create: (data: any) => api.post('/activities', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/activities/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/activities/${id}`),
};
```

**Official Documentation**: https://axios-http.com/

---

### 9. **Lucide React**
**Purpose**: Icon library with 1000+ SVG icons.

**Why Lucide?**
- ✅ Consistent icon style
- ✅ Tree-shakable (only import used icons)
- ✅ Customizable size and color
- ✅ Actively maintained
- ✅ Fork of Feather Icons

**Example:**
```tsx
import { Upload, Image, FileText, Video, Save, Eye } from 'lucide-react';

<Button>
  <Upload className="mr-2 h-4 w-4" />
  Upload File
</Button>

<Image className="h-6 w-6 text-blue-500" />
<FileText className="h-6 w-6 text-red-500" />
<Video className="h-6 w-6 text-green-500" />
```

**Official Site**: https://lucide.dev/

---

### 10. **React PDF**
**Purpose**: PDF rendering in React applications.

**Why React PDF?**
- ✅ PDF.js integration
- ✅ Page-by-page rendering
- ✅ Zoom and navigation controls
- ✅ Text selection support
- ✅ Mobile-friendly

**Example (PDFViewer.tsx):**
```tsx
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const PDFViewer = ({ fileUrl }: { fileUrl: string }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  return (
    <div>
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        <Page pageNumber={pageNumber} />
      </Document>
      <div>
        <button onClick={() => setPageNumber(page => page - 1)} disabled={pageNumber <= 1}>
          Previous
        </button>
        <span>Page {pageNumber} of {numPages}</span>
        <button onClick={() => setPageNumber(page => page + 1)} disabled={pageNumber >= numPages}>
          Next
        </button>
      </div>
    </div>
  );
};
```

**NPM Package**: `react-pdf`

**Official Documentation**: https://www.npmjs.com/package/react-pdf

---

## 💾 Database & Storage

### 1. **PostgreSQL 15**
**Purpose**: Primary relational database.

**Why PostgreSQL?**
- ✅ ACID compliance
- ✅ Advanced indexing (B-tree, GiST, GIN)
- ✅ JSON/JSONB support
- ✅ Full-text search
- ✅ Excellent performance
- ✅ Open-source and free

**Key Features:**
- **UUID Support**: Native UUID type for primary keys
- **JSONB**: Binary JSON for flexible data (layout_data)
- **Triggers**: Automatic timestamp updates
- **Foreign Keys**: Referential integrity
- **Transactions**: ACID guarantees

**Docker Configuration:**
```yaml
db:
  image: postgres:15
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: schoolmanagement
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Official Site**: https://www.postgresql.org/

---

### 2. **MinIO**
**Purpose**: S3-compatible object storage for files.

**Why MinIO?**
- ✅ S3-compatible API
- ✅ Self-hosted (data sovereignty)
- ✅ High performance
- ✅ Lifecycle policies
- ✅ Easy Docker deployment
- ✅ Web console UI

**Features Used:**
- **Bucket Management**: school-management bucket
- **File Upload/Download**: Streaming support
- **Lifecycle Policies**: 7-day TTL for activity-files/
- **Presigned URLs**: Temporary access URLs

**Docker Configuration:**
```yaml
minio:
  image: minio/minio
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  ports:
    - "9000:9000"
    - "9001:9001"
  volumes:
    - minio_data:/data
```

**Access:**
- **API**: http://localhost:9000
- **Console**: http://localhost:9001
- **Credentials**: minioadmin / minioadmin

**Official Site**: https://min.io/

---

## 🐳 DevOps & Infrastructure

### 1. **Docker**
**Purpose**: Containerization platform for consistent deployments.

**Why Docker?**
- ✅ Consistent environment (dev = prod)
- ✅ Easy deployment
- ✅ Isolated services
- ✅ Resource efficiency
- ✅ Version control for infrastructure

**Images Used:**
- `postgres:15` - Database
- `minio/minio` - Object storage
- `eclipse-temurin:17-jre-alpine` - Java runtime
- `maven:3.9-eclipse-temurin-17` - Build environment
- `node:18-alpine` - Node.js for frontend build
- `nginx:alpine` - Web server

**Official Site**: https://www.docker.com/

---

### 2. **Docker Compose**
**Purpose**: Multi-container orchestration.

**Why Docker Compose?**
- ✅ Define entire stack in YAML
- ✅ Single command to start all services
- ✅ Networking between containers
- ✅ Volume management
- ✅ Environment variable injection

**docker-compose.yml Structure:**
```yaml
version: '3.8'
services:
  db:
    # PostgreSQL database
  minio:
    # MinIO storage
  backend:
    # Spring Boot API
    depends_on:
      - db
      - minio
  frontend:
    # React app + Nginx
    depends_on:
      - backend
networks:
  app-network:
    driver: bridge
volumes:
  postgres_data:
  minio_data:
```

**Commands:**
```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop and remove containers
docker-compose logs backend   # View backend logs
docker-compose ps             # List running services
docker-compose restart        # Restart services
```

**Official Documentation**: https://docs.docker.com/compose/

---

### 3. **Nginx**
**Purpose**: Web server and reverse proxy.

**Why Nginx?**
- ✅ High performance
- ✅ Reverse proxy for API
- ✅ Static file serving
- ✅ Load balancing
- ✅ SSL termination

**Configuration (nginx.conf):**
```nginx
server {
    listen 80;
    server_name localhost;
    
    # Serve React app
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Official Site**: https://nginx.org/

---

## 🔐 Security Technologies

### 1. **BCrypt**
**Purpose**: Password hashing algorithm.

**Why BCrypt?**
- ✅ Slow hashing (prevents brute force)
- ✅ Automatic salt generation
- ✅ Configurable work factor
- ✅ Industry standard

**Usage:**
```java
@Service
public class AuthService {
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    public void createUser(String email, String password) {
        String hashedPassword = passwordEncoder.encode(password);
        // Save to database
    }
    
    public boolean verifyPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
}
```

---

### 2. **CORS (Cross-Origin Resource Sharing)**
**Purpose**: Allow frontend to access backend API from different origin.

**Configuration:**
```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost", "http://localhost:3000")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

---

## 📚 Third-Party Libraries

### Backend Dependencies (pom.xml)
```xml
<!-- Spring Boot Starters -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Database -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>

<!-- MinIO -->
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.7</version>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### Frontend Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "typescript": "^5.5.3",
    "@tanstack/react-query": "^5.56.2",
    "axios": "^1.7.7",
    "lucide-react": "^0.441.0",
    "tailwindcss": "^3.4.1",
    "react-pdf": "^9.1.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-toast": "^1.2.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2",
    "eslint": "^9.9.1",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20"
  }
}
```

---

## 🎓 Learning Resources

### Backend
- **Spring Boot**: https://spring.io/guides
- **Java**: https://dev.java/learn/
- **JPA**: https://www.baeldung.com/learn-jpa-hibernate
- **JWT**: https://jwt.io/introduction

### Frontend
- **React**: https://react.dev/learn
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Query**: https://tanstack.com/query/latest/docs/framework/react/overview

### DevOps
- **Docker**: https://docs.docker.com/get-started/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Nginx**: https://nginx.org/en/docs/

---

## 📊 Technology Comparison

### Why Not Other Alternatives?

| Technology | Alternative | Why We Chose Current |
|------------|-------------|---------------------|
| Spring Boot | Express.js (Node) | Better for enterprise, strong typing, mature ecosystem |
| PostgreSQL | MySQL | Better JSON support, advanced features, ACID compliance |
| React | Angular, Vue | Largest ecosystem, flexibility, job market demand |
| MinIO | AWS S3 | Self-hosted, cost-effective, S3-compatible |
| TypeScript | JavaScript | Type safety, better tooling, fewer runtime errors |
| Vite | Webpack | Faster builds, better dev experience, modern tooling |
| JWT | Session-based auth | Stateless, scalable, cross-domain support |
| Maven | Gradle | Standardized, widely used, simpler for this project |

---

## 🚀 Version History

### Current Versions (October 2025)
- **Backend**: Spring Boot 3.3.5, Java 17
- **Frontend**: React 18.3.1, TypeScript 5.5.3, Vite 5.4.2
- **Database**: PostgreSQL 15
- **Storage**: MinIO latest
- **Container**: Docker 24.x, Docker Compose 2.x

### Future Upgrades
- **Spring Boot 3.4.x**: Coming Q4 2025
- **React 19**: When stable
- **Java 21**: LTS upgrade planned

---

**Last Updated**: October 19, 2025
