import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Send, Trash2, School, Baby, BookOpen, Loader2 } from 'lucide-react';
import CreateTemplateModal from '@/components/documents/CreateTemplateModal';
import SendDocumentModal from '@/components/documents/SendDocumentModal';
import AccidentReportModal from '@/components/documents/AccidentReportModal';
import BehaviorReportModal from '@/components/documents/BehaviorReportModal';
import SchoolBehaviorReportModal from '@/components/documents/SchoolBehaviorReportModal';
import { useToast } from '@/components/ui/use-toast';
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

export default function Documents() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [sentDocs, setSentDocs] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendTemplate, setSendTemplate] = useState(null);
  const [showAccidentReport, setShowAccidentReport] = useState(false);
  const [showBehaviorReport, setShowBehaviorReport] = useState(false);
  const [showSchoolBehaviorReport, setShowSchoolBehaviorReport] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [tmplData, docsData, studentsData, teachersData] = await Promise.all([
      base44.entities.DocumentTemplate.filter({ is_active: true }, '-created_date', 100),
      base44.entities.StudentDocument.list('-created_date', 200),
      base44.entities.Student.filter({ enrollment_status: 'active' }, '', 200),
      base44.entities.Teacher.filter({ status: 'Active' }, '', 100),
    ]);
    setTemplates(tmplData);
    setSentDocs(docsData);
    setStudents(studentsData);
    setTeachers(teachersData);
    setLoading(false);
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await base44.entities.DocumentTemplate.update(id, { is_active: false });
    await loadData();
    toast({ title: 'Template removed' });
  };

  const filteredTemplates = templates.filter(t => {
    const matchSearch = !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const getStudentName = (id) => {
    const s = students.find(s => s.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Document Library</h1>
          <p className="text-gray-600 mt-1">Manage templates and send documents to students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBehaviorReport(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Behavior Report Preschool
          </Button>
          <Button variant="outline" onClick={() => setShowSchoolBehaviorReport(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Behavior Report School
          </Button>
          <Button variant="outline" onClick={() => setShowAccidentReport(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Accident Report
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
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
                <p className="font-medium">No templates yet</p>
                <p className="text-sm mt-1">Create your first document template to get started.</p>
                <Button className="mt-4 bg-slate-900 hover:bg-slate-800" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create Template
                </Button>
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
                    <div className="flex gap-2">
                      <Button
                       size="sm"
                       className="flex-1 bg-slate-900 hover:bg-slate-800"
                       onClick={() => {
                         if (template.template_type === 'accident_report') {
                           setShowAccidentReport(true);
                         } else if (template.template_type === 'behavior_report') {
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      <CreateTemplateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={loadData}
      />
      <SendDocumentModal
        open={!!sendTemplate}
        onOpenChange={open => { if (!open) setSendTemplate(null); }}
        template={sendTemplate}
        students={students}
        onSent={loadData}
      />
      <AccidentReportModal
        open={showAccidentReport}
        onOpenChange={setShowAccidentReport}
        students={students}
        onSent={loadData}
      />
      <BehaviorReportModal
        open={showBehaviorReport}
        onOpenChange={setShowBehaviorReport}
        students={students}
        teachers={teachers}
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