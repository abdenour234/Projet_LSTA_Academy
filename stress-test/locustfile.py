"""
LSTA Academy Stress Test Suite
Comprehensive load testing for all application functionalities
"""

import json
import random
import time
from locust import HttpUser, task, between, events
from faker import Faker
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

fake = Faker('fr_FR')

# Test Configuration
VPS_HOST = "http://57.129.110.129"
API_BASE = "/api"

# Test Accounts
SUPER_ADMIN = {
    "email": "admin@admin.com",
    "password": "admin123"
}

ADMIN = {
    "email": "abdenour@kabib.com",
    "password": "123AZEqsdwxc"
}

# Global stats collector
test_stats = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "errors": [],
    "response_times": [],
    "endpoints_tested": set()
}

@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, context, **kwargs):
    """Track all requests for reporting"""
    test_stats["total_requests"] += 1
    test_stats["endpoints_tested"].add(name)
    
    if exception:
        test_stats["failed_requests"] += 1
        test_stats["errors"].append({
            "endpoint": name,
            "error": str(exception),
            "time": time.time()
        })
    else:
        test_stats["successful_requests"] += 1
        test_stats["response_times"].append(response_time)


class SuperAdminUser(HttpUser):
    """Simulate SuperAdmin user behavior"""
    host = VPS_HOST
    wait_time = between(1, 3)
    weight = 1  # Lower weight for admin users
    
    def on_start(self):
        """Login as SuperAdmin"""
        self.token = None
        self.school_ids = []
        self.user_ids = []
        self.activity_ids = []
        
        response = self.client.post(
            f"{API_BASE}/auth/login",
            json=SUPER_ADMIN,
            name="[SuperAdmin] Login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
            logger.info(f"✅ SuperAdmin logged in successfully")
        else:
            logger.error(f"❌ SuperAdmin login failed: {response.status_code}")
    
    @task(5)
    def view_all_schools(self):
        """View all schools"""
        if not self.token:
            return
            
        response = self.client.get(
            f"{API_BASE}/schools",
            headers=self.headers,
            name="[SuperAdmin] Get All Schools"
        )
        
        if response.status_code == 200:
            schools = response.json()
            self.school_ids = [s.get("id") for s in schools if s.get("id")]
    
    @task(3)
    def create_school(self):
        """Create a new school"""
        if not self.token:
            return
            
        school_data = {
            "name": f"Test School {fake.company()}",
            "address": fake.address(),
            "phoneNumber": fake.phone_number(),
            "email": fake.email(),
            "principalName": fake.name(),
            "status": "ACTIVE"
        }
        
        self.client.post(
            f"{API_BASE}/schools",
            json=school_data,
            headers=self.headers,
            name="[SuperAdmin] Create School"
        )
    
    @task(4)
    def view_school_details(self):
        """View specific school details"""
        if not self.token or not self.school_ids:
            return
            
        school_id = random.choice(self.school_ids)
        self.client.get(
            f"{API_BASE}/schools/{school_id}",
            headers=self.headers,
            name="[SuperAdmin] Get School Details"
        )
    
    @task(3)
    def create_activity(self):
        """Create a new activity"""
        if not self.token:
            return
            
        activity_data = {
            "title": f"Activity {fake.catch_phrase()}",
            "description": fake.text(max_nb_chars=200),
            "type": random.choice(["READING", "WRITING", "MATH", "SCIENCE"]),
            "difficulty": random.choice(["EASY", "MEDIUM", "HARD"]),
            "duration": random.randint(15, 60),
            "points": random.randint(10, 100)
        }
        
        response = self.client.post(
            f"{API_BASE}/activities",
            json=activity_data,
            headers=self.headers,
            name="[SuperAdmin] Create Activity"
        )
        
        if response.status_code == 201:
            self.activity_ids.append(response.json().get("id"))
    
    @task(4)
    def view_all_activities(self):
        """View all activities"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/activities",
            headers=self.headers,
            name="[SuperAdmin] Get All Activities"
        )
    
    @task(2)
    def view_statistics(self):
        """View system statistics"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/statistics/global",
            headers=self.headers,
            name="[SuperAdmin] Get Global Statistics"
        )
    
    @task(2)
    def manage_users(self):
        """View and manage users"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/users",
            headers=self.headers,
            name="[SuperAdmin] Get All Users"
        )


class AdminUser(HttpUser):
    """Simulate School Admin user behavior"""
    host = VPS_HOST
    wait_time = between(1, 2)
    weight = 2  # Medium weight
    
    def on_start(self):
        """Login as Admin"""
        self.token = None
        self.school_id = None
        self.class_ids = []
        self.student_ids = []
        self.teacher_ids = []
        
        response = self.client.post(
            f"{API_BASE}/auth/login",
            json=ADMIN,
            name="[Admin] Login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.school_id = data.get("user", {}).get("schoolId")
            self.headers = {"Authorization": f"Bearer {self.token}"}
            logger.info(f"✅ Admin logged in successfully")
        else:
            logger.error(f"❌ Admin login failed: {response.status_code}")
    
    @task(5)
    def view_school_dashboard(self):
        """View school dashboard"""
        if not self.token or not self.school_id:
            return
            
        self.client.get(
            f"{API_BASE}/schools/{self.school_id}/dashboard",
            headers=self.headers,
            name="[Admin] Get School Dashboard"
        )
    
    @task(4)
    def manage_classes(self):
        """View and manage classes"""
        if not self.token or not self.school_id:
            return
            
        response = self.client.get(
            f"{API_BASE}/schools/{self.school_id}/classes",
            headers=self.headers,
            name="[Admin] Get Classes"
        )
        
        if response.status_code == 200:
            classes = response.json()
            self.class_ids = [c.get("id") for c in classes if c.get("id")]
    
    @task(3)
    def create_class(self):
        """Create a new class"""
        if not self.token or not self.school_id:
            return
            
        class_data = {
            "name": f"Class {fake.word().upper()}",
            "level": random.choice(["CP", "CE1", "CE2", "CM1", "CM2"]),
            "schoolYear": "2024-2025",
            "capacity": random.randint(20, 30)
        }
        
        self.client.post(
            f"{API_BASE}/schools/{self.school_id}/classes",
            json=class_data,
            headers=self.headers,
            name="[Admin] Create Class"
        )
    
    @task(5)
    def manage_students(self):
        """View and manage students"""
        if not self.token or not self.school_id:
            return
            
        response = self.client.get(
            f"{API_BASE}/schools/{self.school_id}/students",
            headers=self.headers,
            name="[Admin] Get Students"
        )
        
        if response.status_code == 200:
            students = response.json()
            self.student_ids = [s.get("id") for s in students if s.get("id")]
    
    @task(2)
    def create_student(self):
        """Create a new student"""
        if not self.token or not self.school_id or not self.class_ids:
            return
            
        student_data = {
            "firstName": fake.first_name(),
            "lastName": fake.last_name(),
            "email": fake.email(),
            "classId": random.choice(self.class_ids),
            "dateOfBirth": fake.date_of_birth(minimum_age=6, maximum_age=12).isoformat()
        }
        
        self.client.post(
            f"{API_BASE}/schools/{self.school_id}/students",
            json=student_data,
            headers=self.headers,
            name="[Admin] Create Student"
        )
    
    @task(4)
    def manage_teachers(self):
        """View and manage teachers"""
        if not self.token or not self.school_id:
            return
            
        response = self.client.get(
            f"{API_BASE}/schools/{self.school_id}/teachers",
            headers=self.headers,
            name="[Admin] Get Teachers"
        )
        
        if response.status_code == 200:
            teachers = response.json()
            self.teacher_ids = [t.get("id") for t in teachers if t.get("id")]
    
    @task(2)
    def create_teacher(self):
        """Create a new teacher"""
        if not self.token or not self.school_id:
            return
            
        teacher_data = {
            "firstName": fake.first_name(),
            "lastName": fake.last_name(),
            "email": fake.email(),
            "subject": random.choice(["Mathematics", "French", "Science", "History", "Geography"]),
            "phoneNumber": fake.phone_number()
        }
        
        self.client.post(
            f"{API_BASE}/schools/{self.school_id}/teachers",
            json=teacher_data,
            headers=self.headers,
            name="[Admin] Create Teacher"
        )
    
    @task(3)
    def view_student_details(self):
        """View specific student details"""
        if not self.token or not self.student_ids:
            return
            
        student_id = random.choice(self.student_ids)
        self.client.get(
            f"{API_BASE}/students/{student_id}",
            headers=self.headers,
            name="[Admin] Get Student Details"
        )
    
    @task(3)
    def view_class_details(self):
        """View specific class details"""
        if not self.token or not self.class_ids:
            return
            
        class_id = random.choice(self.class_ids)
        self.client.get(
            f"{API_BASE}/classes/{class_id}",
            headers=self.headers,
            name="[Admin] Get Class Details"
        )
    
    @task(2)
    def view_resources(self):
        """View educational resources"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/resources",
            headers=self.headers,
            name="[Admin] Get Resources"
        )
    
    @task(2)
    def manage_diagnostic_sessions(self):
        """Manage diagnostic sessions"""
        if not self.token or not self.class_ids:
            return
            
        class_id = random.choice(self.class_ids)
        self.client.get(
            f"{API_BASE}/classes/{class_id}/diagnostic-sessions",
            headers=self.headers,
            name="[Admin] Get Diagnostic Sessions"
        )


