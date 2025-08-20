import React, { useState } from 'react';
import './Careers.css';
import { MapPin, Clock, Users, Briefcase, Heart, Zap, Target, Award } from 'lucide-react';

const Careers = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const jobOpenings = [
    {
      id: 1,
      title: 'Frontend Developer',
      department: 'Engineering',
      location: 'Remote / New York',
      type: 'Full-time',
      experience: '2-4 years',
      description: 'Join our frontend team to build amazing user experiences using React, TypeScript, and modern web technologies.'
    },
    {
      id: 2,
      title: 'Backend Developer',
      department: 'Engineering',
      location: 'Remote / San Francisco',
      type: 'Full-time',
      experience: '3-5 years',
      description: 'Build scalable backend systems using Node.js, MongoDB, and cloud technologies to support millions of users.'
    },
    {
      id: 3,
      title: 'Product Manager',
      department: 'Product',
      location: 'New York',
      type: 'Full-time',
      experience: '4-6 years',
      description: 'Lead product strategy and roadmap for our e-commerce platform, working closely with engineering and design teams.'
    },
    {
      id: 4,
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Remote / Los Angeles',
      type: 'Full-time',
      experience: '2-4 years',
      description: 'Create intuitive and beautiful user interfaces that delight our customers and drive business growth.'
    },
    {
      id: 5,
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Chicago',
      type: 'Full-time',
      experience: '2-3 years',
      description: 'Help our customers succeed by providing exceptional support and building long-term relationships.'
    },
    {
      id: 6,
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      experience: '1-3 years',
      description: 'Drive growth through digital marketing campaigns, content creation, and brand awareness initiatives.'
    }
  ];

  const departments = ['all', 'Engineering', 'Product', 'Design', 'Customer Success', 'Marketing'];

  const filteredJobs = selectedDepartment === 'all' 
    ? jobOpenings 
    : jobOpenings.filter(job => job.department === selectedDepartment);

  return (
    <div className="careers-container">
      {/* Hero Section */}
      <section className="careers-hero">
        <div className="hero-content">
          <h1>Join Our Team</h1>
          <p className="hero-subtitle">
            Build the future of e-commerce with us. We're looking for passionate individuals 
            who want to make a difference in how people shop online.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <Users size={30} />
              <span>200+ Team Members</span>
            </div>
            <div className="stat">
              <MapPin size={30} />
              <span>5 Global Offices</span>
            </div>
            <div className="stat">
              <Award size={30} />
              <span>Best Places to Work</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="why-work-section">
        <div className="container">
          <h2>Why Work With Us?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <Heart className="benefit-icon" />
              <h3>Great Culture</h3>
              <p>Collaborative, inclusive environment where everyone's voice matters</p>
            </div>
            <div className="benefit-card">
              <Zap className="benefit-icon" />
              <h3>Growth Opportunities</h3>
              <p>Continuous learning, mentorship, and career advancement paths</p>
            </div>
            <div className="benefit-card">
              <Target className="benefit-icon" />
              <h3>Meaningful Work</h3>
              <p>Build products that impact millions of customers worldwide</p>
            </div>
            <div className="benefit-card">
              <Award className="benefit-icon" />
              <h3>Competitive Benefits</h3>
              <p>Health insurance, flexible PTO, stock options, and more</p>
            </div>
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="jobs-section">
        <div className="container">
          <h2>Open Positions</h2>
          
          {/* Department Filter */}
          <div className="department-filter">
            {departments.map(dept => (
              <button
                key={dept}
                className={`filter-btn ${selectedDepartment === dept ? 'active' : ''}`}
                onClick={() => setSelectedDepartment(dept)}
              >
                {dept === 'all' ? 'All Departments' : dept}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <div className="jobs-grid">
            {filteredJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <h3>{job.title}</h3>
                  <span className="department-tag">{job.department}</span>
                </div>
                <div className="job-details">
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{job.location}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>{job.type}</span>
                  </div>
                  <div className="detail-item">
                    <Briefcase size={16} />
                    <span>{job.experience}</span>
                  </div>
                </div>
                <p className="job-description">{job.description}</p>
                <button className="apply-btn">Apply Now</button>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="no-jobs">
              <p>No positions available in this department at the moment.</p>
              <p>Check back soon or explore other departments!</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Don't See the Right Role?</h2>
            <p>
              We're always looking for talented individuals to join our team. 
              Send us your resume and let us know how you'd like to contribute to E-Mall World.
            </p>
            <button className="cta-btn">Send Your Resume</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;