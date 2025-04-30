import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Filter, School, Search, SlidersHorizontal, Heart, HeartOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  created_at: string;
  condition: string;
  category: { name: string };
  seller: { 
    full_name: string;
    campus: {
      name: string;
    };
  };
  campus: {
    name: string;
  };
}

interface Profile {
  campus_id: string | null;
  campus: {
    name: string;
  } | null;
}

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [selectedCondition, setSelectedCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchFavorites();
    }
    fetchCategories();
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      fetchProducts();
    }
  }, [selectedCategory, userProfile, searchQuery, priceRange, selectedCondition, sortBy]);

  async function fetchUserProfile() {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('campus_id, campus:campuses(name)')
      .eq('id', user?.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error fetching profile');
    } else {
      setUserProfile(profile);
    }
  }

  async function fetchFavorites() {
    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      setFavorites(data.map(f => f.product_id));
    }
  }

  async function toggleFavorite(productId: string) {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    const isFavorited = favorites.includes(productId);
    
    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        toast.error('Error removing from favorites');
      } else {
        setFavorites(favorites.filter(id => id !== productId));
        toast.success('Removed from favorites');
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId });

      if (error) {
        toast.error('Error adding to favorites');
      } else {
        setFavorites([...favorites, productId]);
        toast.success('Added to favorites');
      }
    }
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  }

  async function fetchProducts() {
    if (!userProfile?.campus_id) {
      toast.error('Please select your campus in your profile first');
      setProducts([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(name),
        seller:profiles!inner(
          full_name,
          campus:campuses(name)
        ),
        campus:campuses(name)
      `)
      .eq('status', 'available')
      .eq('campus_id', userProfile.campus_id);

    // Apply filters
    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    if (priceRange.min) {
      query = query.gte('price', parseFloat(priceRange.min));
    }

    if (priceRange.max) {
      query = query.lte('price', parseFloat(priceRange.max));
    }

    if (selectedCondition) {
      query = query.eq('condition', selectedCondition);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      toast.error('Error fetching products');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userProfile?.campus_id) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <School className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Campus Selected</h2>
          <p className="text-gray-600 mb-4">
            Please select your campus in your profile to view products available at your campus.
          </p>
          <Link
            to="/profile"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Update Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Showing products at {userProfile.campus?.name}
          </p>
        </div>
        <Link
          to="/products/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          List Item
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Any Condition</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h2>
          <p className="text-gray-600">
            Try adjusting your filters or search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <Link to={`/products/${product.id}`}>
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={product.images[0] || 'https://via.placeholder.com/300'}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {product.title}
                  </h2>
                  <p className="text-2xl font-bold text-indigo-600 mb-2">
                    ${product.price}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{product.category.name}</span>
                    <span>{formatDistanceToNow(new Date(product.created_at))} ago</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Condition: {product.condition}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Seller: {product.seller.full_name}
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(product.id);
                }}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
              >
                {favorites.includes(product.id) ? (
                  <Heart className="h-5 w-5 text-red-500 fill-current" />
                ) : (
                  <HeartOff className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}