import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Users, GraduationCap, Calendar, BookOpen, 
  FileText, DollarSign, MessageSquare, Mail, Settings, 
  HelpCircle, ChevronLeft, ChevronRight, BarChart3, Shield,
  Zap, FileSpreadsheet, Puzzle, UserCog, Menu, X, LogOut, MoreHorizontal, Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';
import { useImpersonation } from '@/lib/ImpersonationContext';

const ADMIN_NAV = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Students', href: 'Students', icon: Users },
  { name: 'Teachers', href: 'Teachers', icon: GraduationCap },
  { name: 'Attendance', href: 'Attendance', icon: Calendar },
  { name: 'Classes', href: 'Courses', icon: BookOpen },
  { name: 'Documents', href: 'Documents', icon: FileText },
  { name: 'Reports', href: 'ReportCenter', icon: FileSpreadsheet },
  { name: 'Billing', href: 'Billing', icon: DollarSign },
  { name: 'Time Off', href: 'TimeOff', icon: Calendar },
  { name: 'Bulletin Board', href: 'BulletinBoard', icon: Megaphone },
  { name: 'School Forms', href: 'SchoolForms', icon: FileSpreadsheet },
  { name: 'Chat', href: 'Chat', icon: MessageSquare },
  { name: 'Communications', href: 'Email', icon: Mail },
  { name: 'Users', href: 'UserManagement', icon: Users },
];

const ADMIN_TAB_ITEMS = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Students', href: 'Students', icon: Users },
  { name: 'Teachers', href: 'Teachers', icon: GraduationCap },
  { name: 'Attendance', href: 'Attendance', icon: Calendar },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { impersonatedTeacher } = useImpersonation();
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      const teachers = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
      if (teachers && teachers.length > 0) {
        currentUser.role = 'teacher';
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const isTeacherView = !!impersonatedTeacher || user?.role === 'teacher';
  const isActive = (href) => currentPageName === href || location.pathname === `/${href}`;

  const navigation = isTeacherView ? [
    { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
    { name: 'Students', href: 'Students', icon: Users },
    { name: 'Attendance', href: 'Attendance', icon: Calendar },
    { name: 'Gradebook', href: 'Gradebook', icon: BookOpen },
    { name: 'Documents', href: 'Documents', icon: FileText },
    { name: 'Reports', href: 'ReportCenter', icon: FileSpreadsheet },
    { name: 'Time Off', href: 'TimeOff', icon: Calendar },
    { name: 'Chat', href: 'Chat', icon: MessageSquare },
    { name: 'Email', href: 'Email', icon: Mail },
  ] : ADMIN_NAV;

  const adminNavigation = isTeacherView ? [] : [
    { name: 'Analytics', href: 'Analytics', icon: BarChart3 },
    { name: 'Audit Logs', href: 'AuditLogs', icon: Shield },
    { name: 'Automation', href: 'Automation', icon: Zap },
    { name: 'Forms', href: 'Forms', icon: FileText },
    { name: 'Plugins', href: 'PluginMarketplace', icon: Puzzle },
    { name: 'Staff', href: 'StaffManagement', icon: UserCog },
    { name: 'System', href: 'SystemSettings', icon: Settings },
  ];

  const supportNavigation = isTeacherView ? [] : [
    { name: 'Tutorials', href: 'Tutorials', icon: HelpCircle },
    { name: 'Help Center', href: 'HelpCenter', icon: HelpCircle },
  ];

  const tabItems = navigation.slice(0, 4);
  const moreNavItems = [...navigation.slice(4), ...adminNavigation];

  const NavLink = ({ item, onClick, className = '' }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.name}
        to={createPageUrl(item.href)}
        onClick={onClick}
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
          active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        } ${className}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="flex items-center justify-between p-4">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/7ba2762e9_3677bfb5-16c0-4a33-8a7d-e9784832b9bf.png"
          alt="Calvary Christian School"
          className={!collapsed ? "h-14 w-auto" : "h-10 w-auto"}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex text-white hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator className="bg-slate-700" />

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => <NavLink key={item.name} item={item} />)}
        </nav>

        {adminNavigation.length > 0 && (
          <>
            <Separator className="my-4 bg-slate-700" />
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Admin</div>
              )}
              {adminNavigation.map((item) => <NavLink key={item.name} item={item} />)}
            </div>
          </>
        )}

        {supportNavigation.length > 0 && (
          <>
            <Separator className="my-4 bg-slate-700" />
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Support</div>
              )}
              {supportNavigation.map((item) => <NavLink key={item.name} item={item} />)}
            </div>
          </>
        )}
      </ScrollArea>

      <Separator className="bg-slate-700" />

      <div className="p-3 space-y-3">
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.full_name}
                className="h-10 w-10 rounded-full object-cover border border-slate-600"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <Users className="h-5 w-5 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <NavLink item={{ name: 'Profile', href: 'Profile', icon: Users }} />
        <NavLink item={{ name: 'Settings', href: 'Settings', icon: Settings }} />
        <Button 
          onClick={() => base44.auth.logout()}
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
          variant="ghost"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/7ba2762e9_3677bfb5-16c0-4a33-8a7d-e9784832b9bf.png"
                alt="Calvary Christian School"
                className="h-12 w-auto"
              />
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <ScrollArea className="flex-1 px-3 py-3">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        active ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {adminNavigation.length > 0 && (
                <>
                  <div className="px-4 py-2 mt-3 text-xs font-semibold text-slate-400 uppercase">Admin</div>
                  <nav className="space-y-1">
                    {adminNavigation.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          to={createPageUrl(item.href)}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                            active ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </>
              )}
            </ScrollArea>
            <div className="p-3 border-t border-slate-700">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex-shrink-0`}>
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-1 rounded-lg hover:bg-gray-100">
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/7ba2762e9_3677bfb5-16c0-4a33-8a7d-e9784832b9bf.png"
            alt="Calvary Christian School"
            className="h-10 w-auto"
          />
          <div className="w-8" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="flex items-center justify-around px-2 py-2">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0 ${
                    active ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-[10px] font-medium truncate">{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </div>

        {/* "More" bottom sheet */}
        {moreOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <nav className="space-y-1">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${
                        active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => base44.auth.logout()}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}