import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatArea({ conversation, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      // Load messages for this conversation
      const msgs = await base44.entities.Message.filter(
        { thread_id: conversation.id },
        '-created_date',
        100
      );
      setMessages(msgs.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await base44.entities.Message.create({
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        sender_role: currentUser.role,
        recipient_ids: [conversation.id],
        recipient_type: 'individual',
        subject: 'Direct Message',
        body: newMessage,
        thread_id: conversation.id,
        is_read: false
      });

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback>
              {conversation.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{conversation.name}</h3>
            <p className="text-sm text-gray-500">
              {conversation.type === 'group' ? `${conversation.type}` : 'Online'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      {msg.sender_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {!isOwn && (
                      <div className="text-xs text-gray-500 mb-1">
                        {msg.sender_name}
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <p className="text-sm">{msg.body}</p>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : ''}`}>
                      {format(new Date(msg.created_date), 'h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <Button 
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}