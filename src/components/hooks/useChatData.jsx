import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const useChatData = () => {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [isTyping, setIsTyping] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      setLoadingContacts(true);
      setLoadingGroups(true);
      
      await Promise.all([
        loadContacts(currentUser),
        loadGroups(currentUser)
      ]);
    } catch (error) {
      console.error("Error loading initial chat data:", error);
    } finally {
      setLoadingContacts(false);
      setLoadingGroups(false);
    }
  };

  const loadContacts = async (currentUser) => {
    try {
      const allUsers = await base44.entities.User.list('', 500);
      
      // Filter contacts based on user role
      const filteredUsers = allUsers.filter(u => {
        if (u.id === currentUser.id) return false;
        
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'teacher') return u.role !== 'teacher';
        if (currentUser.role === 'parent') return u.role === 'admin' || u.role === 'teacher';
        if (currentUser.role === 'student') return u.role === 'teacher' || u.role === 'admin';
        return false;
      });
      
      const chatContacts = filteredUsers.map(u => ({
        userId: u.id,
        firstName: u.full_name?.split(' ')[0] || u.email.split('@')[0],
        lastName: u.full_name?.split(' ').slice(1).join(' ') || '',
        role: u.role,
        online: false,
        unreadCount: 0,
        avatar: u.avatar || null,
        lastSeen: new Date().toISOString()
      }));
      
      setContacts(chatContacts);
    } catch (error) {
      console.error("Error loading contacts:", error);
      throw error;
    }
  };

  const loadGroups = async (currentUser) => {
    try {
      // Get groups created by user
      const createdGroups = await base44.entities.ChatGroup.filter(
        { created_by: currentUser.id },
        '-created_date',
        100
      );
      
      // Get groups user is a member of
      const memberships = await base44.entities.ChatGroupMember.filter(
        { user_id: currentUser.id },
        '',
        100
      );
      
      const memberGroupIds = memberships.map(m => m.group_id);
      
      let memberGroups = [];
      if (memberGroupIds.length > 0) {
        const allGroups = await base44.entities.ChatGroup.list('', 500);
        memberGroups = allGroups.filter(g => memberGroupIds.includes(g.id));
      }
      
      // Combine and deduplicate
      const allGroupsMap = new Map();
      
      createdGroups.forEach(g => allGroupsMap.set(g.id, g));
      memberGroups.forEach(g => {
        if (!allGroupsMap.has(g.id)) {
          allGroupsMap.set(g.id, g);
        }
      });
      
      const formattedGroups = Array.from(allGroupsMap.values()).map(g => ({
        id: g.id,
        name: g.name,
        type: g.type,
        members: [],
        createdBy: g.created_by,
        createdAt: new Date(g.created_date),
        unreadCount: 0,
        avatar: g.avatar || null
      }));
      
      setGroups(formattedGroups);
    } catch (error) {
      console.error("Error loading groups:", error);
      throw error;
    }
  };

  const setUserTyping = (userId, typing) => {
    setIsTyping(prev => ({ ...prev, [userId]: typing }));
  };

  const createGroup = async (name, type, members) => {
    if (!user) return false;
    
    try {
      const groupData = {
        name,
        type,
        created_by: user.id,
        is_active: true
      };
      
      const newGroup = await base44.entities.ChatGroup.create(groupData);
      
      if (!newGroup) throw new Error("Failed to create group");
      
      // Add members to the group
      if (members.length > 0) {
        const membersToInsert = members.map(memberId => ({
          user_id: memberId,
          group_id: newGroup.id
        }));
        
        try {
          await base44.entities.ChatGroupMember.bulkCreate(membersToInsert);
        } catch (membersError) {
          console.warn("Error adding some members:", membersError);
        }
      }
      
      const formattedGroup = {
        id: newGroup.id,
        name: newGroup.name,
        type: newGroup.type,
        members: [...members],
        createdBy: user.id,
        createdAt: new Date(newGroup.created_date),
        unreadCount: 0,
        avatar: newGroup.avatar || null
      };
      
      setGroups(prev => [...prev, formattedGroup]);
      
      console.log("✅ Group created successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to create group:", error);
      return false;
    }
  };

  return {
    contacts,
    groups,
    loadingContacts,
    loadingGroups,
    isTyping,
    setUserTyping,
    createGroup,
    refetch: loadInitialData
  };
};