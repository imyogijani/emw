import React, { useState } from 'react';
import './BecomeSeller.css';
import { 
  Store, 
  TrendingUp, 
  Users, 
  Shield, 
  Headphones, 
  Globe,
  CheckCircle,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  CreditCard,
  Upload,
  Star,
  DollarSign,
  Package,
  Truck
} from 'lucide-react';

const BecomeSeller = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    // Business Info
    businessName: '',
    businessType: '',
    businessAddress: '',
    gstNumber: '',
    panNumber: '',
    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Reach millions of customers and scale your business with our platform'
    },
    {
      icon: Users,
      title: 'Large Customer Base',
      description: 'Access to over 10 million active customers across the country'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Get paid securely and on time with our trusted payment system'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated seller support team to help you succeed'
    },
    {
      icon: Globe,
      title: 'Pan-India Reach',
      description: 'Sell across India with our extensive logistics network'
    },
    {
      icon: Package,
      title: 'Easy Inventory Management',
      description: 'Manage your products and inventory with our seller tools'
    }
  ];

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Basic details about you' },
    { number: 2, title: 'Business Information', description: 'Your business details' },
    { number: 3, title: 'Bank Details', description: 'Payment information' },
    { number: 4, title: 'Documents', description: 'Upload required documents' }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      business: 'Electronics Store',
      rating: 5,
      comment: 'E-Mall World helped me grow my business by 300% in just 6 months!',
      image: '/api/placeholder/60/60'
    },
    {
      name: 'Priya Sharma',
      business: 'Fashion Boutique',
      rating: 5,
      comment: 'The platform is user-friendly and the support team is amazing.',
      image: '/api/placeholder/60/60'
    },
    {
      name: 'Mohammed Ali',
      business: 'Home Decor',
      rating: 5,
      comment: 'Best decision I made for my business. Highly recommended!',
      image: '/api/placeholder/60/60'
    }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <div className="input-group">
                  <User className="input-icon" size={20} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-group">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <div className="input-group">
                  <Phone className="input-icon" size={20} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h3>Business Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Business Name *</label>
                <div className="input-group">
                  <Building className="input-icon" size={20} />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter your business name"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Business Type *</label>
                <div className="input-group">
                  <Store className="input-icon" size={20} />
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select business type</option>
                    <option value="individual">Individual</option>
                    <option value="proprietorship">Proprietorship</option>
                    <option value="partnership">Partnership</option>
                    <option value="private_limited">Private Limited</option>
                    <option value="public_limited">Public Limited</option>
                  </select>
                </div>
              </div>
              <div className="form-group full-width">
                <label>Business Address *</label>
                <div className="input-group">
                  <MapPin className="input-icon" size={20} />
                  <textarea
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your complete business address"
                    rows="3"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <div className="input-group">
                  <FileText className="input-icon" size={20} />
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="Enter GST number (if applicable)"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>PAN Number *</label>
                <div className="input-group">
                  <FileText className="input-icon" size={20} />
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder="Enter PAN number"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h3>Bank Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Bank Name *</label>
                <div className="input-group">
                  <Building className="input-icon" size={20} />
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Enter bank name"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Account Number *</label>
                <div className="input-group">
                  <CreditCard className="input-icon" size={20} />
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter account number"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>IFSC Code *</label>
                <div className="input-group">
                  <FileText className="input-icon" size={20} />
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="Enter IFSC code"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Account Holder Name *</label>
                <div className="input-group">
                  <User className="input-icon" size={20} />
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Enter account holder name"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="step-content">
            <h3>Upload Documents</h3>
            <div className="document-upload">
              <div className="upload-item">
                <div className="upload-header">
                  <FileText size={24} />
                  <div>
                    <h4>PAN Card</h4>
                    <p>Upload a clear image of your PAN card</p>
                  </div>
                </div>
                <div className="upload-area">
                  <Upload size={32} />
                  <p>Click to upload or drag and drop</p>
                  <span>PNG, JPG up to 5MB</span>
                </div>
              </div>
              <div className="upload-item">
                <div className="upload-header">
                  <FileText size={24} />
                  <div>
                    <h4>Address Proof</h4>
                    <p>Aadhaar card, utility bill, or bank statement</p>
                  </div>
                </div>
                <div className="upload-area">
                  <Upload size={32} />
                  <p>Click to upload or drag and drop</p>
                  <span>PNG, JPG up to 5MB</span>
                </div>
              </div>
              <div className="upload-item">
                <div className="upload-header">
                  <FileText size={24} />
                  <div>
                    <h4>Bank Statement</h4>
                    <p>Recent bank statement (last 3 months)</p>
                  </div>
                </div>
                <div className="upload-area">
                  <Upload size={32} />
                  <p>Click to upload or drag and drop</p>
                  <span>PDF, PNG, JPG up to 10MB</span>
                </div>
              </div>
              <div className="upload-item">
                <div className="upload-header">
                  <FileText size={24} />
                  <div>
                    <h4>GST Certificate (Optional)</h4>
                    <p>GST registration certificate if applicable</p>
                  </div>
                </div>
                <div className="upload-area">
                  <Upload size={32} />
                  <p>Click to upload or drag and drop</p>
                  <span>PDF, PNG, JPG up to 5MB</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="become-seller-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Start Selling on E-Mall World</h1>
              <p>Join thousands of successful sellers and grow your business with India's fastest-growing e-commerce platform</p>
              <div className="hero-stats">
                <div className="stat">
                  <DollarSign className="stat-icon" />
                  <div>
                    <h3>₹50L+</h3>
                    <p>Average Annual Revenue</p>
                  </div>
                </div>
                <div className="stat">
                  <Users className="stat-icon" />
                  <div>
                    <h3>10M+</h3>
                    <p>Active Customers</p>
                  </div>
                </div>
                <div className="stat">
                  <Truck className="stat-icon" />
                  <div>
                    <h3>500+</h3>
                    <p>Cities Covered</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic">
                <Store size={120} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Sell on E-Mall World?</h2>
            <p>Discover the benefits of partnering with us</p>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="benefit-card">
                  <div className="benefit-icon">
                    <IconComponent size={40} />
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="registration-section">
        <div className="container">
          <div className="registration-content">
            <div className="form-container">
              <div className="form-header">
                <h2>Seller Registration</h2>
                <p>Complete the form below to start your selling journey</p>
              </div>

              {/* Progress Steps */}
              <div className="progress-steps">
                {steps.map((step) => (
                  <div 
                    key={step.number} 
                    className={`step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
                  >
                    <div className="step-number">
                      {currentStep > step.number ? <CheckCircle size={20} /> : step.number}
                    </div>
                    <div className="step-info">
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="registration-form">
                {renderStepContent()}

                <div className="form-navigation">
                  {currentStep > 1 && (
                    <button type="button" className="btn btn-medium btn-secondary prev-btn" onClick={handlePrevStep}>
                      <span className="text">Previous</span>
                    </button>
                  )}
                  {currentStep < 4 ? (
                    <button type="button" className="btn btn-medium btn-primary next-btn" onClick={handleNextStep}>
                      <span className="text">Next Step</span>
                      <span className="sparkle"><ArrowRight size={20} /></span>
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-medium btn-success submit-btn">
                      <span className="text">Submit Application</span>
                      <span className="sparkle"><CheckCircle size={20} /></span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Sidebar */}
            <div className="form-sidebar">
              <div className="help-card">
                <h3>Need Help?</h3>
                <p>Our seller support team is here to assist you</p>
                <div className="contact-info">
                  <div className="contact-item">
                    <Phone size={16} />
                    <span>1800-123-4567</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={16} />
                    <span>seller-support@emallworld.com</span>
                  </div>
                </div>
              </div>

              <div className="requirements-card">
                <h3>Requirements</h3>
                <ul>
                  <li><CheckCircle size={16} /> Valid PAN card</li>
                  <li><CheckCircle size={16} /> Bank account details</li>
                  <li><CheckCircle size={16} /> Address proof</li>
                  <li><CheckCircle size={16} /> GST registration (if applicable)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Sellers Say</h2>
            <p>Success stories from our seller community</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <img src={testimonial.image} alt={testimonial.name} />
                  <div>
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.business}</p>
                  </div>
                  <div className="rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                </div>
                <p className="testimonial-text">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;