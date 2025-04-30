import React from 'react';
import { Ban, CheckCircle, AlertOctagon } from 'lucide-react';
import { Product } from '../../types/admin';

interface ProductManagementProps {
  products: Product[];
  onUpdateProductStatus: (productId: string, status: 'active' | 'suspended' | 'under_review') => Promise<void>;
}

export default function ProductManagement({ products, onUpdateProductStatus }: ProductManagementProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Product Moderation</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {product.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${product.price}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {product.seller.full_name}
                    </div>
                    <div className="text-gray-500">{product.seller.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.moderation_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : product.moderation_status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {product.moderation_status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {product.moderation_status !== 'active' && (
                      <button
                        onClick={() => onUpdateProductStatus(product.id, 'active')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    {product.moderation_status !== 'under_review' && (
                      <button
                        onClick={() => onUpdateProductStatus(product.id, 'under_review')}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        <AlertOctagon className="h-5 w-5" />
                      </button>
                    )}
                    {product.moderation_status !== 'suspended' && (
                      <button
                        onClick={() => onUpdateProductStatus(product.id, 'suspended')}
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