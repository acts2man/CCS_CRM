import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare, User, MapPin, AlertCircle, Send } from "lucide-react";

export default function ContactCard({ student, parents, onEmailClick, onSMSClick }) {
  const handleCall = (phone) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  if (!parents || parents.length === 0) {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">No Contact Information</h3>
              <p className="text-sm text-gray-600">
                No parent or guardian information has been added for this student. 
                Please add parent details in the Parents tab.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Contacts */}
      <div>
        <h3 className="text-lg font-bold mb-3">Primary Contacts</h3>
        <div className="space-y-3">
          {parents.filter(p => p.is_primary_contact).length === 0
            ? parents.map((parent) => (
                <ContactItem key={parent.id} parent={parent} onCall={handleCall} onEmailClick={onEmailClick} onSMSClick={onSMSClick} />
              ))
            : parents.filter(p => p.is_primary_contact).map((parent) => (
                <ContactItem key={parent.id} parent={parent} onCall={handleCall} onEmailClick={onEmailClick} onSMSClick={onSMSClick} />
              ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      {student.emergency_contact_name && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Emergency Contact
                </h3>
                <div className="ml-6 space-y-2">
                  <div className="font-semibold text-gray-900">{student.emergency_contact_name}</div>
                  {student.emergency_contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-red-600" />
                      <span className="font-mono text-gray-800">{student.emergency_contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>
              {student.emergency_contact_phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 hover:bg-red-100"
                  onClick={() => handleCall(student.emergency_contact_phone)}
                >
                  <Phone className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authorized Pickup Contacts */}
      {parents && parents.some(p => p.can_pickup) && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="pt-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Authorized for Pickup
            </h3>
            <div className="space-y-2 ml-6">
              {parents.filter(p => p.can_pickup).map((parent) => (
                <div key={parent.id} className="text-sm">
                  <div className="font-semibold text-gray-900">{parent.first_name} {parent.last_name}</div>
                  <div className="text-xs text-gray-600">{parent.relationship || 'Parent/Guardian'}</div>
                  {parent.phone && (
                    <div className="text-xs text-gray-700 font-mono mt-1">{parent.phone}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContactItem({ parent, onCall, onEmailClick, onSMSClick }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{parent.first_name} {parent.last_name}</h4>
              {parent.is_primary_contact && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">Primary</Badge>
              )}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              {parent.relationship || 'Parent/Guardian'}
              {parent.occupation && ` · ${parent.occupation}`}
            </div>

            <div className="space-y-2">
              {parent.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-gray-700">{parent.phone}</span>
                </div>
              )}
              {parent.alternate_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-gray-700 text-xs">Alt: {parent.alternate_phone}</span>
                </div>
              )}
              {parent.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 truncate">{parent.email}</span>
                </div>
              )}
              {parent.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{parent.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {parent.phone && (
              <Button
                size="sm"
                variant="outline"
                title="Call parent"
                onClick={() => window.open(`tel:${parent.phone}`)}
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            {parent.email && (
              <Button
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
                title="Send email"
                onClick={() => onEmailClick && onEmailClick(parent)}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            {parent.phone && (
              <Button
                size="sm"
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-600"
                title="Send SMS"
                onClick={() => onSMSClick && onSMSClick(parent)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}