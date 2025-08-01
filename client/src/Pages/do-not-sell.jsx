import React from 'react';

const DoNotSell = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Do Not Sell or Share My Personal Information</h1>
      <p>At E-Mall World, we respect your privacy and are committed to protecting your personal information. This page provides information on your rights regarding the sale or sharing of your personal information, particularly for residents of states with relevant privacy laws.</p>
      <h2>Your Rights</h2>
      <p>Depending on your state of residence, you may have the right to:</p>
      <ul>
        <li>Opt-out of the sale of your personal information.</li>
        <li>Opt-out of the sharing of your personal information for cross-context behavioral advertising.</li>
        <li>Request that we delete personal information that we have collected from you.</li>
        <li>Request that we correct inaccurate personal information that we maintain about you.</li>
        <li>Request to know what personal information we collect, use, disclose, and sell.</li>
      </ul>
      <h2>How to Exercise Your Rights</h2>
      <p>To exercise your right to opt-out of the sale or sharing of your personal information, please fill out the form below. You may also contact us directly using the contact information provided at the bottom of this page.</p>
      <form style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="fullName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name:</label>
          <input type="text" id="fullName" name="fullName" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email Address:</label>
          <input type="email" id="email" name="email" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="state" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>State of Residence:</label>
          <input type="text" id="state" name="state" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input type="checkbox" id="optOutSale" name="optOutSale" style={{ marginRight: '10px' }} />
          <label htmlFor="optOutSale">Opt-out of the Sale of My Personal Information</label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input type="checkbox" id="optOutShare" name="optOutShare" style={{ marginRight: '10px' }} />
          <label htmlFor="optOutShare">Opt-out of the Sharing of My Personal Information</label>
        </div>
        <button type="submit" style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Submit Request</button>
      </form>
      <h2>Contact Us</h2>
      <p>If you have any questions about your privacy rights or wish to make a request, please contact us:</p>
      <ul>
        <li>Email: privacy@emallworld.com</li>
        <li>Phone: [Your Phone Number]</li>
      </ul>
    </div>
  );
};

export default DoNotSell;