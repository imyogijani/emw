import React, { useState } from "react";
import "./footer.css";

import mallimage from "../../images/Mall1.png";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Send,
  ArrowUp,
} from "lucide-react";

const quickLinks = [
  { name: "Track Order", link: "/track-order" },
  { name: "Customer Support", link: "/help" },
  { name: "Return Policy", link: "/returns" },
  { name: "My Account", link: "/account" },
];

const companyInfo = [
  { name: "About Us", link: "/about" },
  { name: "Careers", link: "/careers" },
  { name: "Privacy Policy", link: "/privacy" },
  { name: "Terms of Service", link: "/terms" },
];

const sellerLinks = [
  { name: "Become a Seller", link: "/become-seller" },
  { name: "Seller Dashboard", link: "/seller-dashboard" },
  { name: "Partner with Us", link: "/partner" },
  { name: "Bulk Orders", link: "/bulk-orders" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          {/* Main Footer Content */}
          <div className="footer-main">
            {/* Brand Section */}
            <div className="footer-brand">
              <div className="logo">
                <img src={mallimage} alt="E-Mall World" />
              </div>
              <h3>E-Mall World</h3>
              <p>
                Your trusted shopping destination with quality products and
                excellent service.
              </p>

              {/* Newsletter */}
              <div className="newsletter-section">
                <h4>Stay Updated</h4>
                <form onSubmit={handleSubscribe} className="newsletter-form">
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit">
                      <Send size={14} />
                    </button>
                  </div>
                </form>
                {isSubscribed && (
                  <div className="success-msg">
                    ✓ Thank you for subscribing!
                  </div>
                )}
              </div>
            </div>

            {/* Links Sections */}
            <div className="footer-links">
              <div className="links-column combined-links">
                <div className="links-group">
                  <h4>Quick Links</h4>
                  <ul>
                    {quickLinks.map((item, index) => (
                      <li key={index}>
                        <a href={item.link}>{item.name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="links-group">
                  <h4>Company</h4>
                  <ul>
                    {companyInfo.map((item, index) => (
                      <li key={index}>
                        <a href={item.link}>{item.name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="links-column">
                <h4>Sell With Us</h4>
                <ul>
                  {sellerLinks.map((item, index) => (
                    <li key={index}>
                      <a href={item.link}>{item.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact & Social */}
            <div className="footer-contact">
              <h4>Contact Us</h4>
              <div className="contact-item">
                <Phone size={16} />
                <a href="tel:+919601900290">+91 96019 00290</a>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <a href="mailto:support@emallworld.com">
                  support@emallworld.com
                </a>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>Ahmedabad, India</span>
              </div>

              {/* Social Icons */}
              <div className="social-icons">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>
              © {new Date().getFullYear()} E-Mall World by Kenayo All Rights
              Reserved.
            </p>
            <div className="payment-methods">
              <span>We Accept:</span>
              <div className="payment-icons">
                <span className="payment-icon">💳</span>
                <span className="payment-icon">🏦</span>
                <span className="payment-icon">📱</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to Top */}
        {showScrollTop && (
          <button
            className="scroll-to-top"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </footer>
    </>
  );
}
