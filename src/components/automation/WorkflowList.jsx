import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FolderPlus, Plus, Search, Filter, Clock, 
  Calendar, LayoutList, MoreVertical, Folder, ExternalLink, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function WorkflowList() {
  const [activeTab, setActiveTab] = useState('all');
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadWorkflows();
  }, [activeTab]);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      if (currentFolder) {
        // Load workflows in this folder (using AutomationStep as workflow items)
        const steps = await base44.entities.AutomationStep.filter(
          { automation_id: currentFolder.id },
          '-created_date',
          100
        );
        setWorkflows(steps);
      } else {
        // Load folders (Automation entities)
        const data = await base44.entities.Automation.list('-created_date', 100);
        setWorkflows(data);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { value: 'all', label: 'All Workflows' },
    { value: 'review', label: 'Needs Review', count: 1 },
    { value: 'deleted', label: 'Deleted' },
  ];

  const filteredWorkflows = workflows.filter(w =>
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkflows = filteredWorkflows.slice(startIndex, startIndex + itemsPerPage);

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    setCurrentPage(1);
  };

  const handleBackClick = () => {
    setCurrentFolder(null);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workflow List</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Folder
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg border border-b-0">
        <div className="flex items-center gap-6 px-6 pt-4">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count && (
                <span className="ml-1 text-xs">({tab.count})</span>
              )}
            </button>
          ))}
          <button className="pb-3 px-2 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <Plus className="h-3 w-3" />
            New Smart List
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-b-lg border">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Clock className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <LayoutList className="h-4 w-4" />
            </Button>
            <div className="relative ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="px-6 py-2 border-b text-sm text-gray-600 flex items-center gap-2">
          {currentFolder ? (
            <>
              <button 
                onClick={handleBackClick}
                className="text-blue-600 hover:underline"
              >
                Back
              </button>
              <span>/</span>
              <span>{currentFolder.name}</span>
            </>
          ) : (
            <span>Home</span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 w-8">
                  <Checkbox />
                </th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Total Enrolled</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Active Enrolled</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Last Updated</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Created On</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Stats</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-500">
                    Loading workflows...
                  </td>
                </tr>
              ) : filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-500">
                    No workflows found
                  </td>
                </tr>
              ) : currentFolder ? (
                // Inside folder - show individual workflows
                paginatedWorkflows.map(workflow => (
                  <tr key={workflow.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <Checkbox />
                    </td>
                    <td className="py-4 px-4">
                      <Link 
                        to={createPageUrl(`WorkflowBuilder?id=${workflow.id}`)}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <span className="font-medium text-blue-600">{workflow.description || 'Workflow'}</span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        variant="outline"
                        className={workflow.is_enabled ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-300 text-gray-600'}
                      >
                        {workflow.is_enabled ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-blue-600">
                      {Math.floor(Math.random() * 500)}
                    </td>
                    <td className="py-4 px-4 text-sm text-blue-600">
                      {workflow.is_enabled ? Math.floor(Math.random() * 50) : 0}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(workflow.created_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(workflow.created_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Archive</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                // Folder view
                paginatedWorkflows.map(workflow => (
                  <tr 
                    key={workflow.id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleFolderClick(workflow)}
                  >
                    <td className="py-4 px-6">
                      <Checkbox onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{workflow.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {workflow.run_count || 0}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {workflow.success_count || 0}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {workflow.last_run_at 
                        ? new Date(workflow.last_run_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })
                        : '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(workflow.created_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View
                      </Button>
                    </td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Pause</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredWorkflows.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {itemsPerPage} / page
            </div>
          </div>
        )}
      </div>
    </div>
  );
}