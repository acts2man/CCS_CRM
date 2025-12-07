import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const useDocuments = () => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const docs = await base44.entities.Document.list('-created_date', 500);
      
      // Fetch related student data for each document
      const docsWithStudents = await Promise.all(
        docs.map(async (doc) => {
          if (doc.student_id) {
            try {
              const students = await base44.entities.Student.filter({ id: doc.student_id }, '', 1);
              const student = students[0];
              return {
                ...doc,
                students: student ? {
                  id: student.id,
                  first_name: student.first_name,
                  last_name: student.last_name,
                  grade: student.grade_level
                } : null
              };
            } catch (err) {
              console.error('Error fetching student for document:', err);
              return doc;
            }
          }
          return doc;
        })
      );
      
      return docsWithStudents;
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, metadata }) => {
      // Step 1: Upload file to Base44
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Step 2: Create document record
      const documentData = {
        title: metadata.title,
        description: metadata.description,
        file_url: file_url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        category: metadata.category,
        student_id: metadata.student_id,
        class_id: metadata.class_id,
        is_public: metadata.is_public || false,
        shared_with: metadata.shared_with || []
      };

      const result = await base44.entities.Document.create(documentData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      console.log('✅ Document uploaded successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to upload document:', error);
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Document.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      console.log('✅ Document deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete document:', error);
    }
  });

  const uploadDocument = (file, metadata) => {
    return uploadDocumentMutation.mutateAsync({ file, metadata });
  };

  const deleteDocument = (id) => {
    return deleteDocumentMutation.mutateAsync(id);
  };

  return {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    isUploading: uploadDocumentMutation.isPending,
  };
};