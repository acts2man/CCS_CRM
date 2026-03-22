import React from "react";
import BulletinFeed from "@/components/shared/BulletinFeed";
import { Megaphone } from "lucide-react";

export default function ParentBulletin() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulletin Board</h1>
          <p className="text-gray-500 mt-0.5">Announcements and updates from the school</p>
        </div>
      </div>
      <BulletinFeed audience="parents" />
    </div>
  );
}