import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ChangePassword from "./pages/ChangePassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<AdminSignup />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/schools/:schoolId" element={<SuperAdminSchoolDetails />} />
          <Route path="/superadmin/activities/new" element={<SuperAdminActivityEditor />} />
          <Route path="/superadmin/activities/new/:schoolId" element={<SuperAdminActivityEditor />} />
          <Route path="/superadmin/activities/edit/:schoolId/:activityId" element={<SuperAdminActivityEditor />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/school/:id" element={<SchoolDashboard />} />
          <Route path="/school/:id/login" element={<SchoolLogin />} />
          <Route path="/school/:id/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/school/:id/teacher/diagnostic/new" element={<DiagnosticNewSession />} />
          <Route path="/school/:id/teacher/diagnostic/:sessionId" element={<DiagnosticSession />} />
          <Route path="/school/:id/teacher/diagnostic/:sessionId/results" element={<DiagnosticSessionResults />} />
          <Route path="/school/:id/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/activity/editor" element={<ActivityEditor />} />
          <Route path="/activity/editor/:activityId" element={<ActivityEditor />} />
          <Route path="/activity/:activityId" element={<ActivityView />} />
          <Route path="/school/:id/admin/classes" element={<ClassManagement />} />
          <Route path="/school/:id/admin/teachers" element={<TeacherManagement />} />
          <Route path="/school/:id/admin/activity-tracking" element={<ActivityTracking />} />
          <Route path="/school/:id/teacher/sessions" element={<TeacherSessions />} />
          <Route path="/school/:id/messages" element={<MessagingPage />} />
          <Route path="/school/:id/students" element={<StudentManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
