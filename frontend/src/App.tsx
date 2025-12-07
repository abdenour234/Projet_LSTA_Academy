import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { NavigationProgressBar } from "@/components/NavigationProgressBar";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SchoolDashboard from "./pages/SchoolDashboard";
import AdminSignup from "./pages/AdminSignup";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SchoolDetails from "./pages/SchoolDetails";
import SuperAdminSchoolDetails from "./pages/SuperAdminSchoolDetails";
import SuperAdminActivityEditor from "./pages/SuperAdminActivityEditor";
import SuperAdminActivityCreator from "./pages/SuperAdminActivityCreator";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherActivityApproval from "./pages/TeacherActivityApproval";
import AdminDashboard from "./pages/AdminDashboard";
import DiagnosticNewSession from "./pages/DiagnosticNewSession";
import DiagnosticSession from "./pages/DiagnosticSession";
import DiagnosticSessionResults from "./pages/DiagnosticSessionResults";
import ActivityEditor from "./pages/ActivityEditor";
import ActivityView from "./pages/ActivityView";
import ClassManagement from "./pages/ClassManagement";
import TeacherManagement from "./pages/TeacherManagement";
import TeacherSessions from "./pages/TeacherSessions";
import MessagingPage from "./pages/MessagingPage";
import MessagingDashboard from "./pages/MessagingDashboard";
import ActivityTracking from "./pages/ActivityTracking";
import NotFound from "./pages/NotFound";
import StudentManagement from "./pages/StudentManagement";
import UnderConstruction from "./pages/UnderConstruction";
import Methode from "./pages/Methode";
import Clubs from "./pages/Clubs";
import ChangePassword from "./pages/ChangePassword";
import SubjectManagement from "./pages/SubjectManagement";
import ClassSubjectAssignment from "./pages/ClassSubjectAssignment";
import SchoolManage from "./pages/SchoolManage";
import TeacherAttendanceTracking from "./pages/TeacherAttendanceTracking";
import StudentAttendanceMarking from "./pages/StudentAttendanceMarking";
import StudentAttendanceTracking from "./pages/StudentAttendanceTracking";
import AdminSessionDetails from "./pages/AdminSessionDetails";
import TeacherActivityCreator from "./pages/TeacherActivityCreator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NavigationProgressBar />
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/schools" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/school/:id/manage" element={<SchoolManage />} />
            <Route path="/superadmin/login" element={<Login />} />
            <Route path="/school/:id/login" element={<Login />} />
            
            {/* Public Pages with New UI */}
            <Route path="/methode" element={<Methode />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/espace" element={<UnderConstruction pageName="Espace" />} />
            <Route path="/contact" element={<UnderConstruction pageName="Contact" />} />
            
            <Route path="/school/:id" element={<SchoolDashboard />} />
            
            {/* SUPERADMIN Routes - Protected */}
            <Route 
              path="/superadmin/dashboard" 
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <SuperAdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <AdminSignup />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/superadmin/activities/create"
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <SuperAdminActivityCreator />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/superadmin/activities/new"
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <SuperAdminActivityEditor />
                </PrivateRoute>
              } 
            />
            <Route path="/teacher/activity/new" element={
              <PrivateRoute requiredRole="TEACHER">
                <TeacherActivityCreator />
              </PrivateRoute>
            } />
            <Route 
              path="/superadmin/activities/new/:schoolId" 
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <SuperAdminActivityEditor />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/superadmin/schools/:schoolId" 
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <SchoolDetails />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/superadmin/activities/edit/:schoolId/:activityId" 
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <SuperAdminActivityEditor />
                </PrivateRoute>
              } 
            />
            
            {/* STUDENT Routes - Protected */}
            <Route 
              path="/student/dashboard" 
              element={
                <PrivateRoute requiredRole="STUDENT">
                  <StudentDashboard />
                </PrivateRoute>
              } 
            />
            
            {/* TEACHER Routes - Protected */}
            <Route 
              path="/school/:id/teacher/dashboard" 
              element={
                <PrivateRoute requiredRole="TEACHER">
                  <TeacherDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/teacher/diagnostic/new" 
              element={
                <PrivateRoute requiredRole="TEACHER">
                  <DiagnosticNewSession />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/teacher/diagnostic/:sessionId" 
              element={
                <PrivateRoute requiredRole="TEACHER">
                  <DiagnosticSession />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/teacher/diagnostic/:sessionId/results" 
              element={
                <PrivateRoute requiredRole="TEACHER">
                  <DiagnosticSessionResults />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/teacher/sessions" 
              element={
                <PrivateRoute requiredRole="TEACHER">
                  <TeacherSessions />
                </PrivateRoute>
              } 
            />
            <Route path="/school/:id/admin/session/:sessionId" element={
              <PrivateRoute requiredRole="ADMIN">
                <AdminSessionDetails />
              </PrivateRoute>
            } />
            <Route 
              path="/school/:id/teacher/activities/approval" 
              element={
                <PrivateRoute requiredRole="TEACHER">
                  <TeacherActivityApproval />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/teacher/student-attendance/mark" 
              element={
                <PrivateRoute requiredRole="TEACHER">
                  <StudentAttendanceMarking />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/teacher/student-attendance/track" 
              element={
                <PrivateRoute requiredRole="TEACHER">
                  <StudentAttendanceTracking />
                </PrivateRoute>
              } 
            />
            
            {/* ADMIN Routes - Protected */}
            <Route 
              path="/school/:id/admin/dashboard" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/admin/classes" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <ClassManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/admin/classes/:classId/subjects" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <ClassSubjectAssignment />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/admin/subjects" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <SubjectManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/admin/teachers" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <TeacherManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/:id/teacher-attendance" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <TeacherAttendanceTracking />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/admin/activity-tracking" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <ActivityTracking />
                </PrivateRoute>
              } 
            />
            
            {/* Multi-Role Routes - Protected */}
            <Route 
              path="/school/:id/students" 
              element={
                <PrivateRoute requiredRole={["ADMIN", "TEACHER"]}>
                  <StudentManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/school/:id/messages" 
              element={
                <PrivateRoute>
                  <MessagingPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/messaging" 
              element={
                <PrivateRoute requiredRole={["TEACHER", "ADMIN"]}>
                  <MessagingDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/activity/editor" 
              element={
                <PrivateRoute>
                  <ActivityEditor />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/activity/editor/:activityId" 
              element={
                <PrivateRoute>
                  <ActivityEditor />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/activity/:activityId" 
              element={
                <PrivateRoute>
                  <ActivityView />
                </PrivateRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
