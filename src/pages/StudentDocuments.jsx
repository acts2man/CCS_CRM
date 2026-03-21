import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink } from "lucide-react";
import { useImpersonation } from "@/lib/ImpersonationContext";
import DocumentDetailModal from "@/components/students/DocumentDetailModal";
import { getStudentByUserEmail } from "@/lib/entitySyncUtils";

export default function StudentDocuments() {
  const { impersonatedStudent } = useImpersonation();
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [impersonatedStudent]);

  const loadDocuments = async () => {
    try {
      let studentId;
      
      if (impersonatedStudent) {
        studentId = impersonatedStudent.id;
      } else {
        const user = await base44.auth.me();
        const { student, error } = await getStudentByUserEmail(user.email);
        if (error || !student) {
          console.error("Student sync error:", error);
          setLoading(false);
          return;
        }
        studentId = student.id;
      }
      
      // Get documents for this student
      const allDocs = await base44.entities.StudentDocument.filter({
        student_id: studentId
      });

      setDocuments(allDocs);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">View documents shared with you</p>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents shared yet.</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card 
              key={doc.id} 
              className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
              onClick={() => setSelectedDocument(doc)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                    </div>
                    {doc.submitted_by_name && (
                      <p className="text-sm text-gray-600">From: {doc.submitted_by_name}</p>
                    )}
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedDocument && (
        <DocumentDetailModal 
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}