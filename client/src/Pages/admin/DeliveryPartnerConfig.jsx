import React from "react";

const DeliveryPartnerConfig = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Delivery Partner API Configuration
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form>
          <div className="mb-4">
            <label
              htmlFor="partnerName"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Partner Name:
            </label>
            <input
              type="text"
              id="partnerName"
              name="partnerName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., FedEx, UPS"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="apiKey"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              API Key:
            </label>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter API Key"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="apiEndpoint"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              API Endpoint:
            </label>
            <input
              type="url"
              id="apiEndpoint"
              name="apiEndpoint"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., https://api.fedex.com/v2"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="deliveryZones"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Delivery Zones (comma-separated):
            </label>
            <input
              type="text"
              id="deliveryZones"
              name="deliveryZones"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., Zone A, Zone B"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Save Configuration
            </button>
          </div>
        </form>

        <h2 className="text-xl font-semibold mb-4">
          Existing Delivery Partners
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white table-auto">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Partner Name</th>
                <th className="py-2 px-4 border-b text-left">API Key</th>
                <th className="py-2 px-4 border-b text-left">API Endpoint</th>
                <th className="py-2 px-4 border-b text-left">Delivery Zones</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample Data - Replace with actual data from state/props */}
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">FedEx</td>
                <td className="py-2 px-4 border-b">fedex_key_123</td>
                <td className="py-2 px-4 border-b">https://api.fedex.com/v2</td>
                <td className="py-2 px-4 border-b">Zone A, Zone B</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">UPS</td>
                <td className="py-2 px-4 border-b">ups_key_456</td>
                <td className="py-2 px-4 border-b">https://api.ups.com/v1</td>
                <td className="py-2 px-4 border-b">Zone C, Zone D</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPartnerConfig;
