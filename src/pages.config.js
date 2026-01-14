import Attendance from './pages/Attendance';
import Automation from './pages/Automation';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Email from './pages/Email';
import Finance from './pages/Finance';
import Forms from './pages/Forms';
import Grading from './pages/Grading';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import Index from './pages/Index';
import ReportCenter from './pages/ReportCenter';
import StudentProfile from './pages/StudentProfile';
import Students from './pages/Students';
import TeacherProfile from './pages/TeacherProfile';
import Teachers from './pages/Teachers';
import Tutorials from './pages/Tutorials';
import WorkflowBuilder from './pages/WorkflowBuilder';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Attendance": Attendance,
    "Automation": Automation,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Email": Email,
    "Finance": Finance,
    "Forms": Forms,
    "Grading": Grading,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "Index": Index,
    "ReportCenter": ReportCenter,
    "StudentProfile": StudentProfile,
    "Students": Students,
    "TeacherProfile": TeacherProfile,
    "Teachers": Teachers,
    "Tutorials": Tutorials,
    "WorkflowBuilder": WorkflowBuilder,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};