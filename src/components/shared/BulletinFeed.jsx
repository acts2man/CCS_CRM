import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Megaphone, Bell, Calendar, AlertTriangle } from "lucide-react";

const CATEGORY_META = {
  announcement: { label: "Announcement", color: "bg-blue-100 text-blue-800", icon: Megaphone },
  reminder: { label: "Reminder", color: "bg-yellow-100 text-yellow-800", icon: Bell },
  event: { label: "Event", color: "bg-green-100 text-green-800", icon: Calendar },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800", icon: AlertTriangle },
};

// audience: "all" | "parents" | "students"
export default function BulletinFeed({ audience }) {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBulletins();
  }, [audience]);

  const loadBulletins = async () => {
    setLoading(true);
    const all = await base44.entities.Bulletin.list("-created_date");
    const today = new Date().toISOString().split("T")[0];
    const filtered = all.filter(b => {
      if (!b.is_active) return false;
      if (b.expires_at && b.expires_at < today) return false;
      if (b.audience !== "all" && b.audience !== audience) return false;
      return true;
    });
    // Pinned first
    filtered.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
    setBulletins(filtered);
    setLoading(false);
  };

  if (loading) return <div className="text-sm text-gray-500 py-4">Loading bulletins...</div>;
  if (bulletins.length === 0) return (
    <div className="text-sm text-gray-400 py-6 text-center">No bulletins at this time.</div>
  );

  return (
    <div className="space-y-3">
      {bulletins.map(b => {
        const meta = CATEGORY_META[b.category] || CATEGORY_META.announcement;
        const Icon = meta.icon;
        return (
          <Card key={b.id} className={b.is_pinned ? 'border-blue-200 bg-blue-50/40' : ''}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {b.is_pinned && <Pin className="h-3.5 w-3.5 text-blue-500" />}
                    <span className="font-semibold text-gray-900 text-sm">{b.title}</span>
                    <Badge className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{b.body}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {b.posted_by_name || "School Admin"} · {new Date(b.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}