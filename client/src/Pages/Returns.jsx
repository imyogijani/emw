import React, { useState } from 'react';
import './Returns.css';
import { Package, RefreshCw, Shield, Clock, CheckCircle, AlertCircle, ArrowLeft, Calendar } from 'lucide-react';

const Returns = () => {
  const [activeTab, setActiveTab] = useState('policy');
  const [returnForm, setReturnForm] = useState({
    orderNumber: '',
    reason: '',
    description: '',
    email: ''
  });

  const handleInputChange = (e) => {
    setReturnForm({
      ...returnForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitReturn = (e) => {
    e.preventDefault();
    // Handle return request submission
    alert('Return request submitted successfully! We will contact you within 24 hours.');
  };

  const returnReasons = [
    'Defective/Damaged item',
    'Wrong item received',
    'Item not as described',
    'Changed my mind',
    'Size/fit issues',
    'Quality issues',
    'Other'
  ];

  return (
    <div className="returns-container">
      {/* Hero Section */}
      <section className="returns-hero">
        <div className="hero-content">
          <h1>Returns & Refunds</h1>
          <p>Easy returns within 30 days. We're here to make it simple and hassle-free.</p>
        </div>
      </section>

      <div className="container">
        {/* Navigation Tabs */}
        <div className="returns-nav">
          <button 
            className={`nav-btn ${activeTab === 'policy' ? 'active' : ''}`}
            onClick={() => setActiveTab('policy')}
          >
            Return Policy
          </button>
          <button 
            className={`nav-btn ${activeTab === 'process' ? 'active' : ''}`}
            onClick={() => setActiveTab('process')}
          >
            Return Process
          </button>
          <button 
            className={`nav-btn ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            Request Return
          </button>
        </div>

        {/* Return Policy Tab */}
        {activeTab === 'policy' && (
          <section className="policy-section">
            <div className="policy-grid">
              <div className="policy-main">
                <h2>Our Return Policy</h2>
                <div className="policy-highlights">
                  <div className="highlight-item">
                    <Calendar className="highlight-icon" />
                    <div>
                      <h3>30-Day Return Window</h3>
                      <p>Return items within 30 days of delivery for a full refund</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <RefreshCw className="highlight-icon" />
                    <div>
                      <h3>Free Return Shipping</h3>
                      <p>We provide prepaid return labels for your convenience</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <Shield className="highlight-icon" />
                    <div>
                      <h3>Money-Back Guarantee</h3>
                      <p>Full refund processed within 5-7 business days</p>
                    </div>
                  </div>
                </div>

                <div className="policy-details">
                  <h3>What Can Be Returned?</h3>
                  <div className="return-conditions">
                    <div className="condition-group">
                      <h4><CheckCircle className="condition-icon success" /> Returnable Items</h4>
                      <ul>
                        <li>Items in original condition with tags attached</li>
                        <li>Unopened electronics in original packaging</li>
                        <li>Clothing and accessories (unworn, with tags)</li>
                        <li>Home goods and furniture (unassembled)</li>
                        <li>Books and media in original condition</li>
                      </ul>
                    </div>
                    <div className="condition-group">
                      <h4><AlertCircle className="condition-icon warning" /> Non-Returnable Items</h4>
                      <ul>
                        <li>Personalized or customized items</li>
                        <li>Perishable goods and food items</li>
                        <li>Intimate apparel and swimwear</li>
                        <li>Digital downloads and gift cards</li>
                        <li>Items damaged by misuse</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="policy-sidebar">
                <div className="quick-facts">
                  <h3>Quick Facts</h3>
                  <div className="fact-item">
                    <Clock className="fact-icon" />
                    <div>
                      <strong>Processing Time</strong>
                      <p>1-2 business days</p>
                    </div>
                  </div>
                  <div className="fact-item">
                    <Package className="fact-icon" />
                    <div>
                      <strong>Return Shipping</strong>
                      <p>Free prepaid labels</p>
                    </div>
                  </div>
                  <div className="fact-item">
                    <RefreshCw className="fact-icon" />
                    <div>
                      <strong>Refund Time</strong>
                      <p>5-7 business days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Return Process Tab */}
        {activeTab === 'process' && (
          <section className="process-section">
            <h2>How to Return an Item</h2>
            <div className="process-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Initiate Return</h3>
                  <p>Fill out our return request form with your order details and reason for return.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Get Return Label</h3>
                  <p>We'll email you a prepaid return shipping label within 24 hours.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Pack & Ship</h3>
                  <p>Pack the item in its original packaging and attach the return label.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Get Refund</h3>
                  <p>Once we receive and inspect your return, we'll process your refund.</p>
                </div>
              </div>
            </div>

            <div className="process-tips">
              <h3>Return Tips</h3>
              <div className="tips-grid">
                <div className="tip-card">
                  <Package className="tip-icon" />
                  <h4>Original Packaging</h4>
                  <p>Keep items in original packaging when possible for faster processing.</p>
                </div>
                <div className="tip-card">
                  <Clock className="tip-icon" />
                  <h4>Act Quickly</h4>
                  <p>Start your return within 30 days of delivery to ensure eligibility.</p>
                </div>
                <div className="tip-card">
                  <Shield className="tip-icon" />
                  <h4>Track Your Return</h4>
                  <p>Use the tracking number on your return label to monitor progress.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Request Return Tab */}
        {activeTab === 'request' && (
          <section className="request-section">
            <div className="request-form-container">
              <h2>Request a Return</h2>
              <form onSubmit={handleSubmitReturn} className="return-form">
                <div className="form-group">
                  <label htmlFor="orderNumber">Order Number *</label>
                  <input
                    type="text"
                    id="orderNumber"
                    name="orderNumber"
                    value={returnForm.orderNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your order number (e.g., EMW123456789)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={returnForm.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason for Return *</label>
                  <select
                    id="reason"
                    name="reason"
                    value={returnForm.reason}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a reason</option>
                    {returnReasons.map((reason, index) => (
                      <option key={index} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Additional Details</label>
                  <textarea
                    id="description"
                    name="description"
                    value={returnForm.description}
                    onChange={handleInputChange}
                    placeholder="Please provide additional details about your return request..."
                    rows="4"
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">
                  Submit Return Request
                </button>
              </form>
            </div>

            <div className="request-info">
              <h3>What Happens Next?</h3>
              <div className="next-steps">
                <div className="next-step">
                  <div className="step-icon">1</div>
                  <p>We'll review your return request within 24 hours</p>
                </div>
                <div className="next-step">
                  <div className="step-icon">2</div>
                  <p>You'll receive a return authorization email with instructions</p>
                </div>
                <div className="next-step">
                  <div className="step-icon">3</div>
                  <p>Print the prepaid return label and ship your item</p>
                </div>
                <div className="next-step">
                  <div className="step-icon">4</div>
                  <p>Receive your refund within 5-7 business days</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Returns;