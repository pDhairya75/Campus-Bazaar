import React from 'react';
import { Ban, CheckCircle, AlertOctagon } from 'lucide-react';
import { User } from '../../types/admin';

interface UserManagementProps {
  users: User[];
  onUpdateUserStatus: (userId: string, status: 'active' | 'banned' | 'suspended') => Promise<void>;
}

export default function UserManagement({ users, onUpdateUserStatus }: UserManagementProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">User Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.full_name || 'Unnamed User'}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'banned'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {user.status !== 'active' && (
                      <button
                        onClick={() => onUpdateUserStatus(user.id, 'active')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    {user.status !== 'suspended' && (
                      <button
                        onClick={() => onUpdateUserStatus(user.id, 'suspended')}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        <AlertOctagon className="h-5 w-5" />
                      </button>
                    )}
                    {user.status !== 'banned' && (
                      <button
                        onClick={() => onUpdateUserStatus(user.id, 'banned')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Ban className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}