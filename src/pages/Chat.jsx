import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Search, Bell } from 'lucide-react';
import { format } from 'date-fns';
import ConversationList from '@/components/chat/ConversationList';
import ChatArea from '@/components/chat/ChatArea';
import NewMessageModal from '@/components/chat/NewMessageModal';
import CreateGroupModal from '@/components/chat/CreateGroupModal';

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatType, setChatType] = useState('direct'); // 'direct' or 'groups'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admins', 'teachers', 'parents'
  const [soundOn, setSoundOn] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [chatType, roleFilter]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Load conversations based on type
      if (chatType === 'direct') {
        await loadDirectMessages();
      } else {
        await loadGroupMessages();
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDirectMessages = async () => {
    try {
      const messages = await base44.entities.Message.list('-created_date', 100);
      
      // Group messages by conversation (sender/recipient pair)
      const conversationMap = new Map();
      
      messages.forEach(msg => {
        const conversationId = msg.sender_id < msg.recipient_ids?.[0] 
          ? `${msg.sender_id}_${msg.recipient_ids?.[0]}`
          : `${msg.recipient_ids?.[0]}_${msg.sender_id}`;
          
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: conversationId,
            type: 'direct',
            name: msg.sender_name,
            role: msg.sender_role,
            lastMessage: msg.body,
            lastSeen: msg.created_date,
            unread: !msg.is_read,
            avatar: null
          });
        }
      });

      let convs = Array.from(conversationMap.values());
      
      // Apply role filter
      if (roleFilter !== 'all') {
        convs = convs.filter(c => c.role === roleFilter.slice(0, -1)); // Remove 's' from 'admins' etc.
      }

      setConversations(convs);
    } catch (error) {
      console.error('Error loading direct messages:', error);
    }
  };

  const loadGroupMessages = async () => {
    try {
      const groups = await base44.entities.ChatGroup.list('-created_date', 50);
      
      const convs = groups.map(group => ({
        id: group.id,
        type: 'group',
        name: group.name,
        role: group.type,
        lastMessage: '',
        lastSeen: group.created_date,
        unread: false,
        avatar: group.avatar
      }));

      setConversations(convs);
    } catch (error) {
      console.error('Error loading group messages:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleFilters = [
    { value: 'all', label: 'All' },
    { value: 'admins', label: 'Admins' },
    { value: 'teachers', label: 'Teachers' },
    { value: 'parents', label: 'Parents' }
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Calvary Messages</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className="w-80 border-r bg-white flex flex-col">
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-lg">Conversations</h2>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Direct/Groups Tabs */}
            <Tabs value={chatType} onValueChange={setChatType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="direct" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Direct
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  Groups
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Role Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {roleFilters.map(filter => (
                <Button
                  key={filter.value}
                  variant={roleFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter(filter.value)}
                  className="whitespace-nowrap"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations</div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.avatar} />
                      <AvatarFallback>
                        {conv.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{conv.name}</h3>
                        {conv.unread && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Last seen {format(new Date(conv.lastSeen), 'M/d/yyyy')}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {conv.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Chat or Welcome */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <ChatArea 
              conversation={selectedConversation}
              currentUser={currentUser}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6 max-w-md px-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-12 w-12 text-gray-400" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to Calvary Messages</h2>
                  <p className="text-gray-600">Select a conversation to start chatting</p>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-slate-900 hover:bg-slate-800"
                    onClick={() => setShowNewMessage(true)}
                  >
                    New Message
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowCreateGroup(true)}
                  >
                    Create Group
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 pt-4">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Sound On</span>
                  <Switch 
                    checked={soundOn}
                    onCheckedChange={setSoundOn}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewMessageModal
        open={showNewMessage}
        onOpenChange={setShowNewMessage}
        onMessageSent={loadData}
      />
      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onGroupCreated={loadData}
      />
    </div>
  );
}