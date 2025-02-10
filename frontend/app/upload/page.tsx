'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUpload } from 'react-icons/fi';

interface ValidationSummary {
  missing_discounts: number;
  govt_transactions: number;
  duplicate_transactions: number;
  total_columns: number;
  available_columns: string[];
}

type ColumnValue = string | number | null;

interface UploadedData {
  [key: string]: ColumnValue;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Add state for filters
  const [filters, setFilters] = useState({
    product: '',
    date: '',
    transactionType: '',
    customer: ''
  });

  // Fetch existing data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/data');
        setUploadedData(response.data.data);
        setValidationSummary(response.data.validation_summary);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = ['.csv', '.xls', '.xlsx'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      if (!validTypes.includes(fileExtension)) {
        setError('Invalid file type. Please upload a CSV, XLS, or XLSX file.');
        setFile(null);
        return;
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        setError('File is too large. Maximum size is 10MB.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadedData(response.data.data);
      setValidationSummary(response.data.validation_summary);
      setFile(null);
      setCurrentPage(1); // Reset to first page after new upload
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Error uploading file';
      setError(Array.isArray(errorMessage) ? errorMessage.join('\n') : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template CSV content with the correct column names
    const templateHeaders = [
      'Drug Name',
      'Manufacturer',
      'Sales Year',
      'Total Sales (USD)',
      'Discount Percentage (%)',
      'Customer Category',
      'Sales Region',
      'Regulatory Price Limit (USD)',
      'Effective Price After Discounts (USD)',
      'Pricing Compliance Status'
    ];
    const templateContent = templateHeaders.join(',') + '\n' +
      'DrugD,CurePharma,2021,446689.74,10.98,Retailer,West,142925.41,397643.21,Non-Compliant\n' +
      'DrugE,CurePharma,2020,96738.44,47.99,Retailer,Central,163325.12,50313.66,Compliant';

    // Create and download the file
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_data_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Filter the data based on search criteria
  const filteredData = uploadedData.filter(row => {
    const productMatch = !filters.product || 
      (typeof row.Product === 'string' && row.Product.toLowerCase().includes(filters.product.toLowerCase()));
    
    const dateMatch = !filters.date || 
      (typeof row.Date === 'string' && row.Date.includes(filters.date));
    
    const typeMatch = !filters.transactionType || 
      (typeof row['Transaction Type'] === 'string' && 
       row['Transaction Type'].toLowerCase().includes(filters.transactionType.toLowerCase()));
    
    const customerMatch = !filters.customer || 
      (typeof row.Customer === 'string' && row.Customer.toLowerCase().includes(filters.customer.toLowerCase()));

    return productMatch && dateMatch && typeMatch && customerMatch;
  });

  // Get unique values for dropdowns
  const getUniqueValues = (field: string): string[] => {
    const values = new Set<string>();
    uploadedData.forEach(row => {
      const value = row[field];
      if (typeof value === 'string') {
        values.add(value);
      }
    });
    return Array.from(values);
  };

  // Calculate pagination based on filtered data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Function to get available columns from the data
  const getAvailableColumns = () => {
    if (!uploadedData || uploadedData.length === 0) return [];
    const firstRow = uploadedData[0];
    return Object.entries(firstRow)
      .filter(([_, value]) => value !== null) // Only show columns that have data
      .map(([key, _]) => key);
  };

  // Function to format cell value based on type
  const formatCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined) return '--';
    
    // Format numbers with currency symbol
    if (columnName.toLowerCase().includes('price') || 
        columnName.toLowerCase().includes('sales') ||
        columnName.toLowerCase().includes('amount') ||
        columnName.toLowerCase().includes('fees')) {
      return typeof value === 'number' 
        ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : value;
    }
    
    // Format percentages
    if (columnName.toLowerCase().includes('percentage') ||
        columnName.toLowerCase().includes('margin')) {
      return typeof value === 'number' || !isNaN(Number(value))
        ? `${value}%`
        : value;
    }
    
    // Format numbers with comma separation
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return value;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sales Data Upload & Management
        </h1>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Download Template
        </button>
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center">
          <FiUpload className="w-12 h-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upload Sales Data</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Drag and drop your CSV/XLS files here or click to browse
          </p>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv,.xls,.xlsx"
            className="hidden"
            id="fileInput"
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Select File
          </label>
          {file && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">{file.name}</p>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Supported formats: .csv, .xls, .xlsx
          </p>
        </div>
      </div>

      {/* Validation Summary */}
      {validationSummary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Data Validation Summary
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li>• Found {validationSummary.missing_discounts} records with missing discount values</li>
            <li>• Identified and excluded {validationSummary.govt_transactions} government transactions (340B)</li>
            <li>• Detected {validationSummary.duplicate_transactions} duplicate transaction</li>
          </ul>
        </div>
      )}

      {/* Data Preview */}
      {uploadedData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Preview</h3>
              <div className="flex items-center space-x-4">
                <select 
                  className="border rounded-md p-1 dark:bg-gray-700 dark:border-gray-600"
                  value={filters.product}
                  onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                >
                  <option value="">Select Product</option>
                  {getUniqueValues('Product').map((product, index) => (
                    <option key={index} value={product}>{product}</option>
                  ))}
                </select>
                <input
                  type="date"
                  className="border rounded-md p-1 dark:bg-gray-700 dark:border-gray-600"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
                <select 
                  className="border rounded-md p-1 dark:bg-gray-700 dark:border-gray-600"
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                >
                  <option value="">Transaction Type</option>
                  {getUniqueValues('Transaction Type').map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search Customer"
                  className="border rounded-md p-1 dark:bg-gray-700 dark:border-gray-600"
                  value={filters.customer}
                  onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {getAvailableColumns().map((column) => (
                    <th 
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {getAvailableColumns().map((column) => (
                      <td 
                        key={`${rowIndex}-${column}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                      >
                        {column === 'Status' ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            row[column] === 'Compliant' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {row[column]}
                          </span>
                        ) : (
                          formatCellValue(row[column], column)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t dark:border-gray-700">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-500 mt-4">
          {error}
        </div>
      )}
    </div>
  );
} 