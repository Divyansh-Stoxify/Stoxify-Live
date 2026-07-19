"use client";

import React from "react";

export default function SettlementHistoryTable() {
  // Mock data
  const settlements = [
    {
      id: "1",
      date: "2026-06-27",
      batch: "Morning Batch",
      plan: "Monthly",
      daysSettled: 7,
      rate: 100,
      amount: 700,
    },
    {
      id: "2",
      date: "2026-06-27",
      batch: "VIP Batch",
      plan: "Yearly",
      daysSettled: 7,
      rate: 50,
      amount: 350,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Recent Settlements</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
          Export to CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3 font-medium">Settlement date</th>
              <th className="px-6 py-3 font-medium">Batch</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium text-right">Days settled</th>
              <th className="px-6 py-3 font-medium text-right">Rate (₹/day)</th>
              <th className="px-6 py-3 font-medium text-right">Amount settled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {settlements.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4">{new Date(s.date).toLocaleDateString("en-IN")}</td>
                <td className="px-6 py-4">{s.batch}</td>
                <td className="px-6 py-4">{s.plan}</td>
                <td className="px-6 py-4 text-right">{s.daysSettled}</td>
                <td className="px-6 py-4 text-right">₹{s.rate.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                  ₹{s.amount.toFixed(2)}
                </td>
              </tr>
            ))}
            {settlements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No settlements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
