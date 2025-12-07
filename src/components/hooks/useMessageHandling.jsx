import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export const useMessageHandling = (
  activeChat,
  soundEnabled = true
) => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);
  const pageSize = 20;
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat || !user) {
      setMessages([]);
      setError(null);
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }
    
    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      setPage(0);
      
      try {
        let allMessages = await base44.entities.ChatMessage.list('-timestamp', 500);
        
        // Filter messages based on chat type
        let filteredMessages;
        if (activeChat.type === 'direct') {
          filteredMessages = allMessages.filter(msg => 
            (msg.sender_id === user.id && msg.recipient_id === activeChat.id) ||
            (msg.sender_id === activeChat.id && msg.recipient_id === user.id)
          );
        } else {
          filteredMessages = allMessages.filter(msg => msg.group_id === activeChat.id);
        }
        
        // Get only the first page
        const paginatedMessages = filteredMessages.slice(0, pageSize);
        
        // Fetch attachments for each message
        const messagesWithAttachments = await Promise.all(
          paginatedMessages.map(async (msg) => {
            let attachments = [];
            try {
              attachments = await base44.entities.ChatAttachment.filter(
                { message_id: msg.id },
                '',
                10
              );
            } catch (err) {
              console.error('Error fetching attachments:', err);
            }
            
            return {
              id: msg.id,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              senderId: msg.sender_id,
              recipientId: msg.recipient_id || null,
              groupId: msg.group_id || null,
              read: msg.read || false,
              attachments: attachments.map(att => ({
                id: att.id,
                type: att.type,
                url: att.url,
                name: att.name,
                size: att.size || 0
              })),
              threadId: msg.thread_id || null,
              topicType: msg.topic_type
            };
          })
        );
        
        setMessages(messagesWithAttachments);
        setHasMoreMessages(filteredMessages.length > pageSize);
      } catch (error) {
        console.error("Error loading messages:", error);
        setError(`Failed to load messages: ${error.message || 'Unknown error'}`);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    loadMessages();

    // Set up polling for new messages (every 5 seconds)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      checkForNewMessages();
    }, 5000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeChat, user]);

  const checkForNewMessages = async () => {
    if (!activeChat || !user || messages.length === 0) return;
    
    try {
      const latestTimestamp = messages[0].timestamp;
      const allMessages = await base44.entities.ChatMessage.list('-timestamp', 50);
      
      let newMessages;
      if (activeChat.type === 'direct') {
        newMessages = allMessages.filter(msg => {
          const isInConversation = 
            (msg.sender_id === user.id && msg.recipient_id === activeChat.id) ||
            (msg.sender_id === activeChat.id && msg.recipient_id === user.id);
          const isNewer = new Date(msg.timestamp) > latestTimestamp;
          return isInConversation && isNewer;
        });
      } else {
        newMessages = allMessages.filter(msg => 
          msg.group_id === activeChat.id &&
          new Date(msg.timestamp) > latestTimestamp
        );
      }
      
      if (newMessages.length > 0) {
        // Fetch attachments for new messages
        const messagesWithAttachments = await Promise.all(
          newMessages.map(async (msg) => {
            let attachments = [];
            try {
              attachments = await base44.entities.ChatAttachment.filter(
                { message_id: msg.id },
                '',
                10
              );
            } catch (err) {
              console.error('Error fetching attachments:', err);
            }
            
            return {
              id: msg.id,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              senderId: msg.sender_id,
              recipientId: msg.recipient_id || null,
              groupId: msg.group_id || null,
              read: msg.read || false,
              attachments: attachments.map(att => ({
                id: att.id,
                type: att.type,
                url: att.url,
                name: att.name,
                size: att.size || 0
              })),
              threadId: msg.thread_id || null,
              topicType: msg.topic_type
            };
          })
        );
        
        setMessages(prev => [...messagesWithAttachments, ...prev]);
        
        // Play sound for messages not from current user
        if (soundEnabled && newMessages.some(msg => msg.sender_id !== user.id)) {
          // Play notification sound (simplified version)
          console.log("🔔 New message notification");
        }
      }
    } catch (error) {
      console.error("Error checking for new messages:", error);
    }
  };

  const sendMessage = async (content, attachments = [], threadId = null, topicType) => {
    if (!user || !activeChat || !content.trim()) return;
    
    try {
      const tempId = `temp-${Date.now()}`;
      
      // Optimistic update
      const newMessage = {
        id: tempId,
        senderId: user.id,
        recipientId: activeChat.type === 'direct' ? activeChat.id : null,
        groupId: activeChat.type === 'group' ? activeChat.id : null,
        content,
        timestamp: new Date(),
        read: false,
        attachments,
        threadId,
        topicType
      };
      
      setMessages(prev => [newMessage, ...prev]);
      
      // Send to database
      const messageData = {
        sender_id: user.id,
        recipient_id: activeChat.type === 'direct' ? activeChat.id : null,
        group_id: activeChat.type === 'group' ? activeChat.id : null,
        content,
        timestamp: new Date().toISOString(),
        read: false,
        thread_id: threadId,
        topic_type: topicType
      };

      const createdMessage = await base44.entities.ChatMessage.create(messageData);
      
      // Insert attachments if any
      if (attachments.length > 0 && createdMessage) {
        const attachmentsToInsert = attachments.map(attachment => ({
          message_id: createdMessage.id,
          type: attachment.type,
          url: attachment.url,
          name: attachment.name,
          size: attachment.size
        }));
        
        await base44.entities.ChatAttachment.bulkCreate(attachmentsToInsert);
      }
      
      // Replace temp message with real one
      if (createdMessage) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { ...newMessage, id: createdMessage.id }
              : msg
          )
        );
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  };

  const markAsRead = async (messageIds) => {
    if (!messageIds.length) return;
    
    try {
      // Update local state
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, read: true } : msg
      ));
      
      // Update in database
      for (const id of messageIds) {
        await base44.entities.ChatMessage.update(id, { read: true });
      }
      
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || !activeChat || !user) return;
    
    setIsLoadingMore(true);
    
    try {
      const allMessages = await base44.entities.ChatMessage.list('-timestamp', 500);
      
      let filteredMessages;
      if (activeChat.type === 'direct') {
        filteredMessages = allMessages.filter(msg => 
          (msg.sender_id === user.id && msg.recipient_id === activeChat.id) ||
          (msg.sender_id === activeChat.id && msg.recipient_id === user.id)
        );
      } else {
        filteredMessages = allMessages.filter(msg => msg.group_id === activeChat.id);
      }
      
      const nextPage = page + 1;
      const start = nextPage * pageSize;
      const end = start + pageSize;
      const paginatedMessages = filteredMessages.slice(start, end);
      
      if (paginatedMessages.length > 0) {
        const messagesWithAttachments = await Promise.all(
          paginatedMessages.map(async (msg) => {
            let attachments = [];
            try {
              attachments = await base44.entities.ChatAttachment.filter(
                { message_id: msg.id },
                '',
                10
              );
            } catch (err) {
              console.error('Error fetching attachments:', err);
            }
            
            return {
              id: msg.id,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              senderId: msg.sender_id,
              recipientId: msg.recipient_id || null,
              groupId: msg.group_id || null,
              read: msg.read || false,
              attachments: attachments.map(att => ({
                id: att.id,
                type: att.type,
                url: att.url,
                name: att.name,
                size: att.size || 0
              })),
              threadId: msg.thread_id || null,
              topicType: msg.topic_type
            };
          })
        );
        
        setMessages(prev => [...prev, ...messagesWithAttachments]);
        setPage(nextPage);
        setHasMoreMessages(end < filteredMessages.length);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const reloadMessages = () => {
    if (activeChat && user) {
      setMessages([]);
      setError(null);
      setPage(0);
    }
  };

  return {
    messages,
    sendMessage,
    markAsRead,
    loadingMessages,
    isLoadingMore,
    loadMoreMessages,
    hasMoreMessages,
    error,
    loadMessages: reloadMessages
  };
};