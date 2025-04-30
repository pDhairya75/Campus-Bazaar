import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, Star, Phone, School, Link as LinkIcon, Camera, CheckCircle, MessageCircle, Tag, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Profile {
  id: string;
  full_name: string | null;
  student_id: string | null;
  phone: string | null;
  rating: number;
  bio: string | null;
  avatar_url: string | null;
  social_links: { [key: string]: string };
  is_verified: boolean;
  campus: {
    name: string;
  } | null;
  campus_id: string | null;
}

interface Transaction {
  id: string;
  type: 'sale' | 'purchase';
  product: {
    title: string;
    price: number;
    images: string[];
  };
  created_at: string;
  status: string;
  rating: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    full_name: string;
    avatar_url: string | null;
  };
  categories: {
    communication: number;
    accuracy: number;
    value: number;
  };
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    student_id: '',
    phone: '',
    bio: '',
    social_links: {
      instagram: '',
      twitter: '',
      linkedin: '',
    },
  });
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews' | 'transactions'>('listings');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [averageRatings, setAverageRatings] = useState({
    overall: 0,
    communication: 0,
    accuracy: 0,
    value: 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTransactions();
      fetchReviews();
      fetchCampuses();
    }
  }, [user]);

  async function fetchProfile() {
    if (!user) return;

    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*, campus:campuses(name)')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        toast.error('Error fetching profile');
        return;
      }

      if (existingProfile) {
        setProfile(existingProfile);
        setFormData({
          full_name: existingProfile.full_name || '',
          student_id: existingProfile.student_id || '',
          phone: existingProfile.phone || '',
          bio: existingProfile.bio || '',
          social_links: existingProfile.social_links || {
            instagram: '',
            twitter: '',
            linkedin: '',
          },
        });
        setSelectedCampus(existingProfile.campus_id);
      } else {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert([{ id: user.id }])
          .select('*, campus:campuses(name)')
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast.error('Error creating profile');
          return;
        }

        setProfile(newProfile);
        setFormData({
          full_name: newProfile.full_name || '',
          student_id: newProfile.student_id || '',
          phone: newProfile.phone || '',
          bio: newProfile.bio || '',
          social_links: newProfile.social_links || {
            instagram: '',
            twitter: '',
            linkedin: '',
          },
        });
        setSelectedCampus(newProfile.campus_id);
      }
    } catch (error) {
      console.error('Error in profile management:', error);
      toast.error('Error managing profile');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransactions() {
    const { data: sales, error: salesError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        images,
        created_at,
        status,
        rating
      `)
      .eq('seller_id', user?.id);

    const { data: purchases, error: purchasesError } = await supabase
      .from('chats')
      .select(`
        id,
        created_at,
        product:products(
          id,
          title,
          price,
          images,
          status
        )
      `)
      .eq('buyer_id', user?.id);

    if (salesError || purchasesError) {
      console.error('Error fetching transactions:', salesError || purchasesError);
      toast.error('Error loading transactions');
      return;
    }

    const formattedTransactions = [
      ...(sales?.map(sale => ({
        id: sale.id,
        type: 'sale' as const,
        product: {
          title: sale.title,
          price: sale.price,
          images: sale.images,
        },
        created_at: sale.created_at,
        status: sale.status,
        rating: sale.rating,
      })) || []),
      ...(purchases?.map(purchase => ({
        id: purchase.id,
        type: 'purchase' as const,
        product: purchase.product,
        created_at: purchase.created_at,
        status: purchase.product.status,
        rating: null,
      })) || []),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setTransactions(formattedTransactions);
  }

  async function fetchReviews() {
    const { data, error } = await supabase
      .rpc('get_user_reviews', { user_id: user?.id })
      .select();

    if (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Error loading reviews');
      return;
    }

    const formattedReviews = data?.map(review => ({
      ...review,
      reviewer: {
        full_name: review.reviewer_name,
        avatar_url: review.reviewer_avatar
      }
    })) || [];

    setReviews(formattedReviews);

    if (formattedReviews.length > 0) {
      const totals = formattedReviews.reduce(
        (acc, review) => ({
          overall: acc.overall + review.rating,
          communication: acc.communication + (review.categories?.communication || 0),
          accuracy: acc.accuracy + (review.categories?.accuracy || 0),
          value: acc.value + (review.categories?.value || 0),
        }),
        { overall: 0, communication: 0, accuracy: 0, value: 0 }
      );

      setAverageRatings({
        overall: totals.overall / formattedReviews.length,
        communication: totals.communication / formattedReviews.length,
        accuracy: totals.accuracy / formattedReviews.length,
        value: totals.value / formattedReviews.length,
      });
    }
  }

  async function fetchCampuses() {
    const { data, error } = await supabase.from('campuses').select('*');
    if (error) {
      console.error('Error fetching campuses:', error);
      toast.error('Error fetching campuses');
    } else if (data) {
      setCampuses(data);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setAvatarFile(file);
  }

  async function uploadAvatar() {
    if (!avatarFile || !user) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      toast.error('Error uploading avatar');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    let avatarUrl = profile?.avatar_url;
    if (avatarFile) {
      avatarUrl = await uploadAvatar();
      if (!avatarUrl) return;
    }

    const updateData = {
      ...formData,
      campus_id: selectedCampus || null,
      avatar_url: avatarUrl,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user?.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } else {
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || ''}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {editing && (
                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profile?.full_name || 'Complete Your Profile'}
                </h1>
                {profile?.is_verified && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>
              {profile?.rating > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {profile.rating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Student ID
              </label>
              <input
                type="text"
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Campus
              </label>
              <select
                value={selectedCampus || ''}
                onChange={(e) => setSelectedCampus(e.target.value || null)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select a campus</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.social_links.instagram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          instagram: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={formData.social_links.twitter}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          twitter: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={formData.social_links.linkedin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          linkedin: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="profile-url"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {profile?.bio && (
              <p className="text-gray-600 dark:text-gray-300">{profile.bio}</p>
            )}
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {profile?.campus?.name || 'No campus selected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {profile?.phone || 'No phone number'}
              </span>
            </div>
            {Object.entries(profile?.social_links || {}).some(
              ([_, value]) => value
            ) && (
              <div className="flex gap-4">
                {profile?.social_links?.instagram && (
                  <a
                    href={`https://instagram.com/${profile.social_links.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </a>
                )}
                {profile?.social_links?.twitter && (
                  <a
                    href={`https://twitter.com/${profile.social_links.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </a>
                )}
                {profile?.social_links?.linkedin && (
                  <a
                    href={profile.social_links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'listings'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Listings
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Transactions
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'listings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transactions
                .filter((t) => t.type === 'sale')
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden"
                  >
                    <img
                      src={
                        transaction.product.images[0] ||
                        'https://via.placeholder.com/300'
                      }
                      alt={transaction.product.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {transaction.product.title}
                      </h3>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                        ${transaction.product.price}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span
                          className={`px-2 py-1 rounded-full ${
                            transaction.status === 'available'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : transaction.status === 'sold'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {transaction.status.charAt(0).toUpperCase() +
                            transaction.status.slice(1)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {reviews.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Overall
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {averageRatings.overall.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Communication
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {averageRatings.communication.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Accuracy
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {averageRatings.accuracy.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Value
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {averageRatings.value.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {review.reviewer.avatar_url ? (
                              <img
                                src={review.reviewer.avatar_url}
                                alt={review.reviewer.full_name}
                                className="w-12 h-12 rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {review.reviewer.full_name}
                              </h3>
                              <div className="flex items-center">
                                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                <span className="ml-1 text-gray-600 dark:text-gray-300">
                                  {review.rating}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                              {review.comment}
                            </p>
                            <div className="mt-4 grid grid-cols-3 gap-4">
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Communication
                                </span>
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="ml-1 text-gray-600 dark:text-gray- 300">
                                    {review.categories.communication}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Accuracy
                                </span>
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="ml-1 text-gray-600 dark:text-gray-300">
                                    {review.categories.accuracy}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Value
                                </span>
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="ml-1 text-gray-600 dark:text-gray-300">
                                    {review.categories.value}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Reviews Yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Complete some transactions to start receiving reviews
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center gap-4"
                  >
                    <img
                      src={
                        transaction.product.images[0] ||
                        'https://via.placeholder.com/100'
                      }
                      alt={transaction.product.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {transaction.product.title}
                          </h3>
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            ${transaction.product.price}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            transaction.status === 'available'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : transaction.status === 'sold'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {transaction.type === 'sale' ? 'Sold' : 'Purchased'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </span>
                        {transaction.rating ? (
                          <div className="flex items-center">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            <span className="ml-1 text-gray-600 dark:text-gray-300">
                              {transaction.rating}
                            </span>
                          </div>
                        ) : (
                          <button className="text-indigo-600 dark:text-indigo-400 text-sm hover:text-indigo-700 dark:hover:text-indigo-300">
                            Leave a Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Transactions Yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Start buying or selling items to see your transactions here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}