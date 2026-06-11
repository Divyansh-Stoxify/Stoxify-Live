"use client";

import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Icon } from "@/components/stoxify-icon";

type SupportUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
};

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: "account" | "subscriptions" | "alerts";
};

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    category: "account",
    question: "Why is Aadhaar KYC verification mandatory?",
    answer:
      "Under SEBI guidelines, all users subscribing to and receiving advice from SEBI-registered Research Analysts must verify their identity. KYC ensures transparency, safety, and regulatory compliance on the Stoxify platform.",
  },
  {
    id: "faq-2",
    category: "subscriptions",
    question: "How do I subscribe to an analyst's plan?",
    answer:
      "Navigate to the 'Discover' section from the sidebar, find an analyst you wish to follow, click 'View Analyst', select a premium subscription plan, and complete the secure payment process.",
  },
  {
    id: "faq-3",
    category: "alerts",
    question: "How are trading signals/alerts delivered?",
    answer:
      "Active alerts are visible on your 'Dashboard' tab. Additionally, you will receive real-time system notifications inside the 'Notifications' section. We are currently working on SMS and WhatsApp alerts integration as well.",
  },
  {
    id: "faq-4",
    category: "subscriptions",
    question: "Can I cancel my subscription or get a refund?",
    answer:
      "Subscriptions are billed up-front for the duration specified (e.g. 30 days). You can cancel your subscription's auto-renewal at any time from your Profile's Subscriptions tab. Refunds are subject to individual analyst terms and Stoxify's refund policy.",
  },
  {
    id: "faq-5",
    category: "account",
    question: "How long does it take for Aadhaar verification to complete?",
    answer:
      "Aadhaar verification is instantaneous in most cases. Simply enter your 12-digit Aadhaar number in the Profile page settings. If it enters a pending state, our support team will verify it within 2 hours.",
  },
  {
    id: "faq-6",
    category: "alerts",
    question: "Who are the analysts listing signals on Stoxify?",
    answer:
      "All analysts on Stoxify are SEBI-registered Research Analysts or Investment Advisers. Their credentials, SEBI registration numbers, and performance history are verified and clearly displayed on their profiles.",
  },
  {
    id: "faq-7",
    category: "subscriptions",
    question: "Are there any hidden transaction fees?",
    answer:
      "No, Stoxify does not charge any hidden payment fees. The price you see on the analyst subscription card is inclusive of platform access. Standard GST or payment gateway fees might be displayed at checkout.",
  },
];

