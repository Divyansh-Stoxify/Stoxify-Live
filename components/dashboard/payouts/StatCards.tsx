"use client";

import React, { useState } from "react";
import WithdrawalFlowModal from "./WithdrawalFlowModal";

export default function StatCards() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Mock data for UI
  const stats = {
    totalEarnings: 15450.0,
    withdrawableBalance: 8200.0,
    accruingThisWeek: 1250.0,
  };

  const isWithdrawalEnabled = stats.withdrawableBalance >= 5000;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Earnings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between group relative">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total earnings</h3>
            <span className="text-gray-400 cursor-help">ℹ️</span>
            {/* Tooltip */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-48 p-2 bg-gray-900 text-xs text-white rounded shadow-lg z-10">
              All money you have earned so far including this week's unsettled amount.
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            ₹{stats.totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Withdrawable Now */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-900">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Withdrawable now</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            ₹{stats.withdrawableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              disabled={!isWithdrawalEnabled}
              onClick={() => setIsWithdrawModalOpen(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isWithdrawalEnabled
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
              }`}
            >
              Withdraw
            </button>
            {!isWithdrawalEnabled && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Minimum ₹5,000 required
              </span>
            )}
          </div>
        </div>

        {/* Accruing this week */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center justify-between group relative">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Accruing this week
            </h3>
            <span className="text-gray-400 cursor-help">ℹ️</span>
            {/* Tooltip */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-48 p-2 bg-gray-900 text-xs text-white rounded shadow-lg z-10">
              This will move to your withdrawable balance on the next Saturday.
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-500">
            ₹{stats.accruingThisWeek.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <WithdrawalFlowModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        withdrawableBalance={stats.withdrawableBalance}
      />
    </>
  );
}
