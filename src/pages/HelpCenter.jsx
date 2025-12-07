import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Book, MessageCircle, Mail, FileText } from 'lucide-react';

export default function HelpCenter() {
  const helpCategories = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse comprehensive guides and documentation',
      color: 'bg-blue-500'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat Support',
      description: 'Chat with our support team in real-time',
      color: 'bg-green-500'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      color: 'bg-purple-500'
    },
    {
      icon: FileText,
      title: 'FAQ',
      description: 'Find answers to frequently asked questions',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-gray-600 text-lg mb-8">How can we help you today?</p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles..."
              className="pl-12 py-6 text-lg"
            />
          </div>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {helpCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`${category.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="mb-2">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Contact Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle>Still need help?</CardTitle>
            <CardDescription>
              Our support team is available Monday-Friday, 9AM-5PM EST
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Live Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}