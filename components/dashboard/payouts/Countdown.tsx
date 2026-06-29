'use client';

import React from 'react';

export default function Countdown() {
  // Logic to calculate days until next Saturday (Day 6)
  const today = new Date();
  const dayOfWeek = today.getDay();
  // If today is Saturday (6), next Saturday is in 7 days, unless we want to show 'processing now'
  let daysUntilSaturday = 6 - dayOfWeek;
  
  if (daysUntilSaturday < 0) {
    daysUntilSaturday += 7; // It's Sunday (0), so 6 days until Saturday
  }

  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);
  
  const formattedDate = nextSaturday.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="py-4 border-b border-t border-gray-100 dark:border-gray-800">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {daysUntilSaturday === 0 
          ? 'Settlement processing now.' 
          : `Next settlement in ${daysUntilSaturday} days (${formattedDate}).`}
      </p>
    </div>
  );
}
