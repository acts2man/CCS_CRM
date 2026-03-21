import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SignDocument from '@/pages/SignDocument';
import TimeOffAction from '@/pages/TimeOffAction';
import TimeOffRequest from '@/pages/TimeOffRequest';
import { ImpersonationProvider } from '@/lib/ImpersonationContext';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import StudentLayout from '@/components/layouts/StudentLayout';
import ParentLayout from '@/components/layouts/ParentLayout';
import TeacherLayout from '@/components/layouts/TeacherLayout';
import StudentDashboard from '@/pages/StudentDashboard';
import StudentSubjects from '@/pages/StudentSubjects';
import StudentAssignments from '@/pages/StudentAssignments';
import StudentGrades from '@/pages/StudentGrades';
import StudentTeachers from '@/pages/StudentTeachers';
import StudentDocuments from '@/pages/StudentDocuments';
import StudentAnnouncements from '@/pages/StudentAnnouncements';
import ParentGrades from '@/pages/ParentGrades';
import ParentAssignments from '@/pages/ParentAssignments';
import ParentAttendance from '@/pages/ParentAttendance';
import ParentBilling from '@/pages/ParentBilling';
import TeacherClasses from '@/pages/TeacherClasses';
import TeacherGradebook from '@/pages/TeacherGradebook';
import TeacherAttendance from '@/pages/TeacherAttendance';
import TeacherCommunications from '@/pages/TeacherCommunications';
import TeacherProfile from '@/pages/TeacherProfile';
import TeacherSettings from '@/pages/TeacherSettings';
import StudentDirectory from '@/pages/StudentDirectory';
import UserManagement from '@/pages/UserManagement';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Public routes bypass auth entirely
  if (window.location.pathname === '/time-off-request' || window.location.pathname === '/time-off-action') {
    return (
      <Routes>
        <Route path="/time-off-request" element={<TimeOffRequest />} />
        <Route path="/time-off-action" element={<TimeOffAction />} />
      </Routes>
    );
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (skip for public paths)
  const isPublicPath = ['/time-off-request', '/time-off-action'].some(p => window.location.pathname.startsWith(p));
  if (authError && !isPublicPath) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/sign-document" element={<SignDocument />} />
      <Route path="/time-off-action" element={<TimeOffAction />} />
      
      {/* Student Dashboard Routes */}
      <Route path="/StudentDashboard" element={<StudentLayout><StudentDashboard /></StudentLayout>} />
      <Route path="/StudentSubjects" element={<StudentLayout><StudentSubjects /></StudentLayout>} />
      <Route path="/StudentAssignments" element={<StudentLayout><StudentAssignments /></StudentLayout>} />
      <Route path="/StudentGrades" element={<StudentLayout><StudentGrades /></StudentLayout>} />
      <Route path="/StudentTeachers" element={<StudentLayout><StudentTeachers /></StudentLayout>} />
      <Route path="/StudentDocuments" element={<StudentLayout><StudentDocuments /></StudentLayout>} />
      <Route path="/StudentAnnouncements" element={<StudentLayout><StudentAnnouncements /></StudentLayout>} />
      
      {/* Parent Dashboard Routes */}
      <Route path="/ParentGrades" element={<ParentLayout><ParentGrades /></ParentLayout>} />
      <Route path="/ParentAssignments" element={<ParentLayout><ParentAssignments /></ParentLayout>} />
      <Route path="/ParentAttendance" element={<ParentLayout><ParentAttendance /></ParentLayout>} />
      <Route path="/ParentBilling" element={<ParentLayout><ParentBilling /></ParentLayout>} />
      
      {/* Teacher Dashboard Routes */}
      <Route path="/TeacherClasses" element={<TeacherLayout><TeacherClasses /></TeacherLayout>} />
      <Route path="/TeacherGradebook" element={<TeacherLayout><TeacherGradebook /></TeacherLayout>} />
      <Route path="/TeacherAttendance" element={<TeacherLayout><TeacherAttendance /></TeacherLayout>} />
      <Route path="/TeacherCommunications" element={<TeacherLayout><TeacherCommunications /></TeacherLayout>} />
      <Route path="/TeacherProfile" element={<TeacherLayout><TeacherProfile /></TeacherLayout>} />
      <Route path="/TeacherSettings" element={<TeacherLayout><TeacherSettings /></TeacherLayout>} />
      <Route path="/StudentDirectory" element={<TeacherLayout><StudentDirectory /></TeacherLayout>} />
      <Route path="/UserManagement" element={<LayoutWrapper currentPageName="UserManagement"><UserManagement /></LayoutWrapper>} />
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <ImpersonationProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <VisualEditAgent />
          <ImpersonationBanner />
        </QueryClientProvider>
      </ImpersonationProvider>
    </AuthProvider>
  )
}

export default App