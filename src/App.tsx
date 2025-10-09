import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SchoolDashboard from "./pages/SchoolDashboard";
import SchoolLogin from "./pages/SchoolLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DiagnosticNewSession from "./pages/DiagnosticNewSession";
import DiagnosticSession from "./pages/DiagnosticSession";
import DiagnosticSessionResults from "./pages/DiagnosticSessionResults";
import ActivityEditor from "./pages/ActivityEditor";
import ActivityView from "./pages/ActivityView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
