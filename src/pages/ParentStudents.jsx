import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getParentByUserEmail, getStudentsForParent } from "@/lib/entitySyncUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, GraduationCap } from "lucide-react";

export default function ParentStudents() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const user = await base44.auth.me();
      const { parent } = await getParentByUserEmail(user.email);
      if (!parent) { setLoading(false); return; }
      const { students } = await getStudentsForParent(parent.id);
      setChildren(students);
    } catch (error) {
      console.error("Error loading children:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'inactive') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-600 mt-1">Profiles for all your children</p>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No students linked to your account yet.</p>
            <p className="text-sm text-gray-400 mt-1">Please contact the school to link your children.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map(child => (
            <Card key={child.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      {child.photo_url ? (
                        <img src={child.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">
                        {child.first_name} {child.last_name}
                      </h2>
                      <p className="text-sm text-gray-500">Grade {child.grade_level}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(child.enrollment_status)}>
                    {child.enrollment_status || 'active'}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 gap-3 pt-2 border-t">
                  {child.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{child.email}</span>
                    </div>
                  )}
                  {child.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{child.phone}</span>
                    </div>
                  )}
                  {child.date_of_birth && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">
                        {new Date(child.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {child.enrollment_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">
                        Enrolled {new Date(child.enrollment_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {child.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{child.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}