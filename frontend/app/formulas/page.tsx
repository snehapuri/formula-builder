'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Formula {
  id?: string;
  name: string;
  description: string;
  formula_string: string;
  created_at?: string;
}

interface Variable {
  name: string;
  description: string;
  example: number;
}

interface Operator {
  symbol: string;
  label: string;
}

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [newFormula, setNewFormula] = useState<Formula>({
    name: '',
    description: '',
    formula_string: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [showVariableHelp, setShowVariableHelp] = useState(false);
  const [formulaExpression, setFormulaExpression] = useState<string>('');
  const formulaInputRef = useRef<HTMLInputElement>(null);
  
  const operators: Operator[] = [
    { symbol: '+', label: 'Add' },
    { symbol: '-', label: 'Subtract' },
    { symbol: '*', label: 'Multiply' },
    { symbol: '/', label: 'Divide' },
    { symbol: '(', label: 'Left Parenthesis' },
    { symbol: ')', label: 'Right Parenthesis' }
  ];

  useEffect(() => {
    // Fetch existing formulas and available variables when component mounts
    const fetchData = async () => {
      try {
        const [formulasResponse, variablesResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/formulas'),
          axios.get('http://localhost:8000/api/variables')
        ]);

        const formulasList = Object.entries(formulasResponse.data).map(([id, formula]: [string, any]) => ({
          id,
          ...formula,
        }));
        setFormulas(formulasList);
        setAvailableVariables(variablesResponse.data.variables);

        // Set default formula if variables are available
        if (variablesResponse.data.variables.length > 0) {
          const priceVar = variablesResponse.data.variables.find(
            (v: Variable) => v.name.toLowerCase().includes('price') || v.name.toLowerCase().includes('sales')
          );
          const discountVar = variablesResponse.data.variables.find(
            (v: Variable) => v.name.toLowerCase().includes('discount')
          );

          if (priceVar && discountVar) {
            setNewFormula(prev => ({
              ...prev,
              formula_string: `${priceVar.name} * (1 - (${discountVar.name} / 100))`
            }));
          }
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Error fetching data';
        setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
      }
    };

    fetchData();
  }, []);

  // Function to insert text at cursor position
  const insertAtCursor = (text: string) => {
    const input = formulaInputRef.current;
    if (!input) return;

    const startPos = input.selectionStart || 0;
    const endPos = input.selectionEnd || 0;
    const currentValue = input.value;
    
    const newValue = currentValue.substring(0, startPos) + 
                    text + 
                    currentValue.substring(endPos);
    
    setNewFormula(prev => ({
      ...prev,
      formula_string: newValue
    }));

    // Set cursor position after inserted text
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(startPos + text.length, startPos + text.length);
    }, 0);
  };

  const handleVariableClick = (variable: Variable) => {
    insertAtCursor(variable.name);
  };

  const handleOperatorClick = (operator: Operator) => {
    insertAtCursor(` ${operator.symbol} `);
  };

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
        formula_string: '',
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

  // Add VariableHelp component
  const VariableHelp = () => {
    if (!showVariableHelp) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Available Variables</h3>
            <button
              onClick={() => setShowVariableHelp(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Variable Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Example Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {availableVariables.map((variable, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {variable.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {variable.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {typeof variable.example === 'number' 
                        ? variable.example.toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })
                        : variable.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on any row to copy the variable name to your formula.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Create New Formula</h2>

      {/* Formula Creation Form */}
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-200">
            Formula Name
          </label>
          <input
            type="text"
            id="name"
            value={newFormula.name}
            onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
            className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Variables Section */}
        <div className="flex flex-wrap gap-2">
          {availableVariables.map((variable) => (
            <button
              key={variable.name}
              onClick={() => handleVariableClick(variable)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
            >
              {variable.name}
            </button>
          ))}
        </div>

        {/* Operators Section */}
        <div className="flex flex-wrap gap-2">
          {operators.map((operator) => (
            <button
              key={operator.symbol}
              onClick={() => handleOperatorClick(operator)}
              className="w-10 h-10 flex items-center justify-center bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              {operator.symbol}
            </button>
          ))}
        </div>

        {/* Formula Expression */}
        <div>
          <label htmlFor="formula" className="block text-sm font-medium text-gray-200">
            Formula Expression
          </label>
          <input
            ref={formulaInputRef}
            type="text"
            id="formula"
            value={newFormula.formula_string}
            onChange={(e) => setNewFormula({ ...newFormula, formula_string: e.target.value })}
            className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-200">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={newFormula.description}
            onChange={(e) => setNewFormula({ ...newFormula, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-400">
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
        >
          Create Formula
        </button>
      </div>

      <VariableHelp />
    </div>
  );
} 