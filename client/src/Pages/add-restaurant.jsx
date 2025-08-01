import React from 'react';

const AddRestaurant = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Add Your Restaurant to E-Mall World</h1>
      <p>Partner with E-Mall World and reach a wider customer base. Join our platform to grow your business and deliver your delicious food to more people.</p>
      <h2>Why Partner with Us?</h2>
      <ul>
        <li><b>Increased Visibility:</b> Get your restaurant discovered by thousands of E-Mall World users in your area.</li>
        <li><b>More Orders:</b> Expand your reach beyond your physical location and increase your sales.</li>
        <li><b>Easy Management:</b> Our intuitive platform makes it easy to manage your menu, orders, and deliveries.</li>
        <li><b>Dedicated Support:</b> Our team is here to help you every step of the way, from onboarding to daily operations.</li>
      </ul>
      <h2>How It Works</h2>
      <ol>
        <li><b>Sign Up:</b> Fill out our simple online application form.</li>
        <li><b>Onboarding:</b> Our team will help you set up your menu, pricing, and delivery options.</li>
        <li><b>Go Live:</b> Once everything is set up, your restaurant will be live on the E-Mall World platform.</li>
        <li><b>Receive Orders:</b> Start receiving orders from new customers and manage them through our partner portal.</li>
      </ol>
      <h2>Requirements</h2>
      <ul>
        <li>Valid business license and necessary permits.</li>
        <li>Ability to prepare and package food for delivery.</li>
        <li>Reliable internet connection and a device to manage orders.</li>
      </ul>
      <h2>Ready to Join?</h2>
      <p>Fill out the form below to get started, or contact us at partners@emallworld.com for more information.</p>
      <form style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="restaurantName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Restaurant Name:</label>
          <input type="text" id="restaurantName" name="restaurantName" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="contactPerson" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contact Person:</label>
          <input type="text" id="contactPerson" name="contactPerson" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }} />
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
          <label htmlFor="message" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Message (optional):</label>
          <textarea id="message" name="message" rows="4" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
        </div>
        <button type="submit" style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Submit Application</button>
      </form>
    </div>
  );
};

export default AddRestaurant;