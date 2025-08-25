import React, { useState } from 'react';
import './Partner.css';
import { showErrorToast, showSuccessToast, validateForm } from '../utils/errorHandler';
import { 
  Handshake, 
  TrendingUp, 
  Globe, 
  Users, 
  Shield, 
  Award,
  CheckCircle,
  ArrowRight,
  Building,
  Mail,
  Phone,
  User,
  FileText,
  MapPin,
  Briefcase,
  Target,
  Zap,
  Heart,
  Star,
  DollarSign
} from 'lucide-react';

const Partner = () => {
  const [partnershipType, setPartnershipType] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    partnershipType: '',
    businessDescription: '',
    expectedRevenue: '',
    message: ''
  });

  const partnershipTypes = [
    {
      id: 'logistics',
      title: 'Logistics Partner',
      description: 'Join our delivery network and help us reach customers faster',
      icon: Target,
      benefits: ['Flexible working hours', 'Competitive rates', 'Technology support', 'Training provided']
    },
    {
      id: 'technology',
      title: 'Technology Partner',
      description: 'Collaborate on innovative solutions and integrations',
      icon: Zap,
      benefits: ['API access', 'Technical support', 'Co-marketing opportunities', 'Revenue sharing']
    },
    {
      id: 'marketing',
      title: 'Marketing Partner',
      description: 'Help us reach new audiences and grow together',
      icon: TrendingUp,
      benefits: ['Brand collaboration', 'Shared campaigns', 'Performance bonuses', 'Creative freedom']
    },
    {
      id: 'financial',
      title: 'Financial Partner',
      description: 'Provide financial services to our seller ecosystem',
      icon: DollarSign,
      benefits: ['Access to seller base', 'White-label solutions', 'Revenue sharing', 'Risk mitigation']
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Accelerated Growth',
      description: 'Leverage our platform to scale your business rapidly'
    },
    {
      icon: Globe,
      title: 'Market Expansion',
      description: 'Access new markets and customer segments across India'
    },
    {
      icon: Users,
      title: 'Shared Resources',
      description: 'Benefit from our technology, expertise, and network'
    },
    {
      icon: Shield,
      title: 'Risk Mitigation',
      description: 'Reduce business risks through strategic collaboration'
    },
    {
      icon: Award,
      title: 'Brand Association',
      description: 'Enhance your brand value through partnership with us'
    },
    {
      icon: Heart,
      title: 'Long-term Commitment',
      description: 'Build lasting relationships for mutual success'
    }
  ];

  const successStories = [
    {
      company: 'FastTrack Logistics',
      type: 'Logistics Partner',
      growth: '300%',
      description: 'Increased delivery capacity by 300% within 6 months of partnership',
      image: '/api/placeholder/80/80'
    },
    {
      company: 'TechSolutions Inc',
      type: 'Technology Partner',
      growth: '250%',
      description: 'Expanded client base by 250% through our platform integration',
      image: '/api/placeholder/80/80'
    },
    {
      company: 'Creative Marketing Co',
      type: 'Marketing Partner',
      growth: '400%',
      description: 'Achieved 400% ROI on collaborative marketing campaigns',
      image: '/api/placeholder/80/80'
    }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePartnershipSelect = (type) => {
    setPartnershipType(type);
    setFormData({
      ...formData,
      partnershipType: type
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    const validationRules = {
      companyName: {
        required: true,
        requiredMessage: "Company name is required"
      },
      contactPerson: {
        required: true,
        requiredMessage: "Contact person name is required"
      },
      email: {
        required: true,
        requiredMessage: "Email is required",
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: "Please enter a valid email address"
      },
      phone: {
        required: true,
        requiredMessage: "Phone number is required",
        minLength: 10,
        minLengthMessage: "Phone number must be at least 10 digits"
      },
      partnershipType: {
        required: true,
        requiredMessage: "Please select a partnership type"
      },
      businessDescription: {
        required: true,
        requiredMessage: "Business description is required",
        minLength: 50,
        minLengthMessage: "Please provide a detailed business description (at least 50 characters)"
      }
    };

    const { isValid } = validateForm(formData, validationRules);
    
    if (!isValid) {
      return;
    }

    try {
      // Handle form submission
      console.log('Partnership application submitted:', formData);
      showSuccessToast('Partnership application submitted successfully! We will contact you soon.', 'Partnership Application');
      
      // Reset form
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        partnershipType: '',
        businessDescription: '',
        expectedRevenue: '',
        message: ''
      });
      setPartnershipType('');
    } catch (error) {
      showErrorToast('Failed to submit partnership application. Please try again.', 'Partnership Application', { error });
    }
  };

  return (
    <div className="partner-container">
      {/* Hero Section */}
      <div className="partner-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Partner with E-Mall World</h1>
              <p>Join forces with India's fastest-growing e-commerce platform and unlock new opportunities for growth and success</p>
              <div className="hero-stats">
                <div className="stat">
                  <Building className="stat-icon" />
                  <div>
                    <h3>500+</h3>
                    <p>Active Partners</p>
                  </div>
                </div>
                <div className="stat">
                  <TrendingUp className="stat-icon" />
                  <div>
                    <h3>₹100Cr+</h3>
                    <p>Partner Revenue</p>
                  </div>
                </div>
                <div className="stat">
                  <Globe className="stat-icon" />
                  <div>
                    <h3>50+</h3>
                    <p>Cities Covered</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic">
                <Handshake size={120} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partnership Types */}
      <div className="partnership-types-section">
        <div className="container">
          <div className="section-header">
            <h2>Partnership Opportunities</h2>
            <p>Choose the partnership model that aligns with your business goals</p>
          </div>
          <div className="partnership-grid">
            {partnershipTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <div 
                  key={type.id} 
                  className={`partnership-card ${partnershipType === type.id ? 'selected' : ''}`}
                  onClick={() => handlePartnershipSelect(type.id)}
                >
                  <div className="partnership-icon">
                    <IconComponent size={40} />
                  </div>
                  <h3>{type.title}</h3>
                  <p>{type.description}</p>
                  <div className="benefits-list">
                    {type.benefits.map((benefit, index) => (
                      <div key={index} className="benefit-item">
                        <CheckCircle size={16} />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <button className="select-btn">
                    {partnershipType === type.id ? 'Selected' : 'Select This'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Partner with Us?</h2>
            <p>Discover the advantages of joining our partner ecosystem</p>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="benefit-card">
                  <div className="benefit-icon">
                    <IconComponent size={32} />
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="application-section">
        <div className="container">
          <div className="application-content">
            <div className="form-container">
              <div className="form-header">
                <h2>Partnership Application</h2>
                <p>Tell us about your business and how we can work together</p>
              </div>

              <form onSubmit={handleSubmit} className="partnership-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <div className="input-group">
                      <Building className="input-icon" size={20} />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Enter your company name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contact Person *</label>
                    <div className="input-group">
                      <User className="input-icon" size={20} />
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        placeholder="Enter contact person name"
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
                        placeholder="Enter email address"
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
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Website</label>
                    <div className="input-group">
                      <Globe className="input-icon" size={20} />
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="Enter website URL"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Partnership Type *</label>
                    <div className="input-group">
                      <Briefcase className="input-icon" size={20} />
                      <select
                        name="partnershipType"
                        value={formData.partnershipType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select partnership type</option>
                        <option value="logistics">Logistics Partner</option>
                        <option value="technology">Technology Partner</option>
                        <option value="marketing">Marketing Partner</option>
                        <option value="financial">Financial Partner</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Company Address *</label>
                    <div className="input-group">
                      <MapPin className="input-icon" size={20} />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter complete company address"
                        rows="3"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Business Description *</label>
                    <div className="input-group">
                      <FileText className="input-icon" size={20} />
                      <textarea
                        name="businessDescription"
                        value={formData.businessDescription}
                        onChange={handleInputChange}
                        placeholder="Describe your business, services, and how you can add value to our partnership"
                        rows="4"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Expected Annual Revenue</label>
                    <div className="input-group">
                      <DollarSign className="input-icon" size={20} />
                      <select
                        name="expectedRevenue"
                        value={formData.expectedRevenue}
                        onChange={handleInputChange}
                      >
                        <option value="">Select revenue range</option>
                        <option value="0-10L">₹0 - ₹10 Lakhs</option>
                        <option value="10L-50L">₹10 Lakhs - ₹50 Lakhs</option>
                        <option value="50L-1Cr">₹50 Lakhs - ₹1 Crore</option>
                        <option value="1Cr-5Cr">₹1 Crore - ₹5 Crores</option>
                        <option value="5Cr+">₹5 Crores+</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Additional Message</label>
                    <div className="input-group">
                      <FileText className="input-icon" size={20} />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Any additional information you'd like to share"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="submit-btn">
                  Submit Application
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>

            <div className="form-sidebar">
              <div className="contact-card">
                <h3>Get in Touch</h3>
                <p>Have questions about our partnership program?</p>
                <div className="contact-info">
                  <div className="contact-item">
                    <Phone size={16} />
                    <span>1800-123-4567</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={16} />
                    <span>partnerships@emallworld.com</span>
                  </div>
                </div>
              </div>

              <div className="process-card">
                <h3>Application Process</h3>
                <div className="process-steps">
                  <div className="process-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Submit Application</h4>
                      <p>Fill out the partnership form</p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Initial Review</h4>
                      <p>We review your application</p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Discussion</h4>
                      <p>Detailed discussion about partnership</p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Agreement</h4>
                      <p>Finalize partnership terms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="success-stories-section">
        <div className="container">
          <div className="section-header">
            <h2>Partner Success Stories</h2>
            <p>See how our partners have grown with us</p>
          </div>
          <div className="stories-grid">
            {successStories.map((story, index) => (
              <div key={index} className="story-card">
                <div className="story-header">
                  <img src={story.image} alt={story.company} />
                  <div>
                    <h3>{story.company}</h3>
                    <p>{story.type}</p>
                  </div>
                  <div className="growth-badge">
                    <TrendingUp size={16} />
                    <span>{story.growth}</span>
                  </div>
                </div>
                <p className="story-description">{story.description}</p>
                <div className="story-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partner;