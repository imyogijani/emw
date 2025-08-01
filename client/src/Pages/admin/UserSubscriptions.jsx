import React from "react";
import { FaUser, FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import "./UserSubscriptions.css";

const UserSubscriptions = () => {
  const subscriptions = [
    {
      id: 1,
      name: "Alice Smith",
      email: "alice.smith@example.com",
      plan: "Premium",
      startDate: "2023-01-15",
      endDate: "2024-01-15",
      status: "Active",
    },
    {
      id: 2,
      name: "Bob Johnson",
      email: "bob.j@example.com",
      plan: "Standard",
      startDate: "2023-03-01",
      endDate: "2024-03-01",
      status: "Active",
    },
    {
      id: 3,
      name: "Charlie Brown",
      email: "charlie.b@example.com",
      plan: "Basic",
      startDate: "2023-05-20",
      endDate: "2024-05-20",
      status: "Pending",
    },
    {
      id: 4,
      name: "Diana Prince",
      email: "diana.p@example.com",
      plan: "Premium",
      startDate: "2022-11-10",
      endDate: "2023-11-10",
      status: "Expired",
    },
  ];

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <FaCheckCircle className="status-icon active" />;
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'expired':
        return <FaTimesCircle className="status-icon expired" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    return `status-badge ${status.toLowerCase()}`;
  };

  return (
    <div className="subscriptions-container">
      <div className="admin-header">
        <h1>User Subscriptions</h1>
        <p className="admin-subtitle">Manage and monitor user subscription status</p>
      </div>

      <div className="subscription-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUser />
          </div>
          <div className="stat-details">
            <h3>Total Subscribers</h3>
            <p>{subscriptions.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-details">
            <h3>Active Subscriptions</h3>
            <p>{subscriptions.filter(sub => sub.status === 'Active').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-details">
            <h3>Pending Subscriptions</h3>
            <p>{subscriptions.filter(sub => sub.status === 'Pending').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaTimesCircle />
          </div>
          <div className="stat-details">
            <h3>Expired Subscriptions</h3>
            <p>{subscriptions.filter(sub => sub.status === 'Expired').length}</p>
          </div>
        </div>
      </div>

      <div className="subscriptions-table-container">
        <div className="table-header">
          <h2>Subscription Details</h2>
        </div>
        <div className="table-responsive">
          <table className="subscriptions-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div className="user-info">
                      <FaUser className="user-icon" />
                      <span>{sub.name}</span>
                    </div>
                  </td>
                  <td>{sub.email}</td>
                  <td>{sub.plan}</td>
                  <td>
                    <div className="date-info">
                      <FaCalendarAlt className="date-icon" />
                      <span>{sub.startDate}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      <FaCalendarAlt className="date-icon" />
                      <span>{sub.endDate}</span>
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      {getStatusIcon(sub.status)}
                      <span className={getStatusClass(sub.status)}>
                        {sub.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserSubscriptions;
