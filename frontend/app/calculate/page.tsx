'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Formula {
  id: string;
  name: string;
  description: string;
  formula_string: string;
}

interface CalculationResult {
  results: any[];
  summary: {
    total_processed: number;
    compliant_count: number;
    non_compliant_count: number;
    formula_used: string;
    formula_name: string;
  };
}

export default function CalculatePage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [selectedFormula, setSelectedFormula] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Add state for filters and pagination
  const [filters, setFilters] = useState({
    product: '',
    date: '',
    transactionType: '',
    customer: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    // Fetch available formulas and uploaded data
    const fetchData = async () => {
      try {
        const [formulasResponse, dataResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/formulas'),
          axios.get('http://localhost:8000/api/data')
        ]);

        setFormulas(Object.entries(formulasResponse.data).map(([id, formula]: [string, any]) => ({
          id,
          ...formula,
        })));
        
        setUploadedData(dataResponse.data.data);
      } catch (error) {
        setError('Error fetching data');
      }
    };

    fetchData();
  }, []);

  const handleCalculate = async () => {
    if (!selectedFormula || !uploadedData.length) {
      setError('Please select a formula and ensure data is uploaded');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/calculate', {
        formula_id: selectedFormula,
        data: uploadedData,
      });

      setCalculationResult(response.data);
      setCurrentPage(1); // Reset to first page after new calculation
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error performing calculation');
    } finally {
      setLoading(false);
    }
  };

  // Filter the results
  const getFilteredResults = () => {
    if (!calculationResult) return [];
    
    return calculationResult.results.filter(row => {
      return (
        (!filters.product || row.Product.toLowerCase().includes(filters.product.toLowerCase())) &&
        (!filters.date || row.Date?.includes(filters.date)) &&
        (!filters.transactionType || row["Transaction Type"]?.toLowerCase().includes(filters.transactionType.toLowerCase())) &&
        (!filters.customer || row.Customer?.toLowerCase().includes(filters.customer.toLowerCase()))
      );
    });
  };

  // Get unique values for dropdowns
  const getUniqueValues = (field: string) => {
    if (!calculationResult) return [];
    const values = new Set(calculationResult.results.map(row => row[field]));
    return Array.from(values);
  };

  // Calculate pagination
  const filteredResults = getFilteredResults();
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const currentResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Formula Selection */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Calculate Prices</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Formula
            </label>
            <select
              value={selectedFormula}
              onChange={(e) => setSelectedFormula(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="">Select a formula</option>
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.id}>
                  {formula.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFormula && (
            <div className="bg-gray-50 dark:bg-slate-700 rounded p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Selected Formula:</h4>
              <code className="block mt-2 text-sm text-gray-800 dark:text-gray-300">
                {formulas.find(f => f.id === selectedFormula)?.formula_string}
              </code>
            </div>
          )}

          <div>
            <button
              onClick={handleCalculate}
              disabled={loading || !selectedFormula || !uploadedData.length}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
            >
              {loading ? 'Calculating...' : 'Calculate Prices'}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {calculationResult && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Calculation Results - {calculationResult.summary.formula_name}
          </h3>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">Total Processed</h4>
              <p className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
                {calculationResult.summary.total_processed}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-900 dark:text-green-300">Compliant</h4>
              <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
                {calculationResult.summary.compliant_count}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-900 dark:text-red-300">Non-Compliant</h4>
              <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
                {calculationResult.summary.non_compliant_count}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-4">
            <select 
              className="border rounded-md p-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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
              className="border rounded-md p-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />

            <select 
              className="border rounded-md p-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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
              className="border rounded-md p-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={filters.customer}
              onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
            />
          </div>

          {/* Results Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Original Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Calculated Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Regulatory Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentResults.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {row.Product}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      ${row.Price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      ${row["Calculated Price"]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      ${row["Regulatory Limit"]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {row.Discount === '--' ? '--' : `${row.Discount}%`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        row["Compliance Status"] === 'Compliant' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {row["Compliance Status"]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t dark:border-gray-700 pt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}