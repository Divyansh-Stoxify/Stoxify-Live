"use client";

import { useState, type ReactNode } from "react";
import { CreditCardIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog, type FormResult } from "./_form-dialog";

export type RefundData = {
  user_name: string;
  user_email: string;
  amount: number;
  transaction_id: string;
  reason: string;
  status: "REQUESTED" | "APPROVED" | "PROCESSED";
};

type Props = {
  onSuccess?: (refund: RefundData) => void;
  trigger?: ReactNode;
};

export function RefundFormDialog({ onSuccess, trigger }: Props) {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [amount, setAmount] = useState<number>(999);
  const [transactionId, setTransactionId] = useState("");
  const [reason, setReason] = useState("");

  function resetForm() {
    setUserName("");
    setUserEmail("");
    setAmount(999);
    setTransactionId("");
    setReason("");
  }

  async function handleSubmit(): Promise<FormResult> {
    if (!userName.trim() || !userEmail.trim() || !reason.trim()) {
      return { ok: false, message: "User details and mandatory reason are required" };
    }

    const payload: RefundData = {
      user_name: userName.trim(),
      user_email: userEmail.trim(),
      amount: Number(amount) || 0,
      transaction_id: transactionId.trim() || `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
      reason: reason.trim(),
      status: "REQUESTED",
    };

    onSuccess?.(payload);
    resetForm();
    return { ok: true, message: `Refund request of ₹${payload.amount} submitted successfully` };
  }

  return (
    <FormDialog
      title="Create Refund Request"
      description="Initiate a subscription refund request. Mandates linked transaction ID and audit reason."
      submitLabel="Submit Refund Request"
      onSubmit={handleSubmit}
      onClose={resetForm}
      trigger={
        trigger || (
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="size-4" /> Initiate Refund
          </Button>
        )
      }
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">User Full Name *</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">User Email *</label>
            <Input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="e.g. aarav@example.com"
              className="h-8 text-xs"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Refund Amount (₹) *</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g. 1999"
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Linked Transaction ID</label>
            <Input
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. TXN_8819201"
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Mandatory Refund Reason *</label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Plan cancelled within 24 hours of subscription start"
            className="h-8 text-xs"
            required
          />
        </div>
      </div>
    </FormDialog>
  );
}
