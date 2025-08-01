import React, { useState } from "react";
import "./BottomCard.css";
import image1 from "../../images/image1.png";
import offer1 from "../../images/image2.png";
import offer2 from "../../images/image.png";

const faqTabs = [
  {
    label: "Frequent Questions",
    faqs: [
      {
        q: "How does E-Mall World work?",
        a: "E-Mall World is your comprehensive online shopping destination. Browse millions of products from thousands of brands, place your order online, and get items delivered quickly to your doorstep.",
        highlight: true,
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit/debit cards, digital wallets (like Google Pay, Apple Pay, PhonePe), UPI, net banking, and cash on delivery for eligible orders.",
      },
      {
        q: "Can I track my order in real-time?",
        a: "Yes! After placing your order, you can track its status and delivery progress in real-time from your account dashboard or mobile app.",
      },
      {
        q: "Are there any special discounts or promotions available?",
        a: "Yes, we regularly offer exclusive deals, seasonal sales, and flash discounts. Check the 'Today's Deals' section or subscribe to our newsletter for the latest offers.",
      },
      {
        q: "Is E-Mall World available in my area?",
        a: "E-Mall World delivers to most cities and towns across India. Enter your pincode during checkout to check delivery availability and estimated delivery time.",
      },
    ],
  },
  {
    label: "Who we are?",
    faqs: [
      {
        q: "Who is behind E-Mall World?",
        a: "E-Mall World is a passionate team of tech enthusiasts and retail experts dedicated to revolutionizing online shopping with innovative technology and exceptional customer service.",
      },
      {
        q: "What is the mission of E-Mall World?",
        a: "Our mission is to democratize commerce by connecting customers with quality products from trusted sellers worldwide, making shopping convenient, affordable, and enjoyable.",
      },
    ],
  },
  {
    label: "Partner Program",
    faqs: [
      {
        q: "How can I partner with E-Mall World?",
        a: "If you own a business or brand, you can join our marketplace by signing up through the 'Sell on E-Mall World' section. Our team will guide you through the onboarding process and help you set up your store.",
      },
      {
        q: "What are the benefits of partnering?",
        a: "Partners get access to millions of customers, comprehensive seller tools, marketing support, secure payment processing, and dedicated account management to grow their business.",
      },
    ],
  },
  {
    label: "Help & Support",
    faqs: [
      {
        q: "How do I contact customer support?",
        a: "You can reach our 24/7 support team via the 'Help & Support' section on our website or app, live chat, or email us at support@emallworld.com.",
      },
      {
        q: "What if I have an issue with my order?",
        a: "If you face any issues with your order, please contact us immediately through your order tracking page or customer support. We offer hassle-free returns and refunds as per our policy.",
      },
    ],
  },
];

const steps = [
  {
    title: "Browse & Shop!",
    desc: "Explore millions of products through our website or mobile app",
    img: image1,
  },
  {
    title: "Track Progress",
    desc: "Monitor your order status with real-time tracking",
    img: offer1,
  },
  {
    title: "Receive your Order!",
    desc: "Get your products delivered at lightning-fast speed!",
    img: offer2,
  },
];

export default function BottomCard() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = faqTabs[activeTab].faqs;

  const handleFaqClick = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <>
      <div className="bottom-card">
        <h2 className="bottom-card-title">Know more about us!</h2>
        <div className="bottom-card-tabs">
          {faqTabs.map((tab, idx) => (
            <button
              key={tab.label}
              className={`bottom-card-tab${activeTab === idx ? " active" : ""}`}
              onClick={() => {
                setActiveTab(idx);
                setOpenFaq(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bottom-card-container">
          <div className="bottom-card-faqs">
            <ul className="faq-list">
              {faqs.length === 0 ? (
                <li className="faq-empty">Coming soon...</li>
              ) : (
                faqs.map((item, idx) => (
                  <li
                    key={idx}
                    className={""}
                    onClick={() => handleFaqClick(idx)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.q}
                    {openFaq === idx && item.a && (
                      <div className="faq-answer">{item.a}</div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="bottom-card-steps">
            <div className="steps-row">
              {steps.map((step, idx) => (
                <div className="step-card" key={idx}>
                  <img src={step.img} alt={step.title} className="step-img" />
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                </div>
              ))}
            </div>
            <div className="desc bottom-card-desc">
              E-Mall World simplifies online shopping like never before. Browse
              through our vast catalog of products, compare prices, read
              reviews, and checkout securely. Your favorite products will be
              delivered to your doorstep with care and speed!
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
