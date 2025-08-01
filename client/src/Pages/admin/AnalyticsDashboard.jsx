import React, { useEffect } from "react";
import { Line } from "react-chartjs-2";
// import { requestPushPermission } from "../../utils/pushNotification";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = () => {
  // Sample Data
  const salesData = {
    totalRevenue: 125000,
    monthlyRevenue: 10500,
    dailyRevenue: 350,
  };

  const orderData = {
    totalOrders: 5200,
    pendingOrders: 120,
    completedOrders: 5080,
  };

  const userData = {
    totalUsers: 1500,
    newUsersToday: 25,
    activeUsers: 800,
  };

  const productData = {
    totalProducts: 750,
    outOfStock: 30,
    topSellingProducts: [
      { id: 1, name: "Laptop", sales: 1200, revenue: 1200000 },
      { id: 2, name: "Smartphone", sales: 1500, revenue: 900000 },
      { id: 3, name: "Headphones", sales: 2000, revenue: 200000 },
      { id: 4, name: "Mouse", sales: 3000, revenue: 150000 },
      { id: 5, name: "Keyboard", sales: 1000, revenue: 100000 },
    ],
  };

  const revenueChartData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Revenue",
        data: [
          10000, 12000, 11000, 15000, 13000, 16000, 18000, 17000, 19000, 20000,
          22000, 25000,
        ],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      title: {
        display: true,
        text: "Revenue Over Time",
        font: {
          size: window.innerWidth < 768 ? 14 : 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 8 : 10,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 8 : 10,
          },
        },
      },
    },
  };
  // const userId = JSON.parse(localStorage.getItem("user"));
  // console.log("User Login after userId for requestPushPermission", userId?._id);

  // useEffect(() => {
  //   if (userId?._id) {
  //     requestPushPermission(userId._id);
  //   }
  // }, [userId]);
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        Analytics Dashboard
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            Total Revenue
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">
            ₹{salesData.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Monthly: ₹{salesData.monthlyRevenue.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Daily: ₹{salesData.dailyRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            Total Orders
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">
            {orderData.totalOrders.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Pending: {orderData.pendingOrders}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Completed: {orderData.completedOrders}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Total Users</h2>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600">
            {userData.totalUsers.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            New Today: {userData.newUsersToday}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Active: {userData.activeUsers}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            Total Products
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
            {productData.totalProducts.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Out of Stock: {productData.outOfStock}
          </p>
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
          Top Selling Products
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white table-auto">
            <thead>
              <tr>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-xs sm:text-sm">
                  Product Name
                </th>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-xs sm:text-sm">
                  Sales Count
                </th>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-xs sm:text-sm">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {productData.topSellingProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-2 px-2 sm:px-4 border-b text-xs sm:text-sm">
                    {product.name}
                  </td>
                  <td className="py-2 px-2 sm:px-4 border-b text-xs sm:text-sm">
                    {product.sales.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 sm:px-4 border-b text-xs sm:text-sm">
                    ₹{product.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
          Revenue Over Time
        </h2>
        <div className="h-64 sm:h-80">
          <Line data={revenueChartData} options={revenueChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
