import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SchoolDashboard from "./pages/SchoolDashboard";
import SchoolLogin from "./pages/SchoolLogin";
import AdminSignup from "./pages/AdminSignup";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminSchoolDetails from "./pages/SuperAdminSchoolDetails";
import SuperAdminActivityEditor from "./pages/SuperAdminActivityEditor";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
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
import ActivityTracking from "./pages/ActivityTracking";
import NotFound from "./pages/NotFound";
import StudentManagement from "./pages/StudentManagement";
import UnderConstruction from "./pages/UnderConstruction";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/schools" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<AdminSignup />} />
            
            {/* Under Construction Pages - Public */}
            <Route path="/methode" element={<UnderConstruction pageName="Méthode" />} />
            <Route path="/espace" element={<UnderConstruction pageName="Espace" />} />
            <Route path="/clubs" element={<UnderConstruction pageName="Clubs" />} />
            <Route path="/contact" element={<UnderConstruction pageName="Contact" />} />
            
            {/* Public Login Pages */}
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />
            <Route path="/school/:id/login" element={<SchoolLogin />} />
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
              path="/superadmin/schools/:schoolId" 
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <SuperAdminSchoolDetails />
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
            <Route 
              path="/superadmin/activities/new/:schoolId" 
              element={
                <PrivateRoute requiredRole="SUPERADMIN">
                  <SuperAdminActivityEditor />
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
              path="/school/:id/admin/teachers" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <TeacherManagement />
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
