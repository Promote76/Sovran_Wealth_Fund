import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UserDetailModal } from '../components/admin/UserDetailModal';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';

interface User {
  userId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  accountStatus: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  
  // Registration Journey
  journeyId: number | null;
  currentStep: string | null;
  completedSteps: string[];
  hasPersonalProfile: boolean;
  hasFinancialProfile: boolean;
  hasRiskProfile: boolean;
  hasKycVerification: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  totalTimeSpent: number | null;
  lastActivityAt: string | null;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

const UnifiedRegistrationAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'analytics'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/unified-registration-admin/users?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Calculate progress percentage
  const calculateProgress = (user: User): number => {
    let completed = 1; // Account created
    const total = 5; // Total steps
    
    if (user.hasPersonalProfile) completed++;
    if (user.hasFinancialProfile) completed++;
    if (user.hasRiskProfile) completed++;
    if (user.isCompleted) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      case 'deactivated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get step badge color
  const getStepColor = (step: string | null) => {
    if (!step) return 'bg-gray-100 text-gray-800';
    switch (step) {
      case 'account_creation': return 'bg-blue-100 text-blue-800';
      case 'personal_profile': return 'bg-purple-100 text-purple-800';
      case 'financial_profile': return 'bg-indigo-100 text-indigo-800';
      case 'risk_profile': return 'bg-pink-100 text-pink-800';
      case 'program_selection': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format step name
  const formatStep = (step: string | null) => {
    if (!step) return 'Not Started';
    return step.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle user click
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            📊 Unified Registration Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage user registrations and track progress across all AXIOM programs
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 User Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📈 Analytics & Funnel
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'users' ? (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 items-center flex-wrap">
                  <div className="flex-1 min-w-[300px]">
                    <input
                      type="text"
                      placeholder="Search by email, name..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="lastLoginAt">Last Login</option>
                    <option value="email">Email</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                  <Button
                    onClick={fetchUsers}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    🔄 Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User List */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            )}

            {error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-red-600">
                    <p className="font-medium">Error loading users</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && !error && users.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <p className="font-medium">No users found</p>
                    <p className="text-sm mt-1">Try adjusting your search filters</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && !error && users.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Current Step</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Progress</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.userId}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleUserClick(user)}
                          >
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.email}
                                </p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.accountStatus)}`}>
                                {user.accountStatus}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStepColor(user.currentStep)}`}>
                                {formatStep(user.currentStep)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${calculateProgress(user)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 w-10">
                                  {calculateProgress(user)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUserClick(user);
                                }}
                                variant="outline"
                                className="text-sm"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {users.length} of {pagination.totalRecords} users
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={!pagination.hasPrevPage}
                        variant="outline"
                        className="text-sm"
                      >
                        Previous
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={!pagination.hasNextPage}
                        variant="outline"
                        className="text-sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <AnalyticsDashboard />
        )}

        {/* User Detail Modal */}
        {showDetailModal && selectedUser && (
          <UserDetailModal
            userId={selectedUser.userId}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedUser(null);
              fetchUsers(); // Refresh list after closing modal
            }}
          />
        )}
      </div>
    </div>
  );
};

export default UnifiedRegistrationAdminPage;
