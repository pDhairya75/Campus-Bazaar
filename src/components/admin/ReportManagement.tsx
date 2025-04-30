import React from 'react';
import { Flag, X } from 'lucide-react';
import { Report } from '../../types/admin';

interface ReportManagementProps {
  reports: Report[];
  selectedReport: Report | null;
  showReportModal: boolean;
  onSelectReport: (report: Report) => void;
  onCloseModal: () => void;
  onUpdateReportStatus: (reportId: string, status: 'resolved' | 'dismissed') => Promise<void>;
}

export default function ReportManagement({
  reports,
  selectedReport,
  showReportModal,
  onSelectReport,
  onCloseModal,
  onUpdateReportStatus,
}: ReportManagementProps) {
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Report Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
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
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {report.product.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        by {report.product.seller.full_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {report.reporter.full_name}
                      </div>
                      <div className="text-gray-500">{report.reporter.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.reason}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : report.status === 'dismissed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onSelectReport(report)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Flag className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Report Details</h2>
              <button
                onClick={onCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Product</h3>
                <p className="mt-1">{selectedReport.product.title}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Seller</h3>
                <p className="mt-1">{selectedReport.product.seller.full_name}</p>
                <p className="text-sm text-gray-500">{selectedReport.product.seller.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reporter</h3>
                <p className="mt-1">{selectedReport.reporter.full_name}</p>
                <p className="text-sm text-gray-500">{selectedReport.reporter.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reason</h3>
                <p className="mt-1">{selectedReport.reason}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{selectedReport.description}</p>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => onUpdateReportStatus(selectedReport.id, 'dismissed')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => onUpdateReportStatus(selectedReport.id, 'resolved')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}