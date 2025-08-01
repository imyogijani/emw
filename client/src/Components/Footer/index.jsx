import React from "react";
import "./footer.css";
const legalPages = [
  { name: "Terms and conditions", link: "/terms" },
  { name: "Privacy", link: "/privacy" },
  { name: "Cookies", link: "/cookies" },
  { name: "Modern Slavery Statement", link: "/modern-slavery" },
];

const importantLinks = [
  { name: "Get help", link: "/help" },
  { name: "Add your restaurant", link: "/add-restaurant" },
  { name: "Sign up to deliver", link: "/signup-deliver" },
  { name: "Create a business account", link: "/create-business" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <h2 className="logo">E-Mall World</h2>
          <p style={{ fontSize: "15px" }}>
            Company # 490039-445, Registered with House of companies.
          </p>
        </div>

        <div className="footer-center">
          <h4>Get Exclusive Deals in your Inbox</h4>
          <div className="subscribe">
            <input type="email" placeholder="youremail@gmail.com" />
            <button>Subscribe</button>
          </div>
          <small>
            We won't spam, read our <a href="/email-policy">email policy</a>.
          </small>
          <div className="social-icons">
            <i className="fab fa-facebook-f"></i>
            <i className="fab fa-instagram"></i>
            <i className="fab fa-tiktok"></i>
            <i className="fab fa-snapchat-ghost"></i>
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-section">
            <h4>Legal Pages</h4>
            <ul>
              {legalPages.map((page, index) => (
                <li key={index}>
                  <a href={page.link}>{page.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-section">
            <h4>Important Links</h4>
            <ul>
              {importantLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.link}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          Aksharraj Info. Copyright {new Date().getFullYear()}, All Rights
          Reserved.
        </p>
        <div className="bottom-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="/pricing">Pricing</a>
          <a href="/do-not-sell">
            Do not sell or share my personal information
          </a>
        </div>
      </div>
    </footer>
  );
}
