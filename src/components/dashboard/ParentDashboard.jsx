import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BookOpen, DollarSign, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ParentDashboard() {
  const [stats, setStats] = useState({
    myChildren: 0,
    upcomingAssignments: 0,
    pendingPayments: 0,
    unreadMessages: 0
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [childrenData, setChildrenData] = useState([]);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Find parent record by email
      const parents = await base44.entities.Parent.filter({ email: currentUser.email });
      if (parents.length > 0) {
        const parent = parents[0];
        const studentIds = parent.student_ids || [];

        // Get students, charges, and assignments
        const [allStudents, charges, assignments] = await Promise.all([
          base44.entities.Student.list(),
          base44.entities.Charge.list(),
          base44.entities.Assignment.list()
        ]);

        const myChildren = allStudents.filter(s => studentIds.includes(s.id));
        const pendingCharges = charges.filter(c => 
          c.status === 'unpaid' && studentIds.includes(c.student_id)
        );

        setChildrenData(myChildren);
        setStats({
          myChildren: myChildren.length,
          upcomingAssignments: assignments.length,
          pendingPayments: pendingCharges.length,
          unreadMessages: 0
        });
      }
    } catch (error) {
      console.error("Error loading parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "My Children", value: stats.myChildren, icon: Users, color: "text-blue-600", link: "Students" },
    { title: "Upcoming Events", value: stats.upcomingEvents, icon: Calendar, color: "text-green-600", link: "Calendar" },
    { title: "Pending Payments", value: stats.pendingPayments, icon: DollarSign, color: "text-orange-600", link: "Finance" },
    { title: "Unread Messages", value: stats.unreadMessages, icon: BookOpen, color: "text-purple-600", link: "Chat" }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome, {user?.full_name || user?.email}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? "..." : stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to={createPageUrl("Students")}>
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">View Children's Profiles</div>
                <div className="text-sm text-gray-600">See grades and attendance</div>
              </button>
            </Link>
            <Link to={createPageUrl("Finance")}>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Make Payment</div>
                <div className="text-sm text-gray-600">Pay tuition and fees</div>
              </button>
            </Link>
            <Link to={createPageUrl("Chat")}>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">Message Teachers</div>
                <div className="text-sm text-gray-600">Communicate with staff</div>
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              No new announcements.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}