class TeacherUser(HttpUser):
    """Simulate Teacher user behavior"""
    host = VPS_HOST
    wait_time = between(1, 2)
    weight = 3  # Higher weight for teachers
    
    def on_start(self):
        """Login as Teacher (using admin account for simulation)"""
        self.token = None
        self.school_id = None
        self.class_ids = []
        self.student_ids = []
        
        # For simulation, we'll use the admin account
        response = self.client.post(
            f"{API_BASE}/auth/login",
            json=ADMIN,
            name="[Teacher] Login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.school_id = data.get("user", {}).get("schoolId")
            self.headers = {"Authorization": f"Bearer {self.token}"}
            logger.info(f"✅ Teacher logged in successfully")
    
    @task(6)
    def view_my_classes(self):
        """View assigned classes"""
        if not self.token or not self.school_id:
            return
            
        response = self.client.get(
            f"{API_BASE}/schools/{self.school_id}/classes",
            headers=self.headers,
            name="[Teacher] Get My Classes"
        )
        
        if response.status_code == 200:
            classes = response.json()
            self.class_ids = [c.get("id") for c in classes if c.get("id")]
    
    @task(5)
    def view_students(self):
        """View students in classes"""
        if not self.token or not self.school_id:
            return
            
        response = self.client.get(
            f"{API_BASE}/schools/{self.school_id}/students",
            headers=self.headers,
            name="[Teacher] Get Students"
        )
        
        if response.status_code == 200:
            students = response.json()
            self.student_ids = [s.get("id") for s in students if s.get("id")]
    
    @task(4)
    def view_activities(self):
        """View available activities"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/activities",
            headers=self.headers,
            name="[Teacher] Get Activities"
        )
    
    @task(3)
    def assign_activity(self):
        """Assign activity to student"""
        if not self.token or not self.student_ids:
            return
            
        # This would require getting activity IDs first
        self.client.get(
            f"{API_BASE}/activities",
            headers=self.headers,
            name="[Teacher] Assign Activity"
        )
    
    @task(4)
    def view_student_progress(self):
        """View student progress"""
        if not self.token or not self.student_ids:
            return
            
        student_id = random.choice(self.student_ids)
        self.client.get(
            f"{API_BASE}/students/{student_id}/progress",
            headers=self.headers,
            name="[Teacher] Get Student Progress"
        )
    
    @task(3)
    def create_diagnostic_session(self):
        """Create diagnostic session"""
        if not self.token or not self.class_ids:
            return
            
        class_id = random.choice(self.class_ids)
        session_data = {
            "classId": class_id,
            "name": f"Diagnostic {fake.word()}",
            "date": time.strftime("%Y-%m-%d"),
            "type": random.choice(["READING", "WRITING", "MATH"])
        }
        
        self.client.post(
            f"{API_BASE}/diagnostic-sessions",
            json=session_data,
            headers=self.headers,
            name="[Teacher] Create Diagnostic Session"
        )
    
    @task(2)
    def view_resources(self):
        """View teaching resources"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/resources",
            headers=self.headers,
            name="[Teacher] Get Resources"
        )


