"use client";

import React from "react";

export default function WithdrawalHistoryTable() {
  // Mock data
  const withdrawals = [
    {
      id: "w1",
      date: "2026-06-28",
      amount: 5000,
      bankAccount: "XXXXXXXXX1234",
      utr: "IMPS123456789",
      status: "processed",
    },
    {
      id: "w2",
      date: "2026-06-20",
      amount: 7500,
      bankAccount: "XXXXXXXXX1234",
      utr: "-",
      status: "processing",
    },
    {
      id: "w3",
      date: "2026-06-15",
      amount: 6000,
      bankAccount: "XXXXXXXXX1234",
      utr: "-",
      status: "failed",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Processed
          </span>
        );
      case "processing":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Processing
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
              <th className="px-6 py-3 font-medium">Bank account</th>
              <th className="px-6 py-3 font-medium">UTR</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {withdrawals.map((w) => (
              <tr
                key={w.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4">{new Date(w.date).toLocaleDateString("en-IN")}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                  ₹{w.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4">{w.bankAccount}</td>
                <td className="px-6 py-4 font-mono text-xs">{w.utr}</td>
                <td className="px-6 py-4">{getStatusBadge(w.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
