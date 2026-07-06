'use client';

import React from 'react';
import StatCards from '@/components/dashboard/payouts/StatCards';
import Countdown from '@/components/dashboard/payouts/Countdown';
import SettlementHistoryTable from '@/components/dashboard/payouts/SettlementHistoryTable';
import WithdrawalHistoryTable from '@/components/dashboard/payouts/WithdrawalHistoryTable';

export default function PayoutsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">RA Payout Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage your earnings, settlements, and withdrawals.</p>
      </div>

      <StatCards />
      <Countdown />

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Settlement History</h2>
          <SettlementHistoryTable />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Withdrawal History</h2>
          <WithdrawalHistoryTable />
        </section>
      </div>
    </div>
  );
}
