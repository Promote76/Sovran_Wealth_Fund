import React, { useState } from "react";
import { motion } from "framer-motion";

const InternationalOnboardingV2: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [kycData, setKycData] = useState({
    fullName: "",
    email: "",
    nationality: "",
    country: "",
    phone: "",
  });

  const [accreditationData, setAccreditationData] = useState({
    isAccredited: "",
    basis: "",
  });

  const [walletData, setWalletData] = useState({
    chain: "",
    address: "",
  });

  const [fundingData, setFundingData] = useState({
    stablecoin: "",
    escrow: "",
    investmentAmount: "",
    tranchePlan: "",
  });

  const [complianceData, setComplianceData] = useState({
    fatcaCompliant: false,
    crsCompliant: false,
    riskAcknowledged: false,
    termsAccepted: false,
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      kyc: kycData,
      accreditation: accreditationData,
      wallet: walletData,
      funding: fundingData,
      compliance: complianceData,
    };

    try {
      const response = await fetch("/api/investors/international/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Onboarding submitted successfully!");
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            International Investor Onboarding
          </h2>
          <p className="text-gray-600">
            GENIUS Act compliant onboarding for crypto investors
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex-1 relative">
                <div
                  className={`h-2 rounded ${
                    step <= currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`absolute top-0 left-0 w-8 h-8 rounded-full flex items-center justify-center -mt-3 ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-4">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">KYC Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={kycData.fullName}
                  onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={kycData.email}
                  onChange={(e) => setKycData({ ...kycData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={kycData.nationality}
                  onChange={(e) => setKycData({ ...kycData, nationality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="United States"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country of Residence
                </label>
                <select
                  value={kycData.country}
                  onChange={(e) => setKycData({ ...kycData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select country</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="SG">Singapore</option>
                  <option value="BR">Brazil</option>
                  <option value="NG">Nigeria</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CH">Switzerland</option>
                  <option value="TR">Turkey</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="QA">Qatar</option>
                  <option value="IN">India</option>
                  <option value="HK">Hong Kong</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={kycData.phone}
                  onChange={(e) => setKycData({ ...kycData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Accreditation Status</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Are you an accredited investor?
                </label>
                <div className="space-y-2">
                  {["yes", "no", "unknown"].map((option) => (
                    <label key={option} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="accredited"
                        value={option}
                        checked={accreditationData.isAccredited === option}
                        onChange={(e) => setAccreditationData({ ...accreditationData, isAccredited: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {accreditationData.isAccredited === "yes" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Basis for accreditation
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "income", label: "Income ($200K+ annually)" },
                      { value: "networth", label: "Net Worth ($1M+ excluding primary residence)" },
                      { value: "entity", label: "Entity (Fund, Corporation, etc.)" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="basis"
                          value={option.value}
                          checked={accreditationData.basis === option.value}
                          onChange={(e) => setAccreditationData({ ...accreditationData, basis: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Wallet Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blockchain Network
                </label>
                <select
                  value={walletData.chain}
                  onChange={(e) => setWalletData({ ...walletData, chain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select network</option>
                  <option value="bsc">BNB Smart Chain (BSC)</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletData.address}
                  onChange={(e) => setWalletData({ ...walletData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="0x..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your wallet will be screened for OFAC sanctions and compliance.
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Funding Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Stablecoin
                </label>
                <select
                  value={fundingData.stablecoin}
                  onChange={(e) => setFundingData({ ...fundingData, stablecoin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select stablecoin</option>
                  <option value="usdc">USDC</option>
                  <option value="usdt">USDT</option>
                  <option value="busd">BUSD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escrow Provider
                </label>
                <select
                  value={fundingData.escrow}
                  onChange={(e) => setFundingData({ ...fundingData, escrow: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select provider</option>
                  <option value="circle">Circle Escrow</option>
                  <option value="anchorage">Anchorage Digital</option>
                  <option value="fireblocks">Fireblocks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Investment Amount (USD)
                </label>
                <input
                  type="number"
                  value={fundingData.investmentAmount}
                  onChange={(e) => setFundingData({ ...fundingData, investmentAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                  min="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tranche Plan
                </label>
                <select
                  value={fundingData.tranchePlan}
                  onChange={(e) => setFundingData({ ...fundingData, tranchePlan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select plan</option>
                  <option value="single">Single Transfer</option>
                  <option value="monthly">Monthly Tranches</option>
                  <option value="quarterly">Quarterly Tranches</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Compliance & Disclosures</h3>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={complianceData.fatcaCompliant}
                    onChange={(e) => setComplianceData({ ...complianceData, fatcaCompliant: e.target.checked })}
                    className="w-5 h-5 mt-1"
                  />
                  <div>
                    <div className="font-medium">FATCA Compliance</div>
                    <div className="text-sm text-gray-600">
                      I certify compliance with the Foreign Account Tax Compliance Act
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={complianceData.crsCompliant}
                    onChange={(e) => setComplianceData({ ...complianceData, crsCompliant: e.target.checked })}
                    className="w-5 h-5 mt-1"
                  />
                  <div>
                    <div className="font-medium">CRS Compliance</div>
                    <div className="text-sm text-gray-600">
                      I certify compliance with the Common Reporting Standard
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={complianceData.riskAcknowledged}
                    onChange={(e) => setComplianceData({ ...complianceData, riskAcknowledged: e.target.checked })}
                    className="w-5 h-5 mt-1"
                  />
                  <div>
                    <div className="font-medium">Risk Acknowledgment</div>
                    <div className="text-sm text-gray-600">
                      I understand and accept the risks of cryptocurrency and real estate investments
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={complianceData.termsAccepted}
                    onChange={(e) => setComplianceData({ ...complianceData, termsAccepted: e.target.checked })}
                    className="w-5 h-5 mt-1"
                  />
                  <div>
                    <div className="font-medium">Terms & Conditions</div>
                    <div className="text-sm text-gray-600">
                      I agree to the platform terms, conditions, and investor agreement
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Review & Submit</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-4">Summary</h4>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {kycData.fullName || "Not provided"}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {kycData.email || "Not provided"}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {kycData.country || "Not provided"}
                  </div>
                  <div>
                    <span className="font-medium">Accredited:</span> {accreditationData.isAccredited || "Not provided"}
                  </div>
                  <div>
                    <span className="font-medium">Wallet:</span> {walletData.address || "Not provided"}
                  </div>
                  <div>
                    <span className="font-medium">Investment:</span> ${fundingData.investmentAmount || "0"}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white rounded border border-green-300">
                  <p className="text-sm text-gray-700">
                    By submitting this form, you confirm that all information provided is accurate and complete.
                    Your submission will be reviewed by our compliance team within 48 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-medium ${
              currentStep === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternationalOnboardingV2;
