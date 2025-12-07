import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function CreateGroupModal({ open, onOpenChange, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open]);

  const loadMembers = async () => {
    try {
      const [teachers, parents] = await Promise.all([
        base44.entities.Teacher.filter({ status: 'Active' }),
        base44.entities.Parent.list()
      ]);

      const allMembers = [
        ...teachers.map(t => ({
          id: t.id,
          name: `${t.first_name} ${t.last_name}`,
          role: 'Teacher',
          email: t.email
        })),
        ...parents.map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          role: 'Parent',
          email: p.email
        }))
      ];

      setMembers(allMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setCreating(true);
    try {
      const user = await base44.auth.me();

      // Create the group
      const groupData = await base44.entities.ChatGroup.create({
        name: groupName,
        type: 'group',
        description: description || null,
        created_by: user.id,
        is_active: true
      });

      // Add members
      const memberPromises = selectedMembers.map(memberId =>
        base44.entities.ChatGroupMember.create({
          group_id: groupData.id,
          user_id: memberId,
          role: 'member'
        })
      );

      // Add creator as admin
      memberPromises.push(
        base44.entities.ChatGroupMember.create({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin'
        })
      );

      await Promise.all(memberPromises);

      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      onOpenChange(false);
      onGroupCreated?.();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-sm font-medium mb-2 block">Group Name</label>
            <Input
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
            <Textarea
              placeholder="Group description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Add Members ({selectedMembers.length} selected)
            </label>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedMembers.length === 0 || creating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {creating ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}