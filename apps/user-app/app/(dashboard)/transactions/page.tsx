import prisma from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

// ==== Types ====
type UnifiedTxn = {
  time: Date;
  amount: number;
  type: "credit" | "debit";
  status: string;
  provider: string;
  label: string;
};

// ==== Helpers ====
function getTransactionIcon(type: "credit" | "debit", status: string) {
  if (["processing", "pending"].includes(status.toLowerCase())) {
    return <Clock className="w-5 h-5 text-amber-500" />;
  }
  if (["failed", "declined"].includes(status.toLowerCase())) {
    return <XCircle className="w-5 h-5 text-red-500" />;
  }
  return type === "credit" ? (
    <ArrowDownLeft className="w-5 h-5 text-green-500" />
  ) : (
    <ArrowUpRight className="w-5 h-5 text-red-500" />
  );
}

function formatAmount(amount: number, type: "credit" | "debit", status: string) {
  const formatted = `₹${(amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  if (["processing", "pending"].includes(status.toLowerCase())) {
    return <span className="text-slate-500 font-semibold text-lg">{formatted}</span>;
  }
  return type === "credit" ? (
    <span className="text-green-600 font-bold text-lg">+{formatted}</span>
  ) : (
    <span className="text-red-600 font-bold text-lg">-{formatted}</span>
  );
}

function formatStatus(status: string) {
  const baseClasses =
    "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full capitalize";
  switch (status.toLowerCase()) {
    case "success":
    case "completed":
      return (
        <span className={`${baseClasses} bg-green-50 text-green-700 border border-green-200`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    case "processing":
    case "pending":
      return (
        <span className={`${baseClasses} bg-amber-50 text-amber-700 border border-amber-200`}>
          <Clock className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    case "failed":
    case "declined":
      return (
        <span className={`${baseClasses} bg-red-50 text-red-700 border border-red-200`}>
          <XCircle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-slate-50 text-slate-600 border border-slate-200`}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
  }
}

function formatDate(date: Date) {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffInHours < 24) {
    return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  } else if (diffInHours < 48) {
    return "Yesterday";
  } else {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }).format(date);
  }
}

function getProviderLogo(provider: string) {
  const logoMap: { [key: string]: string } = {
    "HDFC Bank": "🏦",
    "State Bank": "🏛️",
    "ICICI Bank": "🏪",
    "Axis Bank": "🏢",
    "Kotak Bank": "🏬",
    PayTM: "💳",
    PhonePe: "📱",
    "Google Pay": "💰",
    UPI: "💸",
  };
  return logoMap[provider] || "💳";
}

// ==== Unified Fetch ====
async function getAllTransactions(): Promise<UnifiedTxn[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  const userId = Number(session.user.id);

  const onRampTxns = await prisma.onRampTransaction.findMany({
    where: { userId },
    orderBy: { startTime: "desc" },
  });

  const p2pTxns = await prisma.p2pTransfer.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    include: { fromUser: true, toUser: true },
    orderBy: { timestamp: "desc" },
  });

  const mappedOnRamp: UnifiedTxn[] = onRampTxns.map((t) => ({
    time: t.startTime,
    amount: t.amount,
    type: "credit",
    status: t.status,
    provider: t.provider || "UPI",
    label: "Money Added",
  }));

  const mappedP2P: UnifiedTxn[] = p2pTxns.map((t) => {
    const isCredit = t.toUserId === userId;
    return {
      time: t.timestamp,
      amount: t.amount,
      type: isCredit ? "credit" : "debit",
      status: "success",
      provider: isCredit
        ? t.fromUser.name || String(t.fromUser.id)
        : t.toUser.name || String(t.toUser.id),
      label: isCredit ? "Received from" : "Sent to",
    };
  });

  return [...mappedOnRamp, ...mappedP2P].sort(
    (a, b) => b.time.getTime() - a.time.getTime()
  );
}

// ==== Page ====
export default async function TransactionsPage() {
  const transactions = await getAllTransactions();
  const totalAmount = transactions
    .filter((t) => ["success", "completed"].includes(t.status.toLowerCase()))
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingCount = transactions.filter((t) =>
    ["processing", "pending"].includes(t.status.toLowerCase())
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Transaction History
            </h1>
            <p className="text-slate-600 text-lg">
              Track all your payment activities and transfers
            </p>
          </div>
          <div className="hidden sm:block bg-gradient-to-r from-violet-500 to-purple-600 p-4 rounded-2xl">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Total Processed" value={`₹${(totalAmount / 100).toLocaleString("en-IN")}`} icon={<CheckCircle className="w-6 h-6 text-green-600" />} bg="bg-green-100" />
            <SummaryCard title="Total Transactions" value={transactions.length} icon={<CreditCard className="w-6 h-6 text-blue-600" />} bg="bg-blue-100" />
            <SummaryCard title="Pending" value={pendingCount} icon={<Clock className="w-6 h-6 text-amber-600" />} bg="bg-amber-100" />
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              Recent Transactions
            </h2>
            <p className="text-slate-600">Your latest payment activities</p>
          </div>
          {transactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {transactions.map((txn, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <span className="text-xl">{getProviderLogo(txn.provider)}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border">
                        {getTransactionIcon(txn.type, txn.status)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-slate-900">{txn.provider}</h3>
                        {formatStatus(txn.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>{formatDate(txn.time)}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>{txn.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">{formatAmount(txn.amount, txn.type, txn.status)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

// ==== Reusable Components ====
function SummaryCard({ title, value, icon, bg }: { title: string; value: string | number; icon: React.ReactNode; bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex justify-between items-center">
      <div>
        <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`${bg} p-3 rounded-xl`}>{icon}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CreditCard className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No transactions yet</h3>
      <p className="text-slate-500 max-w-sm mx-auto">
        Your transaction history will appear here once you start making payments or adding money to your wallet.
      </p>
    </div>
  );
}
