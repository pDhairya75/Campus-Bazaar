import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag, MessageCircle, User, LogOut, Shield } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  async function checkAdminStatus() {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single();
    
    setIsAdmin(!!data?.is_admin);
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <ShoppingBag className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              Campus Bazaar
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/products"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Products
                </Link>
                <Link
                  to="/messages"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <MessageCircle className="h-6 w-6" />
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <User className="h-6 w-6" />
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Shield className="h-6 w-6" />
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Sign In
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}