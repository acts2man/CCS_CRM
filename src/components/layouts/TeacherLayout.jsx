import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  BookOpen, BarChart3, Calendar, 
  Users, MessageSquare, Settings, 
  ChevronLeft, ChevronRight, Menu, X, LogOut, MoreHorizontal, User, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const navigation = [
  { name: 'Classes', href: 'TeacherClasses', icon: BookOpen },
  { name: 'Gradebook', href: 'TeacherGradebook', icon: BarChart3 },
  { name: 'Attendance', href: 'TeacherAttendance', icon: Calendar },
  { name: 'Students', href: 'StudentDirectory', icon: Users },
  { name: 'Messages', href: 'TeacherCommunications', icon: MessageSquare },
  { name: 'Profile', href: 'TeacherProfile', icon: User },
  { name: 'Settings', href: 'TeacherSettings', icon: Settings },
];

const TAB_ITEMS = navigation.slice(0, 4);
const MORE_ITEMS = navigation.slice(4);

export default function TeacherLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const teacherId = new URLSearchParams(window.location.search).get('teacherId');
  const isImpersonating = !!teacherId;

  const handleExitView = () => {
    navigate('/Dashboard');
  };

  // Build nav URL preserving teacherId param so it survives page navigation
  const navUrl = (href) => {
    const base = `/${href}`;
    return teacherId ? `${base}?teacherId=${teacherId}` : base;
  };

  const isActive = (href) => location.pathname === `/${href}`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r border-slate-700">
      <div className="flex items-center justify-between p-4">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6934d527b5d299be1ef1388b/7ba2762e9_3677bfb5-16c0-4a33-8a7d-e9784832b9bf.png"
          alt="Calvary Christian School"
          className={!collapsed ? "h-12 w-auto" : "h-10 w-auto"}
        />
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
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={navUrl(item.href)}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active ? 'bg-white/20 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
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
        {isImpersonating && (
          <Button 
            onClick={handleExitView}
            className="w-full justify-start text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 bg-transparent border border-amber-500/30"
            variant="ghost"
          >
            <ArrowLeft className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium ml-3">Exit View</span>}
          </Button>
        )}
        <Button 
          onClick={() => base44.auth.logout()}
          className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent"
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
          <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl">
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
            <nav className="p-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={navUrl(item.href)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      active ? 'bg-white/20 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700 space-y-2">
              {isImpersonating && (
                <button
                  onClick={handleExitView}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Exit View</span>
                </button>
              )}
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
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
            {TAB_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={navUrl(item.href)}
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
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </div>

        {/* "More" sheet */}
        {moreOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 pb-8">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <nav className="space-y-1">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={navUrl(item.href)}
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
                {isImpersonating && (
                  <button
                    onClick={() => { handleExitView(); setMoreOpen(false); }}
                    className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="text-sm font-medium">Exit View</span>
                  </button>
                )}
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
    </div>
  );
}