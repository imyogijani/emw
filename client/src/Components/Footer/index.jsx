import React, { useState } from "react";
import "./footer-modern.css";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Send,
  ArrowUp,
  CreditCard,
  Truck,
  Shield,
  RotateCcw
} from "lucide-react";

const footerLinks = {
  shop: [
    { name: "Men", link: "/category/men" },
    { name: "Women", link: "/category/women" },
    { name: "Kids", link: "/category/kids" },
    { name: "Sale", link: "/sale" },
    { name: "New Arrivals", link: "/new-arrivals" }
  ],
  help: [
    { name: "Track Order", link: "/track-order" },
    { name: "Size Guide", link: "/size-guide" },
    { name: "Customer Support", link: "/help" },
    { name: "Return Policy", link: "/returns" },
    { name: "Shipping Info", link: "/shipping" }
  ],
  company: [
    { name: "About Us", link: "/about" },
    { name: "Careers", link: "/careers" },
    { name: "Press", link: "/press" },
    { name: "Privacy Policy", link: "/privacy" },
    { name: "Terms of Service", link: "/terms" }
  ]
};

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free shipping over $99"
  },
  {
    icon: CreditCard,
    title: "Cash On Delivery", 
    description: "Pay cash on delivery"
  },
  {
    icon: Shield,
    title: "Gift For All",
    description: "Shop gifts for everyone"
  },
  {
    icon: RotateCcw,
    title: "Opening All Week",
    description: "8AM - 09PM"
  }
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
    <footer className="modern-footer">
      {/* Features Section */}
      <div className="footer-features">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-item">
                <div className="feature-icon">
                  <feature.icon size={24} />
                </div>
                <div className="feature-content">
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Brand Section */}
            <div className="footer-brand">
              <h3 className="brand-name">Modaz.</h3>
              <p className="brand-description">
                Your trusted fashion destination with quality products and excellent service. 
                Discover the latest trends and timeless classics.
              </p>
              
              {/* Social Links */}
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Facebook">
                  <Facebook size={20} />
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <Instagram size={20} />
                </a>
                <a href="#" className="social-link" aria-label="Twitter">
                  <Twitter size={20} />
                </a>
                <a href="#" className="social-link" aria-label="YouTube">
                  <Youtube size={20} />
                </a>
              </div>
            </div>

            {/* Shop Links */}
            <div className="footer-column">
              <h4>Shop</h4>
              <ul className="footer-links">
                {footerLinks.shop.map((link, index) => (
                  <li key={index}>
                    <a href={link.link}>{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Links */}
            <div className="footer-column">
              <h4>Help</h4>
              <ul className="footer-links">
                {footerLinks.help.map((link, index) => (
                  <li key={index}>
                    <a href={link.link}>{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div className="footer-column">
              <h4>Company</h4>
              <ul className="footer-links">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a href={link.link}>{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="footer-newsletter">
              <h4>Sign up for Special Newsletter</h4>
              <p>Get the latest updates on new products and upcoming sales</p>
              
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <div className="newsletter-input-wrapper">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="newsletter-input"
                  />
                  <button type="submit" className="newsletter-button">
                    SUBSCRIBE
                  </button>
                </div>
              </form>
              
              {isSubscribed && (
                <div className="success-message">
                  Successfully subscribed to our newsletter!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; 2025 Modaz. All rights reserved.</p>
            </div>
            <div className="footer-bottom-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          <ArrowUp size={20} />
        </button>
      )}
    </footer>
  );
}
