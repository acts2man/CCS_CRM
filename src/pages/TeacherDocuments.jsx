import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useTeacherId } from '@/lib/useTeacherId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Send, BookOpen, Loader2 } from 'lucide-react';
import SendDocumentModal from '@/components/documents/SendDocumentModal';
import BehaviorReportModal from '@/components/documents/BehaviorReportModal';
import SchoolBehaviorReportModal from '@/components/documents/SchoolBehaviorReportModal';
import DocumentDetailModal from '@/components/students/DocumentDetailModal';

const TEMPLATE_TYPE_LABELS = {
  behavior_report: 'Behavior Report',
  accident_report: 'Accident Report',
  dress_code_violation: 'Dress Code Violation',
  suspension_notice: 'Suspension Notice',
  preschool_notes: 'Preschool Notes',
  supply_list: 'Supply List',
  enrollment_form: 'Enrollment Form',
  other: 'Other',
};

const CATEGORY_COLORS = {
  school: 'bg-blue-100 text-blue-800',
  preschool: 'bg-purple-100 text-purple-800',
  both: 'bg-green-100 text-green-800',
};

export default function TeacherDocuments() {
  const location = useLocation();
  const { teacherId, loading: teacherLoading } = useTeacherId();
  const [templates, setTemplates] = useState([]);
  const [sentDocs, setSentDocs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sendTemplate, setSendTemplate] = useState(null);
  const [showBehaviorReport, setShowBehaviorReport] = useState(false);
  const [showSchoolBehaviorReport, setShowSchoolBehaviorReport] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const getNavUrl = (path) => {
    const base = `/${path}`;
    const teacherIdParam = new URLSearchParams(location.search).get('teacherId');
    return teacherIdParam ? `${base}?teacherId=${teacherIdParam}` : base;
  };

  useEffect(() => {
    if (teacherLoading) return;
    loadData();
  }, [teacherId, teacherLoading]);

  const loadData = async () => {
    setLoading(true);
    const [tmplData, docsData, studentsData] = await Promise.all([
      base44.entities.DocumentTemplate.filter({ is_active: true }, '-created_date', 100),
      base44.entities.StudentDocument.list('-created_date', 200),
      base44.entities.Student.filter({ enrollment_status: 'active' }, '', 200),
    ]);
    setTemplates(tmplData);
    setSentDocs(docsData);
    setStudents(studentsData);
    setLoading(false);
  };

  const filteredTemplates = templates.filter(t => {
    const matchSearch = !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
    // Hide admin-only templates from teachers
    const isAdminOnly = ['suspension_notice', 'enrollment_form'].includes(t.template_type);
    const isVisible = !isAdminOnly;
    return matchSearch && matchCat && isVisible;
  });

  const getStudentName = (id) => {
    const s = students.find(s => s.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
  };

  if (teacherLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-gray-600 mt-1">Send behavior reports and documents to students</p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent Documents ({sentDocs.length})</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="school">School (K-12)</SelectItem>
                <SelectItem value="preschool">Preschool</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No templates available</p>
                <p className="text-sm mt-1">Contact an administrator to create document templates.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-slate-600" />
                      </div>
                      <Badge className={CATEGORY_COLORS[template.category]}>
                        {template.category === 'school' ? '🏫 School' : template.category === 'preschool' ? '🧸 Preschool' : '📚 Both'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900">{template.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-1">{TEMPLATE_TYPE_LABELS[template.template_type]}</p>
                    {template.description && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{template.description}</p>
                    )}
                    <div className="flex gap-1 text-xs text-gray-500 mb-3">
                      {template.notify_parent && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">✉ Notifies Parent</span>}
                      {template.require_acknowledgment && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded">✋ Requires ACK</span>}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-slate-900 hover:bg-slate-800"
                      onClick={() => {
                        if (template.template_type === 'behavior_report') {
                          if (template.category === 'preschool') {
                            setShowBehaviorReport(true);
                          } else {
                            setShowSchoolBehaviorReport(true);
                          }
                        } else {
                          setSendTemplate(template);
                        }
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send to Student
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Documents Tab */}
        <TabsContent value="sent" className="mt-6">
          <div className="space-y-3">
            {sentDocs.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No documents sent yet</p>
                  <p className="text-sm mt-1">Use a template to send a document to a student.</p>
                </CardContent>
              </Card>
            ) : (
              sentDocs.map(doc => (
                <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDoc(doc)}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{doc.title}</div>
                          <div className="text-xs text-gray-500">
                            Student: {getStudentName(doc.student_id)} · By {doc.submitted_by_name || doc.submitted_by}
                            {doc.created_date && ` · ${new Date(doc.created_date).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.parent_acknowledged ? (
                          <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>
                        ) : doc.parent_notified ? (
                          <Badge className="bg-blue-100 text-blue-800">Notified</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">Submitted</Badge>
                        )}
                      </div>
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-gray-500 mt-2 ml-12">{doc.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SendDocumentModal
        open={!!sendTemplate}
        onOpenChange={open => { if (!open) setSendTemplate(null); }}
        template={sendTemplate}
        students={students}
        onSent={loadData}
      />
      <BehaviorReportModal
        open={showBehaviorReport}
        onOpenChange={setShowBehaviorReport}
        students={students}
        onSent={loadData}
      />
      <SchoolBehaviorReportModal
        open={showSchoolBehaviorReport}
        onOpenChange={setShowSchoolBehaviorReport}
        students={students}
        onSent={loadData}
      />
      <DocumentDetailModal
        doc={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
}