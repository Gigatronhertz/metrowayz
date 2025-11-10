import { useQuery } from '@tanstack/react-query';
import VendorLayout from '../../components/vendor/VendorLayout';
import vendorApi from '../../services/vendor/vendorApi';
import { DollarSign, TrendingUp, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';

const VendorFinancial = () => {
  // Fetch financial data
  const { data: overview } = useQuery({
    queryKey: ['financial-overview'],
    queryFn: vendorApi.financial.getFinancialOverview,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: vendorApi.financial.getTransactions,
  });

  const stats = [
    {
      title: 'Total Earnings',
      value: `₦${overview?.totalEarnings?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: '+12.5%',
    },
    {
      title: 'This Month',
      value: `₦${overview?.thisMonth?.toLocaleString() || 0}`,
      icon: Calendar,
      color: 'bg-blue-500',
      trend: '+8.3%',
    },
    {
      title: 'Pending Payout',
      value: `₦${overview?.pendingPayout?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      trend: null,
    },
    {
      title: 'Platform Fee (5%)',
      value: `₦${overview?.platformFee?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: null,
    },
  ];

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="text-gray-500 mt-1">Track your earnings and transactions</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={20} />
            Export Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <TrendingUp size={16} />
                      {stat.trend} from last month
                    </p>
                  )}
                </div>
                <div className={`${stat.color} rounded-full p-3`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-sm text-gray-500 mt-1">Your latest financial transactions</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactionsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions?.length > 0 ? (
                  transactions.map((transaction: any) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(transaction.date || transaction.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-500">{transaction.serviceName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'earning' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'earning' ? '+' : '-'}₦{transaction.amount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {transaction.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings Overview</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart coming soon...
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Service</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart coming soon...
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorFinancial;
