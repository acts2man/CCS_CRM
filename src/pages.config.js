/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import TimeOff from './pages/TimeOff';
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
    "TimeOff": TimeOff,
    "Tutorials": Tutorials,
    "WorkflowBuilder": WorkflowBuilder,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};