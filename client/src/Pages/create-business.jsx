import React from 'react';
import './CreateBusiness.css';

const CreateBusinessAccount = () => {
  return (
    <div className="create-business-container">
      <h1>Create a Business Account with E-Mall World</h1>
      <p>Streamline your corporate food orders and manage expenses with an E-Mall World Business Account. Perfect for companies looking to provide meals for employees or clients.</p>
      <h2>Benefits of a Business Account</h2>
      <ul>
        <li><b>Centralized Billing:</b> Simplify accounting with a single, consolidated invoice for all orders.</li>
        <li><b>Easy Ordering:</b> Allow your employees to order from a wide selection of restaurants with pre-approved budgets.</li>
        <li><b>Dedicated Support:</b> Get priority support from our business account team.</li>
        <li><b>Customizable Options:</b> Tailor your account settings to fit your company's specific needs, including spending limits and order restrictions.</li>
      </ul>
      <h2>How to Set Up Your Account</h2>
      <ol>
        <li><b>Register:</b> Fill out the business account registration form below.</li>
        <li><b>Verification:</b> Our team will review your application and verify your business details.</li>
        <li><b>Setup:</b> Once approved, we'll help you set up your account, add employees, and define your ordering policies.</li>
        <li><b>Start Ordering:</b> Your team can start placing orders immediately.</li>
      </ol>
      <h2>Who Can Benefit?</h2>
      <ul>
        <li>Companies providing employee benefits.</li>
        <li>Businesses hosting client meetings or events.</li>
        <li>Teams working late or on special projects.</li>
        <li>Any organization looking for a convenient and efficient way to manage food orders.</li>
      </ul>
      <h2>Ready to Get Started?</h2>
      <p>Fill out the form below to create your business account, or contact us at business@emallworld.com for a personalized consultation.</p>
      <form className="business-form">
        <div className="form-group">
          <label htmlFor="companyName">Company Name:</label>
          <input type="text" id="companyName" name="companyName" />
        </div>
        <div className="form-group">
          <label htmlFor="contactPerson">Contact Person:</label>
          <input type="text" id="contactPerson" name="contactPerson" />
        </div>
        <div className="form-group">
          <label htmlFor="email">Business Email:</label>
          <input type="email" id="email" name="email" />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number:</label>
          <input type="tel" id="phone" name="phone" />
        </div>
        <div className="form-group">
          <label htmlFor="employees">Number of Employees:</label>
          <input type="number" id="employees" name="employees" />
        </div>
        <button type="submit" className="submit-btn">Create Account</button>
      </form>
    </div>
  );
};

export default CreateBusinessAccount;