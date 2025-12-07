import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Search, Plus, Copy, MoreVertical, Eye, Edit, PowerOff } from 'lucide-react';
import { format } from 'date-fns';

export default function FinancePaymentLinksTab() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: paymentLinks = [], isLoading } = useQuery({
    queryKey: ['payment-links'],
    queryFn: () => base44.entities.PaymentLink.list('-created_date'),
  });

  const filteredLinks = paymentLinks.filter(link =>
    link.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    // Show toast notification
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Payment Links</h2>
          <p className="text-sm text-gray-500">Create and manage your Payment Links</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create New Payment Link
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search payment links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Payment Links Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left text-sm text-gray-500">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Link URL</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Created At</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No payment links found. Create your first payment link to get started.
                  </td>
                </tr>
              ) : (
                filteredLinks.map(link => (
                  <tr key={link.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-medium">{link.name}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 truncate max-w-xs">
                          {link.link_url || `https://pay.example.com/${link.link_id}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyLink(link.link_url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={link.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {link.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium">
                      ${link.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {format(new Date(link.created_date), 'MMM dd, yyyy h:mm a')}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyLink(link.link_url)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PowerOff className="h-4 w-4 mr-2" />
                            {link.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}