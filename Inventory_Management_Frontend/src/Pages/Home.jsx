
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  FiBox,
  FiTruck,
  FiDollarSign,
  FiShoppingCart,
  FiCreditCard
} from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api/';
const CURRENCY = '$'; // change to '৳' if you want Taka

const formatNumber = (n) =>
  Number(n || 0).toLocaleString('en-US');

const formatMoney = (n) =>
  `${CURRENCY}${Number(n || 0).toLocaleString('en-US', {
    maximumFractionDigits: 2
  })}`;

// Month change information
const monthChange = (flow) => {
  if (
    flow.change_percent === null ||
    flow.change_percent === undefined
  ) {
    return flow.this_month > 0
      ? 'New activity this month'
      : 'No data last month';
  }

  const sign = flow.change_percent > 0 ? '+' : '';

  return `${sign}${flow.change_percent}% from last month`;
};

// Dashboard Cards
const buildCards = (d) => [
  {
    title: 'Total Products',
    value: formatNumber(d.products.total),
    note: `+${formatNumber(d.products.new_this_month)} added this month`,
    icon: FiBox,
    box: 'bg-indigo-900/30 text-indigo-400',
    noteColor: 'text-indigo-400',
    path: '/product',
  },
  {
    title: 'Low Stock',
    value: formatNumber(d.low_stock.count),
    note: `${d.low_stock.threshold} or fewer left`,
    icon: FiBox,
    box: 'bg-amber-900/30 text-amber-400',
    noteColor: 'text-amber-400',
    path: '/stock',
  },
  {
    title: 'Active Suppliers',
    value: formatNumber(d.suppliers.active),
    note: `+${formatNumber(d.suppliers.new_this_month)} new this month`,
    icon: FiTruck,
    box: 'bg-emerald-900/30 text-emerald-400',
    noteColor: 'text-emerald-400',
    path: '/suppliers',
  },
  {
    title: 'Total Transactions',
    value: formatNumber(d.transactions.total),
    note: monthChange(d.transactions),
    icon: FiDollarSign,
    box: 'bg-purple-900/30 text-purple-400',
    noteColor: 'text-purple-400',
    path: '/transactions',
  },
  {
    title: 'Total Sales',
    value: formatMoney(d.sales.total),
    note: monthChange(d.sales),
    icon: FiShoppingCart,
    box: 'bg-green-900/30 text-green-400',
    noteColor: 'text-green-400',
    path: '/sell',
  },
  {
    title: 'Total Expenses',
    value: formatMoney(d.expenses.total),
    note: monthChange(d.expenses),
    icon: FiCreditCard,
    box: 'bg-red-900/30 text-red-400',
    noteColor: 'text-red-400',
    path: '/expenses',
  },
];

// Loading Skeleton
const SkeletonCard = () => (
  <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-28 rounded bg-gray-700" />
      <div className="h-11 w-11 rounded-lg bg-gray-700" />
    </div>

    <div className="mt-4 space-y-2">
      <div className="h-8 w-24 rounded bg-gray-700" />
      <div className="h-3 w-36 rounded bg-gray-700" />
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Dashboard Data
  const fetchDashboard = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API_BASE_URL}dashboard`, {
        signal
      });

      setData(res.data);

    } catch (err) {
      if (axios.isCancel(err)) return;

      setError(
        err.response?.data?.message ||
        'Could not load dashboard data.'
      );

    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchDashboard(controller.signal);

    return () => controller.abort();
  }, [fetchDashboard]);

  // Navigate to selected component
  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="p-6">

      <h2 className="text-2xl font-bold text-white mb-6">
        Dashboard
      </h2>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-800 bg-red-900/20 p-4 text-red-300">

          <span>{error}</span>

          <button
            onClick={() => fetchDashboard()}
            className="ml-4 rounded-lg bg-red-800/60 px-3 py-1 text-sm text-white hover:bg-red-700"
          >
            Retry
          </button>

        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {isLoading && !data ? (
          Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : (
          data &&
          buildCards(data).map((card) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                onClick={() => handleCardClick(card.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(card.path);
                  }
                }}
                className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700 cursor-pointer transition-colors hover:border-indigo-500"
                whileHover={{
                  y: -5,
                  scale: 1.02
                }}
                whileTap={{
                  scale: 0.98
                }}
              >

                <div className="flex items-center justify-between">

                  <h3 className="text-gray-400 font-medium">
                    {card.title}
                  </h3>

                  <div className={`p-3 rounded-lg ${card.box}`}>
                    <Icon size={18} />
                  </div>

                </div>

                <div className="mt-4">

                  <h2 className="text-3xl font-bold text-white">
                    {card.value}
                  </h2>

                  <p className={`text-sm mt-1 ${card.noteColor}`}>
                    {card.note}
                  </p>

                </div>

              </motion.div>
            );
          })
        )}

      </div>

    </div>
  );
};

export default Home;
