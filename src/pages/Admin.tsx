import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, ShoppingBag, MessageCircle, AlertTriangle, School, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import UserManagement from '../components/admin/UserManagement';
import ProductManagement from '../components/admin/ProductManagement';
import ReportManagement from '../components/admin/ReportManagement';
import type { Stats, Campus, User, Product, Report } from '../types/admin';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'reports'>('overview');
  const [stats, setStats] = useState<Stats>({
    users: 0,
    products: 0,
    chats: 0,
    reports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [newCampus, setNewCampus] = useState({ name: '', location: '' });
  const [showAddCampus, setShowAddCampus] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
    fetchCampuses();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  async function checkAdminAccess() {
    if (!user) {
      toast.error('Please sign in to access admin dashboard');
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }
  }

  async function fetchStats() {
    const [users, products, chats, reports] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('products').select('id', { count: 'exact' }),
      supabase.from('chats').select('id', { count: 'exact' }),
      supabase.from('reports').select('id', { count: 'exact' }),
    ]);

    setStats({
      users: users.count || 0,
      products: products.count || 0,
      chats: chats.count || 0,
      reports: reports.count || 0,
    });
    setLoading(false);
  }

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching users');
    } else {
      setUsers(data || []);
    }
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        moderation_status,
        created_at,
        seller:profiles (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching products');
    } else {
      setProducts(data || []);
    }
  }

  async function fetchReports() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        reporter:profiles!reporter_id (
          full_name,
          email
        ),
        product:products (
          id,
          title,
          seller:profiles (
            full_name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching reports');
    } else {
      setReports(data || []);
    }
  }

  async function handleUpdateUserStatus(userId: string, status: 'active' | 'banned' | 'suspended') {
    try {
      const { error } = await supabase.rpc('admin_update_user_status', {
        user_id: userId,
        new_status: status
      });

      if (error) throw error;
      toast.success(`User ${status} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error updating user status');
    }
  }

  async function handleUpdateProductStatus(productId: string, status: 'active' | 'suspended' | 'under_review') {
    try {
      const { error } = await supabase.rpc('admin_update_product_status', {
        product_id: productId,
        new_status: status
      });

      if (error) throw error;
      toast.success(`Product ${status} successfully`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Error updating product status');
    }
  }

  async function handleUpdateReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
    try {
      const { error } = await supabase.rpc('admin_update_report_status', {
        report_id: reportId,
        new_status: status
      });

      if (error) throw error;
      toast.success(`Report marked as ${status}`);
      setShowReportModal(false);
      fetchReports();
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Error updating report status');
    }
  }

  async function fetchCampuses() {
    const { data, error } = await supabase
      .from('campuses')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error('Error fetching campuses');
    } else {
      setCampuses(data || []);
    }
  }

  async function handleAddCampus(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampus.name || !newCampus.location) {
      toast.error('Please fill in all fields');
      return;
    }

    const { error } = await supabase
      .from('campuses')
      .insert([newCampus]);

    if (error) {
      toast.error('Error adding campus');
    } else {
      toast.success('Campus added successfully');
      setNewCampus({ name: '', location: '' });
      setShowAddCampus(false);
      fetchCampuses();
    }
  }

  async function handleDeleteCampus(id: string) {
    const { error } = await supabase
      .from('campuses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error deleting campus');
    } else {
      toast.success('Campus deleted successfully');
      fetchCampuses();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4">
                <ShoppingBag className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold">{stats.products}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Chats</p>
                  <p className="text-2xl font-bold">{stats.chats}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Reports</p>
                  <p className="text-2xl font-bold">{stats.reports}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Campus Management</h2>
              <button
                onClick={() => setShowAddCampus(!showAddCampus)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5" />
                Add Campus
              </button>
            </div>

            {showAddCampus && (
              <form onSubmit={handleAddCampus} className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Campus Name</label>
                    <input
                      type="text"
                      value={newCampus.name}
                      onChange={(e) => setNewCampus({ ...newCampus, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={newCampus.location}
                      onChange={(e) => setNewCampus({ ...newCampus, location: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCampus(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Add Campus
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campuses.map((campus) => (
                <div key={campus.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <School className="h-5 w-5 text-indigo-600 mt-1" />
                      <div>
                        <h3 className="font-semibold">{campus.name}</h3>
                        <p className="text-sm text-gray-600">{campus.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCampus(campus.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <UserManagement
          users={users}
          onUpdateUserStatus={handleUpdateUserStatus}
        />
      )}

      {activeTab === 'products' && (
        <ProductManagement
          products={products}
          onUpdateProductStatus={handleUpdateProductStatus}
        />
      )}

      {activeTab === 'reports' && (
        <ReportManagement
          reports={reports}
          selectedReport={selectedReport}
          showReportModal={showReportModal}
          onSelectReport={(report) => {
            setSelectedReport(report);
            setShowReportModal(true);
          }}
          onCloseModal={() => {
            setShowReportModal(false);
            setSelectedReport(null);
          }}
          onUpdateReportStatus={handleUpdateReportStatus}
        />
      )}
    </div>
  );
}