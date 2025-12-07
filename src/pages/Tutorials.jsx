import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Play } from 'lucide-react';

export default function Tutorials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const tutorials = [
    {
      id: 1,
      title: 'Getting Started with the CRM',
      description: 'Learn the basics of navigating and using the CRM system',
      duration: '5:30',
      category: 'Basics',
      categoryColor: 'bg-blue-500',
      addedDate: '2/28/2025',
      thumbnail: ''
    },
    {
      id: 2,
      title: 'Managing Student Records',
      description: 'How to add, edit, and organize student information efficiently',
      duration: '8:45',
      category: 'Records',
      categoryColor: 'bg-purple-500',
      addedDate: '1/4/2025',
      thumbnail: ''
    },
    {
      id: 3,
      title: 'Using the Grading System',
      description: 'A complete walkthrough of the grading system features',
      duration: '12:15',
      category: 'Teaching',
      categoryColor: 'bg-green-500',
      addedDate: '3/9/2025',
      thumbnail: ''
    },
    {
      id: 4,
      title: 'Attendance Tracking',
      description: 'How to record and manage daily attendance',
      duration: '7:20',
      category: 'Teaching',
      categoryColor: 'bg-green-500',
      addedDate: '3/14',
      thumbnail: ''
    },
    {
      id: 5,
      title: 'Communication Tools',
      description: 'Using email, chat, and messaging features to communicate with parents',
      duration: '9:00',
      category: 'Communication',
      categoryColor: 'bg-orange-500',
      addedDate: '3/15/2025',
      thumbnail: ''
    },
    {
      id: 6,
      title: 'Financial Management',
      description: 'Overview of billing, payments, and financial reporting',
      duration: '12:30',
      category: 'Admin',
      categoryColor: 'bg-pink-500',
      addedDate: '3/26/2025',
      thumbnail: ''
    }
  ];

  const categories = ['All Categories', 'Basics', 'Records', 'Teaching', 'Communication', 'Admin'];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Tutorials</h1>
          <p className="text-gray-600">Learn how to use the CRM system with these helpful video guides</p>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.slice(1).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tutorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gray-200 flex items-center justify-center">
                <Play className="h-12 w-12 text-gray-400" />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {tutorial.duration}
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                  <Badge className={`${tutorial.categoryColor} text-white whitespace-nowrap`}>
                    {tutorial.category}
                  </Badge>
                </div>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Added on {tutorial.addedDate}</span>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Play className="h-3 w-3" />
                    Watch Tutorial
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTutorials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tutorials found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}