export function TraderSupport({ user }: { user: SupportUser }) {
  // Search & Accordion states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "account" | "subscriptions" | "alerts"
  >("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toggle FAQ
  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Filtered FAQs
  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Submit Support Form (Mock call with dynamic states)
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject.");
      return;
    }
    if (!description.trim() || description.length < 10) {
      toast.error("Please describe your issue in at least 10 characters.");
      return;
    }

    setSubmitting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setSubmitting(false);
    toast.success(
      "Support ticket raised successfully! Ticket ID: STX-" +
        Math.floor(100000 + Math.random() * 900000)
    );
    setSubject("");
    setDescription("");
    setCategory("general");
  };

  return (
    <div className="px-4 py-8 lg:px-12 lg:py-12 max-w-[1200px] mx-auto font-sans">
      <Toaster position="bottom-right" />

      {/* Page Title */}
      <div className="mb-8 select-none">
        <h1 className="font-serif text-[36px] font-normal tracking-tight text-[var(--ink)] leading-none mb-2">
          Help & Support
        </h1>
        <p className="text-[13.5px] text-[var(--muted)]">
          Search frequently asked questions or raise a support ticket directly to our team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        {/* ─── LEFT COLUMN: FAQs ─── */}
        <div className="space-y-6">
          {/* FAQ Filters Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-100 pb-4">
            <h2 className="text-[17px] font-extrabold text-[var(--ink)] select-none">
              Frequently Asked Questions
            </h2>

            {/* Category Pills */}
            <div className="flex rounded-lg border border-slate-200/80 bg-slate-50 p-0.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {(["all", "account", "subscriptions", "alerts"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setExpandedFaq(null);
                  }}
                  className={[
                    "rounded-md px-3 py-1.5 text-[11.5px] font-bold transition-all whitespace-nowrap",
                    selectedCategory === cat
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--ink)]",
                  ].join(" ")}
                >
                  {cat === "all" ? "All FAQs" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search support articles, keywords, topics..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setExpandedFaq(null);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-[13.5px] font-medium text-[var(--ink)] placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* FAQs List */}
          {filteredFaqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[var(--muted)]">
                <Icon name="search" className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[14px] font-bold text-[var(--ink)] mb-1">
                No FAQs matched your query
              </h3>
              <p className="text-[12.5px] text-[var(--muted)] max-w-[280px]">
                Try writing general words like &quot;KYC&quot;, &quot;analyst&quot;,
                &quot;refund&quot;, or raise a ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={[
                      "rounded-xl border bg-white transition-all duration-200 overflow-hidden",
                      isExpanded
                        ? "border-emerald-500/30 shadow-[0_4px_16px_rgba(16,185,129,0.04)]"
                        : "border-slate-200 hover:border-slate-300",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-bold text-[14px] text-[var(--ink)] select-none hover:text-emerald-700 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <Icon
                        name="chevronDown"
                        className={[
                          "h-3.5 w-3.5 text-slate-400 transition-transform duration-250 shrink-0",
                          isExpanded ? "rotate-180 text-emerald-600" : "",
                        ].join(" ")}
                      />
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-50 bg-slate-50/40 px-5 py-4 text-[13px] leading-relaxed text-[var(--muted)] animate-fade-in">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Help Tip */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <Icon name="sparkle" className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[12px] leading-relaxed text-[var(--muted)]">
              <span className="font-bold text-[var(--ink)]">Tip:</span> If you are facing
              verification issues, verify that the Aadhaar details you enter match your billing or
              profile identity documents exactly.
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: CONTACT & TICKETS ─── */}
        <div className="space-y-6">
          {/* Direct Support Channels */}
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <h3 className="text-[15px] font-extrabold text-[var(--ink)] mb-4 select-none">
              Direct Support Channels
            </h3>
            <div className="space-y-3.5">
              {/* Email Card */}
              <a
                href="mailto:support@stoxify.com"
                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 hover:border-emerald-300/40 hover:bg-emerald-50/20 transition-all group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-all">
                  <Icon name="mail" className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email Assistance
                  </div>
                  <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                    support@stoxify.com
                  </div>
                </div>
                <Icon
                  name="arrowRight"
                  className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"
                />
              </a>

              {/* Phone Card */}
              <a
                href="tel:+919999999999"
                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 hover:border-emerald-300/40 hover:bg-emerald-50/20 transition-all group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-all">
                  <Icon name="phone" className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phone Helpline
                  </div>
                  <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                    +91 9999999999
                  </div>
                </div>
                <Icon
                  name="arrowRight"
                  className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"
                />
              </a>
            </div>
            <div className="mt-4 text-[11px] text-center text-slate-400">
              Helpline Available: Mon - Sat, 9:00 AM - 6:00 PM IST
            </div>
          </div>

          {/* Raise a Support Ticket Form */}
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <h3 className="text-[15px] font-extrabold text-[var(--ink)] mb-1 select-none">
              Raise a Support Ticket
            </h3>
            <p className="text-[12px] text-[var(--muted)] mb-5 select-none">
              Submit your inquiry and our support team will reply within 4 hours.
            </p>

            <form onSubmit={handleSubmitTicket} className="space-y-4 font-sans">
              {/* Prefilled User Details */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Your Name
                  </span>
                  <div className="text-[12.5px] font-semibold text-[var(--muted)] bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 truncate">
                    {user?.name || "Trader"}
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Contact Info
                  </span>
                  <div className="text-[12.5px] font-semibold text-[var(--muted)] bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 truncate">
                    {user?.phone || user?.email || "Not signed in"}
                  </div>
                </div>
              </div>

              {/* Inquiry Category */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 select-none">
                  Inquiry Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-[var(--ink)] outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="general">General Support</option>
                  <option value="kyc">KYC Verification Issue</option>
                  <option value="subscriptions">Subscriptions & Billing</option>
                  <option value="signals">Signal Delivery Issue</option>
                  <option value="bug">Report a Bug / Technical Issue</option>
                </select>
              </div>

              {/* Ticket Subject */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 select-none">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Summarize your problem..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-[var(--ink)] placeholder:text-slate-300 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Ticket Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 select-none">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue or feedback in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-[var(--ink)] placeholder:text-slate-300 outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-[13px] py-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting ticket...</span>
                  </>
                ) : (
                  <>
                    <Icon name="send" className="h-3.5 w-3.5" />
                    <span>Submit Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
