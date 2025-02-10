'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Formula {
  id?: string;
  name: string;
  description: string;
  formula_string: string;
  created_at?: string;
}

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [newFormula, setNewFormula] = useState<Formula>({
    name: '',
    description: '',
    formula_string: 'Total Sales * (1 - (Discount Percentage / 100))',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    // Fetch existing formulas when component mounts
    const fetchFormulas = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/formulas');
        const formulasList = Object.entries(response.data).map(([id, formula]: [string, any]) => ({
          id,
          ...formula,
        }));
        setFormulas(formulasList);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Error fetching formulas';
        setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
      }
    };

    fetchFormulas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/api/formulas', {
        name: newFormula.name.trim(),
        description: newFormula.description.trim(),
        formula_string: newFormula.formula_string.trim(),
      });

      setFormulas(prev => [...prev, response.data]);
      setSuccess('Formula created successfully!');
      setNewFormula({
        name: '',
        description: '',
        formula_string: 'Total Sales * (1 - (Discount Percentage / 100))',
      });
    } catch (err: any) {
      let errorMessage = err.response?.data?.detail || err.message || 'Error creating formula';
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.map(e => e.msg).join(', ');
      } else if (typeof errorMessage === 'object') {
        errorMessage = JSON.stringify(errorMessage);
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Formula Builder</h2>

      {/* Formula Creation Form */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Formula</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Formula Name
            </label>
            <input
              type="text"
              id="name"
              value={newFormula.name}
              onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="description"
              value={newFormula.description}
              onChange={(e) => setNewFormula({ ...newFormula, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="formula" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Formula
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="formula"
                value={newFormula.formula_string}
                onChange={(e) => setNewFormula({ ...newFormula, formula_string: e.target.value })}
                className="block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setNewFormula({ ...newFormula, formula_string: 'Total Sales * (1 - (Discount Percentage / 100))' })}
                  className="text-sm text-primary dark:text-blue-400 hover:text-primary-dark"
                >
                  Reset to Default
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Available variables: Total Sales, Discount Percentage
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-800"
            >
              Create Formula
            </button>
          </div>
        </form>
      </div>

      {/* Existing Formulas */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Saved Formulas</h3>
        {formulas.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400">No formulas created yet.</p>
        ) : (
          <div className="space-y-4">
            {formulas.map((formula, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-700"
              >
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{formula.name}</h4>
                <p className="text-gray-600 dark:text-slate-300 text-sm mt-1">{formula.description}</p>
                <code className="block bg-gray-50 dark:bg-slate-800 p-2 rounded mt-2 text-sm text-gray-800 dark:text-slate-300">
                  {formula.formula_string}
                </code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 