'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [stats, setStats] = useState({
    calculationsToday: 0,
    compliantPrices: 0,
    nonCompliantPrices: 0
  });

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Drug Price Calculator Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg border border-blue-100 dark:border-slate-600">
          <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-300">Calculations Today</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.calculationsToday}</p>
        </div>
        
        <div className="bg-green-50 dark:bg-slate-700/50 p-4 rounded-lg border border-green-100 dark:border-slate-600">
          <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-300">Compliant Prices</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.compliantPrices}</p>
        </div>
        
        <div className="bg-red-50 dark:bg-slate-700/50 p-4 rounded-lg border border-red-100 dark:border-slate-600">
          <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-300">Non-Compliant Prices</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.nonCompliantPrices}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a 
            href="/upload" 
            className="block p-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">Upload Data</h4>
            <p className="text-gray-600 dark:text-slate-300 text-sm">Upload new sales data for calculation</p>
          </a>
          
          <a 
            href="/formulas" 
            className="block p-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">Create Formula</h4>
            <p className="text-gray-600 dark:text-slate-300 text-sm">Build a new pricing formula</p>
          </a>
          
          <a 
            href="/calculate" 
            className="block p-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">Run Calculation</h4>
            <p className="text-gray-600 dark:text-slate-300 text-sm">Calculate prices using existing data</p>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
        <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800">
            <p className="text-gray-600 dark:text-slate-400 text-sm">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
} 