import React from 'react';

const SignupDeliver = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Sign Up to Deliver with E-Mall World</h1>
      <p>Become a delivery partner with E-Mall World and earn money on your own schedule. Enjoy flexibility and competitive earnings.</p>
      <h2>Why Deliver with Us?</h2>
      <ul>
        <li><b>Flexible Hours:</b> Work when you want, for as long as you want. Perfect for students, part-timers, or anyone looking for a side hustle.</li>
        <li><b>Competitive Earnings:</b> Earn good money for every delivery you complete.</li>
        <li><b>Easy to Use App:</b> Our delivery app makes it simple to accept orders, navigate, and manage your earnings.</li>
        <li><b>Support:</b> We provide dedicated support to our delivery partners to ensure a smooth experience.</li>
      </ul>
      <h2>Requirements</h2>
      <ul>
        <li>Be at least 18 years old.</li>
        <li>Have a valid driver's license and vehicle (car, motorcycle, or bicycle, depending on your city).</li>
        <li>Valid vehicle insurance and registration.</li>
        <li>Smartphone with data plan.</li>
        <li>Ability to pass a background check.</li>
      </ul>
      <h2>How to Get Started</h2>
      <ol>
        <li><b>Apply Online:</b> Fill out our quick online application form.</li>
        <li><b>Document Submission:</b> Upload the required documents (license, registration, insurance).</li>
        <li><b>Background Check:</b> We'll conduct a background check.</li>
        <li><b>Get Approved:</b> Once approved, you'll get access to our delivery app and can start earning!</li>
      </ol>
      <h2>Ready to Start Earning?</h2>
      <p>Fill out the form below to apply, or contact us at drivers@emallworld.com for more information.</p>
      <form style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="fullName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name:</label>
          <input type="text" id="fullName" name="fullName" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input type="email" id="email" name="email" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="phone" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone Number:</label>
          <input type="tel" id="phone" name="phone" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="city" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>City:</label>
          <input type="text" id="city" name="city" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <button type="submit" style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Apply Now</button>
      </form>
    </div>
  );
};

export default SignupDeliver;