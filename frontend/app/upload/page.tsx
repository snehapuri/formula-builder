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

interface FilterState {
  [key: string]: {
    value: string | number | [number, number] | [string, string];
    type: 'text' | 'number' | 'date' | 'select' | 'range';
    operator?: 'contains' | 'equals' | 'greater' | 'less' | 'between';
  };
}

interface SortState {
  column: string;
  direction: 'asc' | 'desc';
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
  const [filters, setFilters] = useState<FilterState>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortState | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

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

  // Apply filters to data
  const applyFilters = (data: UploadedData[]) => {
    return data.filter(row => {
      return Object.entries(filters).every(([column, filter]) => {
        const value = row[column];
        
        if (value === null) return false;

        switch (filter.type) {
          case 'text':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          
          case 'number':
            if (filter.operator === 'between' && Array.isArray(filter.value)) {
              const [min, max] = filter.value;
              const numValue = Number(value);
              return numValue >= min && numValue <= max;
            }
            if (filter.operator === 'greater') {
              return Number(value) >= Number(filter.value);
            }
            if (filter.operator === 'less') {
              return Number(value) <= Number(filter.value);
            }
            return Number(value) === Number(filter.value);
          
          case 'date':
            if (filter.operator === 'between' && Array.isArray(filter.value)) {
              const [start, end] = filter.value;
              const dateStr = String(value);
              return dateStr >= String(start) && dateStr <= String(end);
            }
            return String(value) === String(filter.value);
          
          case 'select':
            return value === filter.value;
          
          default:
            return true;
        }
      });
    });
  };

  // Apply sorting to data
  const applySorting = (data: UploadedData[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];

      if (aVal === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bVal === null) return sortConfig.direction === 'asc' ? -1 : 1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortConfig.direction === 'asc' ? 
        aStr.localeCompare(bStr) : 
        bStr.localeCompare(aStr);
    });
  };

  // Process data with filters and sorting
  const processData = () => {
    let processed = [...uploadedData];
    processed = applyFilters(processed);
    processed = applySorting(processed);
    return processed;
  };

  // Get filtered and sorted data
  const paginatedData = (() => {
    const processed = processData();
    const totalPages = Math.ceil(processed.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: processed.slice(startIndex, endIndex),
      totalPages,
      totalItems: processed.length
    };
  })();

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

  // Determine column types and available filters
  const getColumnType = (columnName: string, values: ColumnValue[]): 'text' | 'number' | 'date' | 'select' => {
    if (columnName.toLowerCase().includes('date') || columnName.toLowerCase().includes('year')) {
      return 'date';
    }
    
    if (columnName.toLowerCase().includes('price') || 
        columnName.toLowerCase().includes('amount') || 
        columnName.toLowerCase().includes('sales') ||
        columnName.toLowerCase().includes('limit')) {
      return 'number';
    }

    // If the column has less than 10 unique values, make it a select
    const uniqueValues = new Set(values.filter(v => v !== null));
    if (uniqueValues.size < 10) {
      return 'select';
    }

    return 'text';
  };

  // Get available filters for each column
  const getAvailableFilters = () => {
    if (!uploadedData || uploadedData.length === 0) return {};

    const columns = getAvailableColumns();
    const filterConfig: { [key: string]: { type: string; values?: any[] } } = {};

    columns.forEach(column => {
      const values = uploadedData.map(row => row[column]);
      const type = getColumnType(column, values);

      filterConfig[column] = {
        type,
        values: type === 'select' ? Array.from(new Set(values.filter(v => v !== null))) : undefined
      };
    });

    return filterConfig;
  };

  // Handle adding a new filter
  const handleAddFilter = (column: string, type: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: {
        value: type === 'range' ? [0, 100] : '',
        type: type as 'text' | 'number' | 'date' | 'select' | 'range',
        operator: type === 'number' ? 'equals' : undefined
      }
    }));
    setActiveFilters(prev => [...prev, column]);
  };

  // Handle removing a filter
  const handleRemoveFilter = (column: string) => {
    const newFilters = { ...filters };
    delete newFilters[column];
    setFilters(newFilters);
    setActiveFilters(prev => prev.filter(f => f !== column));
  };

  // Handle sorting
  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev?.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter Panel Component
  const FilterPanel = () => {
    const filterConfig = getAvailableFilters();

    return (
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h4>
          <button
            onClick={() => setShowFilterPanel(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(column => (
              <div key={column} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                <span className="text-sm text-blue-700 dark:text-blue-300">{column}</span>
                <button
                  onClick={() => handleRemoveFilter(column)}
                  className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add Filter Dropdown */}
          <div className="flex gap-2">
            <select
              className="border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              onChange={(e) => {
                if (e.target.value) {
                  const [column, type] = e.target.value.split('|');
                  handleAddFilter(column, type);
                  e.target.value = '';
                }
              }}
            >
              <option value="">Add Filter...</option>
              {Object.entries(filterConfig)
                .filter(([column]) => !activeFilters.includes(column))
                .map(([column, config]) => (
                  <option key={column} value={`${column}|${config.type}`}>
                    {column}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Filter Controls */}
          {activeFilters.map(column => {
            const filter = filters[column];
            const config = filterConfig[column];

            return (
              <div key={column} className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-1/4">{column}</span>
                
                {config.type === 'number' && (
                  <>
                    <select
                      value={filter.operator}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [column]: { ...filter, operator: e.target.value as any }
                      }))}
                      className="border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="equals">=</option>
                      <option value="greater">≥</option>
                      <option value="less">≤</option>
                      <option value="between">Between</option>
                    </select>
                    
                    {filter.operator === 'between' ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={(filter.value as [number, number])[0]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [column]: { 
                              ...filter, 
                              value: [Number(e.target.value), (filter.value as [number, number])[1]]
                            }
                          }))}
                          className="border rounded-md p-2 w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <span className="text-gray-700 dark:text-gray-300">to</span>
                        <input
                          type="number"
                          value={(filter.value as [number, number])[1]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [column]: { 
                              ...filter, 
                              value: [(filter.value as [number, number])[0], Number(e.target.value)]
                            }
                          }))}
                          className="border rounded-md p-2 w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={filter.value as number}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [column]: { ...filter, value: Number(e.target.value) }
                        }))}
                        className="border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    )}
                  </>
                )}

                {config.type === 'date' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={Array.isArray(filter.value) ? filter.value[0] : filter.value}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [column]: { ...filter, value: e.target.value }
                      }))}
                      className="border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}

                {config.type === 'select' && (
                  <select
                    value={filter.value as string}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      [column]: { ...filter, value: e.target.value }
                    }))}
                    className="border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All</option>
                    {config.values?.map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}

                {config.type === 'text' && (
                  <input
                    type="text"
                    value={filter.value as string}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      [column]: { ...filter, value: e.target.value }
                    }))}
                    placeholder={`Search ${column}...`}
                    className="border rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Preview</h3>
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {showFilterPanel && <FilterPanel />}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {getAvailableColumns().map((column) => (
                    <th 
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column}
                        {sortConfig?.column === column && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedData.data.map((row, rowIndex) => (
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
          {paginatedData.totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t dark:border-gray-700">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {paginatedData.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginatedData.totalPages))}
                disabled={currentPage === paginatedData.totalPages}
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