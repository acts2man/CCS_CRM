import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Mail, Phone, Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AddTeacherModal from '@/components/teachers/AddTeacherModal';
import EditTeacherModal from '@/components/teachers/EditTeacherModal';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const data = await base44.entities.Teacher.list('-created_date', 200);
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await base44.entities.Teacher.delete(id);
        loadTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleTeacherAdded = () => {
    loadTeachers();
    setShowAddModal(false);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowEditModal(true);
  };

  const handleTeacherUpdated = () => {
    loadTeachers();
    setShowEditModal(false);
    setSelectedTeacher(null);
  };

  // Calculate stats
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;
  const onLeaveTeachers = teachers.filter(t => t.status === 'On Leave').length;
  const departments = [...new Set(teachers.map(t => t.department).filter(Boolean))];
  const departmentCount = departments.length;

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const searchMatch = searchTerm === '' || 
      `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subjects?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatch = statusFilter === 'all' || teacher.status === statusFilter;
    const departmentMatch = departmentFilter === 'all' || teacher.department === departmentFilter;
    
    return searchMatch && statusMatch && departmentMatch;
  });

  const toggleSubjects = (teacherId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
  };

  const getYearsOfExperience = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24 * 365));
  };

  const formatStartDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `Since ${month} ${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading teachers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-gray-600 mt-1">Manage faculty members and their information</p>
        </div>
        <Button 
          className="bg-slate-900 hover:bg-slate-800"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total Teachers</div>
            <div className="text-3xl font-bold">{totalTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-3xl font-bold text-green-600">{activeTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">On Leave</div>
            <div className="text-3xl font-bold text-yellow-600">{onLeaveTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Departments</div>
            <div className="text-3xl font-bold">{departmentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Directory */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Teacher Directory</h2>
            <p className="text-sm text-gray-600">Search and filter teachers by various criteria</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, dept..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Teachers List - Card layout (mobile-friendly) */}
          <div className="space-y-3">
            {filteredTeachers.length === 0 && (
              <div className="text-center py-12 text-gray-500">No teachers found.</div>
            )}
            {filteredTeachers.map((teacher) => {
              const yearsExp = getYearsOfExperience(teacher.employment_start);
              const subjects = teacher.subjects || [];

              return (
                <div key={teacher.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={teacher.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.first_name}`} />
                        <AvatarFallback>{teacher.first_name?.[0]}{teacher.last_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{teacher.first_name} {teacher.last_name}</div>
                        <div className="text-sm text-gray-500 truncate">{teacher.email}</div>
                        {teacher.department && <div className="text-xs text-gray-400">{teacher.department}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge className={
                        teacher.status === 'Active' ? 'bg-green-100 text-green-800' :
                        teacher.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {teacher.status || 'Active'}
                      </Badge>
                    </div>
                  </div>

                  {subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {subjects.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {subjects.length > 3 && <span className="text-xs text-gray-500">+{subjects.length - 3} more</span>}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-500">{yearsExp} yrs exp · {formatStartDate(teacher.employment_start)}</div>
                    <div className="flex gap-1">
                      {teacher.email && <a href={`mailto:${teacher.email}`} className="p-1.5 hover:bg-gray-100 rounded"><Mail className="h-4 w-4 text-gray-600" /></a>}
                      {teacher.phone && <a href={`tel:${teacher.phone}`} className="p-1.5 hover:bg-gray-100 rounded"><Phone className="h-4 w-4 text-gray-600" /></a>}
                      <button onClick={() => handleEditTeacher(teacher)} className="p-1.5 hover:bg-gray-100 rounded"><Edit className="h-4 w-4 text-gray-600" /></button>
                      <button onClick={() => handleDeleteTeacher(teacher.id)} className="p-1.5 hover:bg-gray-100 rounded"><Trash2 className="h-4 w-4 text-red-600" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AddTeacherModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onTeacherAdded={handleTeacherAdded}
      />
      <EditTeacherModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        teacher={selectedTeacher}
        onTeacherUpdated={handleTeacherUpdated}
      />
    </div>
  );
}