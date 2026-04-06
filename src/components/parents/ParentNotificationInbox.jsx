import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, DollarSign, MessageSquare, Bell, Check, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const NOTIFICATION_ICONS = {
  document: <FileText className="h-5 w-5 text-blue-600" />,
  attendance: <AlertCircle className="h-5 w-5 text-orange-600" />,
  billing: <DollarSign className="h-5 w-5 text-red-600" />,
  message: <MessageSquare className="h-5 w-5 text-green-600" />,
  system: <Bell className="h-5 w-5 text-purple-600" />,
  alert: <AlertCircle className="h-5 w-5 text-red-600" />
};

const NOTIFICATION_COLORS = {
  document: 'bg-blue-50 border-blue-200',
  attendance: 'bg-orange-50 border-orange-200',
  billing: 'bg-red-50 border-red-200',
  message: 'bg-green-50 border-green-200',
  system: 'bg-purple-50 border-purple-200',
  alert: 'bg-red-50 border-red-200'
};

export default function ParentNotificationInbox({ parentId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unread'); // 'all' or 'unread'

  useEffect(() => {
    if (parentId) {
      loadNotifications();
    }
  }, [parentId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Fetch notifications for this parent, sorted by newest first
      const allNotifications = await base44.entities.Notification.filter(
        { recipient_id: parentId },
        '-created_date',
        50
      );
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId, isRead) => {
    try {
      await base44.entities.Notification.update(notificationId, {
        is_read: !isRead,
        read_at: !isRead ? new Date().toISOString() : null
      });
      loadNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Inbox</h2>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-12 pb-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {filter === 'unread' ? 'No unread messages' : 'No notifications yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Communications will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border transition-all cursor-pointer hover:shadow-md ${
                notification.is_read ? 'bg-white' : `${NOTIFICATION_COLORS[notification.type]}`
              } ${!notification.is_read ? 'border-current' : 'border-gray-200'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title || notification.message}
                        </p>
                        {notification.title && notification.message && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={`text-xs capitalize ${
                          notification.type === 'document' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'attendance' ? 'bg-orange-100 text-orange-800' :
                          notification.type === 'billing' ? 'bg-red-100 text-red-800' :
                          notification.type === 'message' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type}
                        </Badge>
                      </div>
                    </div>

                    {/* Timestamp and actions */}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>
                        {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                      </span>
                      <button
                        onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        {notification.is_read ? (
                          <>Mark unread</>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            Mark as read
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}