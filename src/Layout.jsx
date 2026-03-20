import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Users, GraduationCap, Calendar, BookOpen, 
  FileText, DollarSign, MessageSquare, Mail, Settings, 
  HelpCircle, ChevronLeft, ChevronRight, BarChart3, Shield,
  Zap, FileSpreadsheet, Puzzle, UserCog, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      // Check if user has a matching Teacher record
      const teachers = await base44.entities.Teacher.filter({ email: currentUser.email }, '', 1);
      if (teachers && teachers.length > 0) {
        // If Teacher record exists, treat as teacher
        currentUser.role = 'teacher';
      }
      
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  // Navigation based on role
  const getNavigation = () => {
    if (user?.role === 'teacher') {
      return [
        { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
        { name: 'Students', href: 'Students', icon: Users },
        { name: 'Attendance', href: 'Attendance', icon: Calendar },
        { name: 'Gradebook', href: 'Gradebook', icon: BookOpen },
        { name: 'Documents', href: 'Documents', icon: FileText },
        { name: 'Reports', href: 'ReportCenter', icon: FileSpreadsheet },
        { name: 'Time Off', href: 'TimeOff', icon: Calendar },
        { name: 'Chat', href: 'Chat', icon: MessageSquare },
        { name: 'Email', href: 'Email', icon: Mail },
        ];
    }
    
    // Admin navigation
    return [
      { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
      { name: 'Students', href: 'Students', icon: Users },
      { name: 'Teachers', href: 'Teachers', icon: GraduationCap },
      { name: 'Attendance', href: 'Attendance', icon: Calendar },
      { name: 'Classes', href: 'Courses', icon: BookOpen },
      { name: 'Documents', href: 'Documents', icon: FileText },
      { name: 'Reports', href: 'ReportCenter', icon: FileSpreadsheet },
      { name: 'Billing', href: 'Billing', icon: DollarSign },
      { name: 'Time Off', href: 'TimeOff', icon: Calendar },
      { name: 'Chat', href: 'Chat', icon: MessageSquare },
      { name: 'Email', href: 'Email', icon: Mail },
    ];
  };

  const navigation = getNavigation();

  const getAdminNavigation = () => {
    if (user?.role === 'teacher') {
      return []; // No admin section for teachers
    }
    
    return [
      { name: 'Analytics', href: 'Analytics', icon: BarChart3 },
      { name: 'Audit Logs', href: 'AuditLogs', icon: Shield },
      { name: 'Automation', href: 'Automation', icon: Zap },
      { name: 'Forms', href: 'Forms', icon: FileText },
      { name: 'Plugins', href: 'PluginMarketplace', icon: Puzzle },
      { name: 'Staff', href: 'StaffManagement', icon: UserCog },
      { name: 'System', href: 'SystemSettings', icon: Settings },
    ];
  };

  const adminNavigation = getAdminNavigation();

  const getSupportNavigation = () => {
    if (user?.role === 'teacher') {
      return []; // No support section for teachers
    }
    
    return [
      { name: 'Tutorials', href: 'Tutorials', icon: HelpCircle },
      { name: 'Help Center', href: 'HelpCenter', icon: HelpCircle },
    ];
  };

  const supportNavigation = getSupportNavigation();

  const bottomNavigation = [
    { name: 'Profile', href: 'Profile', icon: Users },
    { name: 'Settings', href: 'Settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/7ba2762e9_3677bfb5-16c0-4a33-8a7d-e9784832b9bf.png"
            alt="Calvary Christian School"
            className={!collapsed ? "h-14 w-auto" : "h-10 w-auto"}
          />
        </div>
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
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {adminNavigation.length > 0 && (
          <>
            <Separator className="my-4 bg-slate-700" />

            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">
                  Admin
                </div>
              )}
              {adminNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
              );
              })}
              </div>
              </>
              )}

              {supportNavigation.length > 0 && (
                <>
                  <Separator className="my-4 bg-slate-700" />

                  <div className="space-y-1">
                    {!collapsed && (
                      <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">
                        Support
                      </div>
                    )}
                    {supportNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
              );
              })}
              </div>
              </>
              )}
              </ScrollArea>

      <Separator className="bg-slate-700" />

      <div className="p-2 space-y-1">
                {bottomNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  );
                })}
                <Button 
                  onClick={() => base44.auth.logout()}
                  className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
                  variant="ghost"
                >
                  <X className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">Logout</span>}
                </Button>
              </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-slate-900">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/7ba2762e9_3677bfb5-16c0-4a33-8a7d-e9784832b9bf.png"
              alt="Calvary Christian School"
              className="h-14 w-auto"
            />
          </div>
          <div className="w-10" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        </div>
        <Toaster />
        </div>
        );
        }