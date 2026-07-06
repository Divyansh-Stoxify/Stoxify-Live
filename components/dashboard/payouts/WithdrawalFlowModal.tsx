'use client';

import React, { useState } from 'react';

interface WithdrawalFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawableBalance: number;
}

export default function WithdrawalFlowModal({ isOpen, onClose, withdrawableBalance }: WithdrawalFlowModalProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(withdrawableBalance.toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 5000) {
      setError('Minimum withdrawal is ₹5,000');
      return;
    }
    if (val > withdrawableBalance) {
      setError('Amount exceeds withdrawable balance');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setStep(4); // Success for this mock
      // In real life, we would handle step 5 (failed) based on the API response.
    }, 2000);
  };

  const resetAndClose = () => {
    setStep(1);
    setAmount(withdrawableBalance.toString());
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Withdraw Funds</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount to withdraw (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={resetAndClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Cancel
              </button>
              <button onClick={handleNext} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Next
              </button>
            </div>
          </div>
        )}

        {(step === 2 || step === 3) && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Confirm Withdrawal</h2>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Amount to withdraw</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">To account</span>
                <span className="font-mono text-gray-900 dark:text-white">XXXXXXXXX1234</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Deductions</span>
                <span className="text-gray-900 dark:text-white">None (MVP)</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setStep(1)} 
                disabled={isProcessing}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg min-w-[100px] flex justify-center disabled:opacity-70"
              >
                {isProcessing ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Transfer Initiated</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              ₹{parseFloat(amount).toLocaleString('en-IN')} will be sent to XXXXXXXXX1234. Usually takes within 30 minutes.
            </p>
            <button onClick={resetAndClose} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