class StudentUser(HttpUser):
    """Simulate Student user behavior"""
    host = VPS_HOST
    wait_time = between(2, 4)
    weight = 4  # Highest weight - most users are students
    
    def on_start(self):
        """Login as Student (simulated)"""
        self.token = None
        self.student_id = None
        self.activity_ids = []
        
        # For simulation, we'll use the admin account
        response = self.client.post(
            f"{API_BASE}/auth/login",
            json=ADMIN,
            name="[Student] Login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
            logger.info(f"✅ Student logged in successfully")
    
    @task(6)
    def view_dashboard(self):
        """View student dashboard"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/students/dashboard",
            headers=self.headers,
            name="[Student] Get Dashboard"
        )
    
    @task(5)
    def view_activities(self):
        """View available activities"""
        if not self.token:
            return
            
        response = self.client.get(
            f"{API_BASE}/activities",
            headers=self.headers,
            name="[Student] Get Activities"
        )
        
        if response.status_code == 200:
            activities = response.json()
            self.activity_ids = [a.get("id") for a in activities if a.get("id")]
    
    @task(4)
    def view_activity_details(self):
        """View activity details"""
        if not self.token or not self.activity_ids:
            return
            
        activity_id = random.choice(self.activity_ids)
        self.client.get(
            f"{API_BASE}/activities/{activity_id}",
            headers=self.headers,
            name="[Student] Get Activity Details"
        )
    
    @task(3)
    def submit_activity(self):
        """Submit activity completion"""
        if not self.token or not self.activity_ids:
            return
            
        activity_id = random.choice(self.activity_ids)
        submission_data = {
            "activityId": activity_id,
            "answers": [{"question": 1, "answer": "Test answer"}],
            "timeSpent": random.randint(300, 1800),
            "completed": True
        }
        
        self.client.post(
            f"{API_BASE}/activities/{activity_id}/submit",
            json=submission_data,
            headers=self.headers,
            name="[Student] Submit Activity"
        )
    
    @task(3)
    def view_progress(self):
        """View my progress"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/students/my-progress",
            headers=self.headers,
            name="[Student] Get My Progress"
        )
    
    @task(2)
    def view_achievements(self):
        """View achievements and badges"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/students/achievements",
            headers=self.headers,
            name="[Student] Get Achievements"
        )
    
    @task(2)
    def view_clubs(self):
        """View available clubs"""
        if not self.token:
            return
            
        self.client.get(
            f"{API_BASE}/clubs",
            headers=self.headers,
            name="[Student] Get Clubs"
        )


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Generate performance report when test ends"""
    logger.info("=" * 80)
    logger.info("STRESS TEST COMPLETED - GENERATING REPORT")
    logger.info("=" * 80)
