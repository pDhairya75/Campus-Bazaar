import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Phone, Tag, Calendar, Package, Share2, Flag, Heart, HeartOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  images: string[];
  created_at: string;
  seller: {
    id: string;
    full_name: string;
    phone: string;
    rating: number;
  };
  category: {
    id: string;
    name: string;
  };
  campus: {
    id: string;
  };
}

interface RecommendedProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id || !UUID_REGEX.test(id)) {
      toast.error('Invalid product ID');
      navigate('/products');
      return;
    }
    fetchProduct();
    if (user) {
      checkFavoriteStatus();
    }
  }, [id, navigate, user]);

  useEffect(() => {
    if (product?.category?.id && product?.campus?.id) {
      fetchRecommendations();
    }
  }, [product]);

  async function checkFavoriteStatus() {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      // No error handling needed as maybeSingle returns null for no results
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }

  async function toggleFavorite() {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: id });

        if (error) throw error;
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Error updating favorites');
    }
  }

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(id, full_name, phone, rating),
          category:categories(id, name),
          campus:campuses(id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setProduct(data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Error fetching product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecommendations() {
    if (!product?.category?.id || !product?.campus?.id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, images, condition')
        .eq('category_id', product.category.id)
        .eq('campus_id', product.campus.id)
        .eq('status', 'available')
        .neq('id', product.id)
        .limit(3);

      if (error) throw error;
      setRecommendedProducts(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Don't show error toast for recommendations as it's not critical
    }
  }

  async function handleContactSeller() {
    if (!user) {
      toast.error('Please sign in to contact the seller');
      navigate('/auth');
      return;
    }

    if (!product) return;

    try {
      const { data: existingChats, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .eq('product_id', product.id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingChats) {
        navigate('/messages');
        return;
      }

      const { error: createError } = await supabase
        .from('chats')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller.id,
        });

      if (createError) throw createError;
      navigate('/messages');
    } catch (error) {
      console.error('Error managing chat:', error);
      toast.error('Error creating chat');
    }
  }

  async function handleShare() {
    try {
      await navigator.share({
        title: product?.title,
        text: `Check out ${product?.title} on Campus Bazaar`,
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !product) return;

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        product_id: product.id,
        reason: reportReason,
        description: reportDescription,
      });

      if (error) throw error;

      toast.success('Report submitted successfully');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Error submitting report');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <img
              src={product.images[selectedImage] || 'https://via.placeholder.com/600'}
              alt={product.title}
              className="w-full h-96 object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? 'border-indigo-600'
                      : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {product.title}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={toggleFavorite}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                >
                  {isFavorite ? (
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                  ) : (
                    <HeartOff className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
                >
                  <Flag className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-4xl font-bold text-indigo-600 mb-6">
              ${product.price}
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-5 w-5" />
                <span>{product.category.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="h-5 w-5" />
                <span>Condition: {product.condition}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span>
                  Listed {formatDistanceToNow(new Date(product.created_at))} ago
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-6">{product.description}</p>
            {user?.id !== product.seller.id && (
              <div className="flex gap-4">
                <button
                  onClick={handleContactSeller}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Message Seller
                </button>
                {product.seller.phone && (
                  <a
                    href={`tel:${product.seller.phone}`}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Phone className="h-5 w-5" />
                    Call Seller
                  </a>
                )}
              </div>
            )}
            
            {recommendedProducts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Similar Products</h2>
                <div className="grid grid-cols-3 gap-4">
                  {recommendedProducts.map((rec) => (
                    <Link
                      key={rec.id}
                      to={`/products/${rec.id}`}
                      className="bg-gray-50 rounded-lg p-2 hover:bg-gray-100"
                    >
                      <img
                        src={rec.images[0] || 'https://via.placeholder.com/150'}
                        alt={rec.title}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                      <h3 className="font-medium text-sm truncate">{rec.title}</h3>
                      <p className="text-indigo-600 font-semibold">${rec.price}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">About the Seller</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {product.seller.full_name}
                </p>
                {product.seller.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.round(product.seller.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 15.934l-6.18 3.254 1.18-6.875L.083 7.571l6.9-1.002L10 .333l3.017 6.236 6.9 1.002-4.917 4.742 1.18 6.875z"
                          />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({product.seller.rating.toFixed(1)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Report Product</h2>
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="fake">Fake Product</option>
                  <option value="spam">Spam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}