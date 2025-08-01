import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SellerAnalytics = () => {
  const [selectedSeller, setSelectedSeller] = useState("seller1");

  const sellersData = {
    seller1: {
      name: "GadgetHub",
      totalSales: 75000,
      totalOrders: 1200,
      productsSold: 2500,
      performanceData: [
        { month: "Jan", sales: 5000 },
        { month: "Feb", sales: 7000 },
        { month: "Mar", sales: 10000 },
        { month: "Apr", sales: 12000 },
        { month: "May", sales: 15000 },
        { month: "Jun", sales: 26000 },
      ],
    },
    seller2: {
      name: "FashionFiesta",
      totalSales: 50000,
      totalOrders: 900,
      productsSold: 1800,
      performanceData: [
        { month: "Jan", sales: 4000 },
        { month: "Feb", sales: 6000 },
        { month: "Mar", sales: 8000 },
        { month: "Apr", sales: 10000 },
        { month: "May", sales: 11000 },
        { month: "Jun", sales: 11000 },
      ],
    },
    seller3: {
      name: "HomeEssentials",
      totalSales: 30000,
      totalOrders: 500,
      productsSold: 1000,
      performanceData: [
        { month: "Jan", sales: 2000 },
        { month: "Feb", sales: 3000 },
        { month: "Mar", sales: 5000 },
        { month: "Apr", sales: 6000 },
        { month: "May", sales: 7000 },
        { month: "Jun", sales: 7000 },
      ],
    },
  };

  const currentSeller = sellersData[selectedSeller];

  const handleSellerChange = (event) => {
    setSelectedSeller(event.target.value);
  };

  const chartOptions = {
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
        text: `${currentSeller.name} Sales Performance`,
        font: {
          size: window.innerWidth < 768 ? 14 : 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 8 : 10,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 8 : 10,
          },
        },
      },
    },
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Seller Analytics</h1>

      {/* Overview Table for All Sellers */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">All Sellers Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white table-auto">
            <thead>
              <tr>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-xs sm:text-sm">Seller Name</th>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-xs sm:text-sm">Total Sales</th>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-xs sm:text-sm">Total Orders</th>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-xs sm:text-sm">Products Sold</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(sellersData).map((key) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="py-2 px-2 sm:px-4 border-b text-xs sm:text-sm">
                    {sellersData[key].name}
                  </td>
                  <td className="py-2 px-2 sm:px-4 border-b text-xs sm:text-sm">
                    ${sellersData[key].totalSales.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 sm:px-4 border-b text-xs sm:text-sm">
                    {sellersData[key].totalOrders.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 sm:px-4 border-b text-xs sm:text-sm">
                    {sellersData[key].productsSold.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <label
          htmlFor="seller-select"
          className="block text-base sm:text-lg font-medium text-gray-700 mb-2"
        >
          Select Seller:
        </label>
        <select
          id="seller-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-sm sm:text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
          value={selectedSeller}
          onChange={handleSellerChange}
        >
          {Object.keys(sellersData).map((key) => (
            <option key={key} value={key}>
              {sellersData[key].name}
            </option>
          ))}
        </select>
      </div>

      {currentSeller && (
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
            {currentSeller.name} Performance Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Total Sales</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                ${currentSeller.totalSales.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Total Orders</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                {currentSeller.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Products Sold</h3>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                {currentSeller.productsSold.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              Sales Performance Over Time
            </h2>
            <div className="h-64 sm:h-80">
              <Bar
                data={{
                  labels: currentSeller.performanceData.map(
                    (data) => data.month
                  ),
                  datasets: [
                    {
                      label: "Sales",
                      data: currentSeller.performanceData.map(
                        (data) => data.sales
                      ),
                      backgroundColor: "rgba(75, 192, 192, 0.5)",
                      borderColor: "rgb(75, 192, 192)",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerAnalytics;
