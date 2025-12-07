import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export const useThreadHandling = () => {
  const [user, setUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      await loadThreads(currentUser);
      
      // Set up polling for thread updates (every 10 seconds)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setInterval(() => {
        loadThreads(currentUser);
      }, 10000);
      
    } catch (error) {
      console.error("Error loading initial thread data:", error);
    }
  };

  const loadThreads = async (currentUser) => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all messages the user has access to
      const allMessages = await base44.entities.ChatMessage.list('', 500);
      
      const userMessages = allMessages.filter(msg => 
        msg.sender_id === currentUser.id || 
        msg.recipient_id === currentUser.id
      );
      
      if (userMessages.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }
      
      const messageIds = userMessages.map(m => m.id);
      
      // Get all threads for these messages
      const allThreads = await base44.entities.ChatThread.list('-last_activity', 100);
      
      const userThreads = allThreads.filter(thread => 
        messageIds.includes(thread.message_id)
      );
      
      const formattedThreads = userThreads.map(thread => ({
        id: thread.id,
        messageId: thread.message_id,
        title: thread.title,
        lastActivity: new Date(thread.last_activity)
      }));
      
      setThreads(formattedThreads);
    } catch (error) {
      console.error("Error loading threads:", error);
      setError(`Failed to load threads: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const startThread = async (messageId, title) => {
    if (!user) {
      console.error("You must be logged in to start a thread");
      return;
    }
    
    try {
      const threadData = {
        message_id: messageId,
        title,
        last_activity: new Date().toISOString()
      };
      
      const newThread = await base44.entities.ChatThread.create(threadData);
      
      if (newThread) {
        const formattedThread = {
          id: newThread.id,
          messageId: newThread.message_id,
          title: newThread.title,
          lastActivity: new Date(newThread.last_activity)
        };
        
        setThreads(prev => [formattedThread, ...prev]);
        setActiveThread(formattedThread.id);
        console.log("✅ Thread created successfully");
      }
    } catch (error) {
      console.error("❌ Failed to create thread:", error);
    }
  };

  return {
    threads,
    activeThread,
    setActiveThread,
    startThread,
    loading,
    error
  };
};