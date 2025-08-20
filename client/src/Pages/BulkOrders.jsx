import React, { useState } from 'react';
import './BulkOrders.css';
import { 
  Package, 
  Users, 
  TrendingUp, 
  Shield, 
  Truck, 
  HeadphonesIcon,
  CheckCircle,
  Star,
  ArrowRight,
  Building,
  Mail,
  Phone,
  User,
  MapPin,
  FileText,
  Calculator,
  Send
} from 'lucide-react';

const BulkOrders = () => {
  const [activeTab, setActiveTab] = useState('benefits');
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    businessType: '',
    orderVolume: '',
    productCategories: [],
    requirements: ''
  });

  const benefits = [
    {
      icon: <TrendingUp />,
      title: 'Volume Discounts',
      description: 'Get up to 40% off on bulk purchases with tiered pricing structure'
    },
    {
      icon: <Truck />,
      title: 'Free Shipping',
      description: 'Complimentary shipping on orders above ₹50,000'
    },
    {
      icon: <HeadphonesIcon />,
      title: 'Dedicated Support',
      description: 'Personal account manager for all your bulk order needs'
    },
    {
      icon: <Shield />,
      title: 'Quality Assurance',
      description: 'Guaranteed quality with easy returns and replacements'
    }
  ];

  const pricingTiers = [
    {
      range: '₹10,000 - ₹50,000',
      discount: '10%',
      features: ['Standard shipping', 'Email support', 'Basic warranty']
    },
    {
      range: '₹50,000 - ₹2,00,000',
      discount: '20%',
      features: ['Free shipping', 'Priority support', 'Extended warranty', 'Flexible payment']
    },
    {
      range: '₹2,00,000+',
      discount: '30-40%',
      features: ['Free express shipping', 'Dedicated manager', 'Custom solutions', 'Net payment terms']
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      company: 'TechCorp Solutions',
      rating: 5,
      comment: 'Excellent service and competitive pricing. Our go-to platform for bulk electronics.'
    },
    {
      name: 'Priya Sharma',
      company: 'Office Supplies Ltd',
      rating: 5,
      comment: 'The dedicated support team made our large order process seamless and efficient.'
    },
    {
      name: 'Amit Patel',
      company: 'Retail Chain India',
      rating: 5,
      comment: 'Great discounts and reliable delivery. Highly recommend for bulk purchases.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter(c => c !== category)
        : [...prev.productCategories, category]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Bulk order inquiry:', formData);
    alert('Thank you for your inquiry! Our team will contact you within 24 hours.');
  };

  return (
    <div className="bulk-orders-container">
      {/* Hero Section */}
      <section className="bulk-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Bulk Orders Made Simple</h1>
              <p>Get the best deals on bulk purchases with personalized service and competitive pricing</p>
              <div className="hero-stats">
                <div className="stat">
                  <Package className="stat-icon" />
                  <div>
                    <h3>10,000+</h3>
                    <p>Products Available</p>
                  </div>
                </div>
                <div className="stat">
                  <Users className="stat-icon" />
                  <div>
                    <h3>500+</h3>
                    <p>Business Partners</p>
                  </div>
                </div>
                <div className="stat">
                  <TrendingUp className="stat-icon" />
                  <div>
                    <h3>40%</h3>
                    <p>Max Discount</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic">
                <Package size={100} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bulk-navigation">
        <div className="container">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'benefits' ? 'active' : ''}`}
              onClick={() => setActiveTab('benefits')}
            >
              Benefits
            </button>
            <button 
              className={`nav-tab ${activeTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setActiveTab('pricing')}
            >
              Pricing
            </button>
            <button 
              className={`nav-tab ${activeTab === 'inquiry' ? 'active' : ''}`}
              onClick={() => setActiveTab('inquiry')}
            >
              Get Quote
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {activeTab === 'benefits' && (
        <section className="benefits-section">
          <div className="container">
            <div className="section-header">
              <h2>Why Choose Our Bulk Orders?</h2>
              <p>Experience the advantages of partnering with E-Mall World for your bulk purchasing needs</p>
            </div>
            <div className="benefits-grid">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-card">
                  <div className="benefit-icon">
                    {benefit.icon}
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              ))}
            </div>
            
            <div className="process-section">
              <h3>How It Works</h3>
              <div className="process-steps">
                <div className="process-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Submit Inquiry</h4>
                    <p>Fill out our bulk order form with your requirements</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Get Custom Quote</h4>
                    <p>Receive personalized pricing within 24 hours</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Place Order</h4>
                    <p>Confirm your order with flexible payment options</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Fast Delivery</h4>
                    <p>Get your products delivered on time with tracking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {activeTab === 'pricing' && (
        <section className="pricing-section">
          <div className="container">
            <div className="section-header">
              <h2>Transparent Pricing Tiers</h2>
              <p>The more you buy, the more you save with our volume-based discount structure</p>
            </div>
            <div className="pricing-grid">
              {pricingTiers.map((tier, index) => (
                <div key={index} className={`pricing-card ${index === 1 ? 'popular' : ''}`}>
                  {index === 1 && <div className="popular-badge">Most Popular</div>}
                  <div className="pricing-header">
                    <h3>{tier.range}</h3>
                    <div className="discount">{tier.discount} OFF</div>
                  </div>
                  <div className="pricing-features">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="feature-item">
                        <CheckCircle size={16} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <button className="pricing-btn">
                    Get Quote <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="additional-info">
              <div className="info-card">
                <h4>Custom Solutions</h4>
                <p>Need something specific? We offer custom packaging, branding, and delivery solutions for large orders.</p>
              </div>
              <div className="info-card">
                <h4>Payment Terms</h4>
                <p>Flexible payment options including net terms, advance payment discounts, and installment plans.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Inquiry Form Section */}
      {activeTab === 'inquiry' && (
        <section className="inquiry-section">
          <div className="container">
            <div className="inquiry-content">
              <div className="form-container">
                <div className="form-header">
                  <h2>Get Your Custom Quote</h2>
                  <p>Tell us about your requirements and we'll provide a personalized quote</p>
                </div>
                
                <form className="bulk-inquiry-form" onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Company Name *</label>
                      <div className="input-group">
                        <Building className="input-icon" size={18} />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          required
                          placeholder="Your company name"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Contact Person *</label>
                      <div className="input-group">
                        <User className="input-icon" size={18} />
                        <input
                          type="text"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleInputChange}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Email Address *</label>
                      <div className="input-group">
                        <Mail className="input-icon" size={18} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <div className="input-group">
                        <Phone className="input-icon" size={18} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Business Address</label>
                      <div className="input-group">
                        <MapPin className="input-icon" size={18} />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Your business address"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Business Type</label>
                      <div className="input-group">
                        <Building className="input-icon" size={18} />
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select business type</option>
                          <option value="retailer">Retailer</option>
                          <option value="wholesaler">Wholesaler</option>
                          <option value="distributor">Distributor</option>
                          <option value="manufacturer">Manufacturer</option>
                          <option value="corporate">Corporate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Expected Order Volume</label>
                      <div className="input-group">
                        <Calculator className="input-icon" size={18} />
                        <select
                          name="orderVolume"
                          value={formData.orderVolume}
                          onChange={handleInputChange}
                        >
                          <option value="">Select volume range</option>
                          <option value="10k-50k">₹10,000 - ₹50,000</option>
                          <option value="50k-200k">₹50,000 - ₹2,00,000</option>
                          <option value="200k-500k">₹2,00,000 - ₹5,00,000</option>
                          <option value="500k+">₹5,00,000+</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Product Categories of Interest</label>
                      <div className="category-checkboxes">
                        {['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty', 'Automotive', 'Office Supplies'].map(category => (
                          <label key={category} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.productCategories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                            />
                            <span>{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Additional Requirements</label>
                      <div className="input-group">
                        <FileText className="input-icon" size={18} />
                        <textarea
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleInputChange}
                          placeholder="Tell us about your specific requirements, timeline, or any special needs..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    <Send size={18} />
                    Submit Inquiry
                  </button>
                </form>
              </div>
              
              <div className="inquiry-sidebar">
                <div className="contact-card">
                  <h3>Need Help?</h3>
                  <p>Our bulk order specialists are here to assist you</p>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Phone size={18} />
                      <span>+91 1800-123-4567</span>
                    </div>
                    <div className="contact-item">
                      <Mail size={18} />
                      <span>bulk@emallworld.com</span>
                    </div>
                  </div>
                </div>
                
                <div className="guarantee-card">
                  <h3>Our Guarantee</h3>
                  <div className="guarantee-items">
                    <div className="guarantee-item">
                      <CheckCircle size={16} />
                      <span>24-hour response time</span>
                    </div>
                    <div className="guarantee-item">
                      <CheckCircle size={16} />
                      <span>Competitive pricing</span>
                    </div>
                    <div className="guarantee-item">
                      <CheckCircle size={16} />
                      <span>Quality assurance</span>
                    </div>
                    <div className="guarantee-item">
                      <CheckCircle size={16} />
                      <span>On-time delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Partners Say</h2>
            <p>Hear from businesses who trust us for their bulk purchasing needs</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.company}</p>
                  </div>
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                </div>
                <p className="testimonial-comment">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BulkOrders;