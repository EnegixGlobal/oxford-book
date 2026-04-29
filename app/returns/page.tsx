'use client';

import { motion } from 'framer-motion';
import { RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ReturnsPage() {
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
            Returns & Exchanges
          </h1>
          <p className="text-xl text-gray-600">
            Easy returns within 7 days of purchase
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Return Policy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Return Policy</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">7-Day Returns</h3>
                <p className="text-gray-600 text-sm">Return any book within 7 days of purchase</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Easy Process</h3>
                <p className="text-gray-600 text-sm">Simple online return process with prepaid labels</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Refunds</h3>
                <p className="text-gray-600 text-sm">Refunds processed within 5-7 business days</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Return Conditions</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                  Books must be in original condition with no markings or damage
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                  Original packaging and invoice must be included
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                  Return initiated within 7 days of delivery
                </li>
                <li className="flex items-start">
                  <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                  Personalized or customized books cannot be returned
                </li>
              </ul>
            </div>
          </motion.div>

          {/* How to Return */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Return</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Initiate Return</h3>
                  <p className="text-gray-600">Log into your account and go to 'My Orders'. Select the item you want to return and click 'Return Item'.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Print Return Label</h3>
                  <p className="text-gray-600">We'll email you a prepaid return shipping label. Print it and attach it to your package.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Ship the Item</h3>
                  <p className="text-gray-600">Package the item securely and drop it off at any authorized shipping location.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Get Your Refund</h3>
                  <p className="text-gray-600">Once we receive and inspect your return, we'll process your refund within 5-7 business days.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact for Returns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-purple-600 rounded-2xl shadow-lg p-8 text-white text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Need Help with Returns?</h2>
            <p className="mb-6">Our customer service team is here to help you with any return questions.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:Info@oxfordbookhouse.in" className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Email: Info@oxfordbookhouse.in
              </a>
              <a href="tel: +919835770807" className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Call: +91 9835770807
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}