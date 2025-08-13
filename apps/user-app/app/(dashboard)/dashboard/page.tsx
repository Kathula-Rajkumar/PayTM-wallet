import prisma from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import Link from "next/link";
import {
  Wallet,
  Send,
  PlusCircle,
  List,
  TrendingUp,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  CreditCard,
  Activity,
  DollarSign,
  Lock,
} from "lucide-react";

async function getBalance() {
  const session = await getServerSession(authOptions);
  const balance = await prisma.balance.findFirst({
    where: { userId: Number(session?.user?.id) },
  });
  return {
    amount: balance?.amount || 0,
    locked: balance?.locked || 0,
  };
}

// Mock function for recent activity - replace with actual data fetching
async function getRecentActivity() {
  // This would typically fetch from your transactions table
  return [
    {
      id: 1,
      type: "credit",
      amount: 50000,
      description: "Money Added via UPI",
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "completed",
    },
    {
      id: 2,
      type: "debit",
      amount: 10000,
      description: "Sent to Rajkumar Kathula",
      time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: "completed",
    },
    {
      id: 3,
      type: "credit",
      amount: 25000,
      description: "Money Added via Bank Transfer",
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: "pending",
    },
  ];
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return `${Math.floor(diffInHours / 24)}d ago`;
  }
}

export default async function DashboardPage() {
  const balance = await getBalance();
  const recentActivity = await getRecentActivity();
  const session = await getServerSession(authOptions);

  const totalBalance = balance.amount + balance.locked;
  const availablePercentage =
    totalBalance > 0 ? (balance.amount / totalBalance) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome back, {session?.user?.name?.split(" ")[0] || "User"}!
              </h1>
              <p className="text-slate-600">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 rounded-2xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Balance Card */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/10 p-2 rounded-xl">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <span className="text-white/80 font-medium">
                      Total Balance
                    </span>
                  </div>
                  <button className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2">
                    {formatAmount(balance.amount)}
                  </div>
                  {balance.locked > 0 && (
                    <div className="flex items-center space-x-2 text-white/60">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">
                        {formatAmount(balance.locked)} locked
                      </span>
                    </div>
                  )}
                </div>

                {/* Balance Progress */}
                <div className="bg-white/10 rounded-full h-2 mb-4">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(availablePercentage, 100)}%` }}
                  ></div>
                </div>

                <div className="text-white/60 text-sm">
                  {availablePercentage.toFixed(1)}% available for transactions
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">
                    Available
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatAmount(balance.amount)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {balance.locked > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">
                      Locked
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatAmount(balance.locked)}
                    </p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-xl">
                    <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-slate-900">₹12,450</p>
                  <p className="text-green-600 text-sm font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +8.2%
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/p2p" className="group">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group-hover:scale-[1.02]">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 group-hover:bg-blue-200 p-4 rounded-2xl mb-4 transition-colors">
                    <Send className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Send Money
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Transfer to friends & family
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/transfer" className="group">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-200 group-hover:scale-[1.02]">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 group-hover:bg-green-200 p-4 rounded-2xl mb-4 transition-colors">
                    <PlusCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 hover:text-[#6a51a6] cursor-pointer">Add Money
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Top up your wallet balance
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/transactions" className="group">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 group-hover:scale-[1.02]">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-orange-100 group-hover:bg-orange-200 p-4 rounded-2xl mb-4 transition-colors">
                    <List className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Transactions
                  </h3>
                  <p className="text-slate-600 text-sm">View payment history</p>
                </div>
              </div>
            </Link>

            { <Link href="/p2p" className="group">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200 group-hover:scale-[1.02]">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-purple-100 group-hover:bg-purple-200 p-4 rounded-2xl mb-4 transition-colors">
                    <CreditCard className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Peer to Peer</h3>
                  <p className="text-slate-600 text-sm">Send money within seconds</p>
                </div>
              </div>
            </Link> }
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Recent Activity
                </h3>
                <Link
                  href="/transactions"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-6 flex items-center space-x-4"
                >
                  <div
                    className={`p-2 rounded-xl ${
                      activity.type === "credit" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {activity.type === "credit" ? (
                      <ArrowDownLeft
                        className={`w-5 h-5 ${
                          activity.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {formatRelativeTime(activity.time)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        activity.type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {activity.type === "credit" ? "+" : "-"}
                      {formatAmount(activity.amount)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        activity.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Tips */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-100 p-2 rounded-xl">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Security Status
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Two-Factor Authentication
                  </span>
                  <span className="text-green-600 font-medium">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Phone Verification</span>
                  <span className="text-green-600 font-medium">Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Email Verification</span>
                  <span className="text-green-600 font-medium">Verified</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Tip of the Day
                </h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Set up automatic savings! You can configure recurring transfers
                to your savings account to help you reach your financial goals
                faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
