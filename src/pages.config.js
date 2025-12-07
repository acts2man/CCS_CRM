import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Attendance from './pages/Attendance';
import Grading from './pages/Grading';
import Documents from './pages/Documents';
import ReportCenter from './pages/ReportCenter';
import Finance from './pages/Finance';
import StudentProfile from './pages/StudentProfile';
import TeacherProfile from './pages/TeacherProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Index": Index,
    "Students": Students,
    "Teachers": Teachers,
    "Attendance": Attendance,
    "Grading": Grading,
    "Documents": Documents,
    "ReportCenter": ReportCenter,
    "Finance": Finance,
    "StudentProfile": StudentProfile,
    "TeacherProfile": TeacherProfile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};