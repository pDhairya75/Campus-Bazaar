import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Campus Bazaar
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Buy and sell items within your campus community
        </p>
        <Link
          to="/products"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <ShoppingBag className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Easy Trading</h2>
          <p className="text-gray-600 dark:text-gray-300">
            List your items or find what you need within your campus community.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <MessageCircle className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Direct Communication</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Chat directly with buyers or sellers to arrange deals.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <Shield className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Safe & Secure</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Trade with verified students from your campus.
          </p>
        </div>
      </div>

      <div className="mt-16">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80"
          alt="Students at campus"
          className="w-full h-96 object-cover rounded-xl shadow-lg"
        />
      </div>
    </div>
  );
}