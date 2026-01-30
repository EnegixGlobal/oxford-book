'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "How do I place an order?",
    answer: "Simply browse our collection, add books to your cart, and proceed to checkout. You can pay using various payment methods including credit/debit cards, UPI, and net banking."
  },
  {
    question: "What are your shipping charges?",
    answer: "We offer free shipping on orders above ₹499. For orders below ₹499, standard shipping costs ₹49. Express delivery is available for ₹99."
  },
  {
    question: "How long does delivery take?",
    answer: "Standard delivery takes 5-7 business days, while express delivery takes 2-3 business days. Delivery times may vary for remote locations."
  },
  {
    question: "Can I return a book?",
    answer: "Yes! We offer a 7-day return policy. Books must be in original condition with no markings or damage. Visit our Returns page for detailed instructions."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Currently, we only ship within India. We're working on expanding our shipping to international locations soon."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order ships, you'll receive a tracking number via email and SMS. You can also track your order by logging into your account."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, UPI payments, net banking, and digital wallets via Razorpay."
  },
  {
    question: "Can I cancel my order?",
    answer: "You can cancel your order within 24 hours of placing it, provided it hasn't been shipped. Contact our customer service for assistance."
  },
  {
    question: "Do you have a physical store?",
    answer: "We're primarily an online bookstore, but we're planning to open physical locations in major cities. Stay tuned for updates!"
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach us via email at oxfordbookhouse@outlook.com, call us at +91 9835770807, or use our WhatsApp chat button for instant support."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about BookHaven
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left hover:bg-purple-50 transition-colors focus:outline-none focus:bg-purple-50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-8 pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 bg-purple-600 rounded-2xl shadow-lg p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="mb-6">Can't find what you're looking for? Our customer support team is here to help!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Contact Us
            </a>
            <button 
              onClick={() => {
                const phoneNumber = '+919835770807';
                const message = 'Hi! I have a question about BookHaven.';
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Chat on WhatsApp
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}