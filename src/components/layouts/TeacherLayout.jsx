import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, BookOpen, BarChart3, Calendar, 
  Users, MessageSquare, FileText, Settings, 
  ChevronLeft, ChevronRight, Menu, X, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function TeacherLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
    { name: 'Classes', href: 'TeacherClasses', icon: BookOpen },
    { name: 'Gradebook', href: 'TeacherGradebook', icon: BarChart3 },
    { name: 'Attendance', href: 'TeacherAttendance', icon: Calendar },
    { name: 'Communications', href: 'TeacherCommunications', icon: MessageSquare },
    { name: 'Student Directory', href: 'StudentDirectory', icon: Users },
  ];

  const bottomNavigation = [
    { name: 'Settings', href: 'Settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r border-slate-700">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/7ba2762e9_3677bfb5-16c0-4a33-8a7d-e9784832b9bf.png"
            alt="Calvary Christian School"
            className={!collapsed ? "h-12 w-auto" : "h-10 w-auto"}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex text-white hover:bg-slate-700"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator className="bg-slate-700" />

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-700" />

      <div className="p-2 space-y-1">
        {bottomNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.href)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}
        <Button 
          onClick={() => base44.auth.logout()}
          className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent"
          variant="ghost"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
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
              className="h-12 w-auto"
            />
          </div>
          <div className="w-10" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}