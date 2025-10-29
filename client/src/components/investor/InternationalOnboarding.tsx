import React, { useState, useEffect } from "react";

interface OnboardingForm {
  kyc: {
    fullName: string;
    email: string;
    nationality: string;
    country: string;
    pep: boolean;
    ofacAttestation: boolean;
  };
  accreditation: {
    isAccredited: string;
    basis: string;
  };
  wallet: {
    chain: string;
    address: string;
  };
  funding: {
    preferredStablecoin: string;
    escrow: string;
    amount: string;
    tranchePlan: string;
  };
  disclosures: {
    fatcaCrsSelfCert: boolean;
    understandsRisk: boolean;
    agreesToTerms: boolean;
  };
  geniusActVersion: string;
  module: string;
}

const STORAGE_KEY = "axiom_international_onboarding";

const InternationalOnboarding: React.FC = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sections = ["Identity", "Accreditation", "Wallet", "Funding", "Disclosures"];

  const [formData, setFormData] = useState<OnboardingForm>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore parse errors
      }
    }
    return {
      kyc: {
        fullName: "",
        email: "",
        nationality: "",
        country: "",
        pep: false,
        ofacAttestation: false,
      },
      accreditation: {
        isAccredited: "",
        basis: "",
      },
      wallet: {
        chain: "",
        address: "",
      },
      funding: {
        preferredStablecoin: "",
        escrow: "circle",
        amount: "",
        tranchePlan: "",
      },
      disclosures: {
        fatcaCrsSelfCert: false,
        understandsRisk: false,
        agreesToTerms: false,
      },
      geniusActVersion: "v1",
      module: "international-onboarding",
    };
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const validateCurrentSection = (): boolean => {
    setError("");

    switch (currentSection) {
      case 0: // Identity
        if (!formData.kyc.fullName.trim()) {
          setError("Full name is required");
          return false;
        }
        if (!formData.kyc.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          setError("Valid email is required");
          return false;
        }
        if (!formData.kyc.nationality.trim()) {
          setError("Nationality is required");
          return false;
        }
        if (!formData.kyc.country) {
          setError("Country of residence is required");
          return false;
        }
        if (!formData.kyc.ofacAttestation) {
          setError("OFAC attestation is required");
          return false;
        }
        break;

      case 1: // Accreditation
        if (!formData.accreditation.isAccredited) {
          setError("Please indicate accreditation status");
          return false;
        }
        if (
          formData.accreditation.isAccredited === "yes" &&
          !formData.accreditation.basis
        ) {
          setError("Please select basis for accreditation");
          return false;
        }
        break;

      case 2: // Wallet
        if (!formData.wallet.chain) {
          setError("Please select a blockchain network");
          return false;
        }
        if (!formData.wallet.address.match(/^0x[a-fA-F0-9]{40}$/)) {
          setError("Please enter a valid wallet address (0x...)");
          return false;
        }
        break;

      case 3: // Funding
        if (!formData.funding.preferredStablecoin) {
          setError("Please select a preferred stablecoin");
          return false;
        }
        const amount = parseFloat(formData.funding.amount);
        if (!amount || amount < 10000) {
          setError("Minimum investment amount is $10,000");
          return false;
        }
        if (!formData.funding.tranchePlan) {
          setError("Please select a tranche plan");
          return false;
        }
        break;

      case 4: // Disclosures
        if (!formData.disclosures.fatcaCrsSelfCert) {
          setError("FATCA/CRS certification is required");
          return false;
        }
        if (!formData.disclosures.understandsRisk) {
          setError("Risk acknowledgment is required");
          return false;
        }
        if (!formData.disclosures.agreesToTerms) {
          setError("Terms acceptance is required");
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentSection(currentSection - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/investors/international/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Submission failed");
      }

      const result = await response.json();
      
      if (result.escrowIntentId) {
        // Clear saved form
        localStorage.removeItem(STORAGE_KEY);
        // Redirect to escrow page
        window.location.href = `/escrow?intentId=${result.escrowIntentId}`;
      } else {
        throw new Error("No escrow intent ID received");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            International Investor Onboarding
          </h2>
          <p className="text-gray-600">
            GENIUS Act compliant onboarding for crypto investors, DAOs, and family offices
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {sections.map((section, idx) => (
              <div key={section} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      idx <= currentSection
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div
                    className={`text-xs mt-2 font-medium ${
                      idx === currentSection ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {section}
                  </div>
                </div>
                {idx < sections.length - 1 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 ${
                      idx < currentSection ? "bg-blue-600" : "bg-gray-200"
                    }`}
                    style={{ zIndex: -1 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Form Sections */}
        <div className="min-h-96">
          {/* Section 0: Identity */}
          {currentSection === 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Identity Verification
              </h3>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.kyc.fullName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kyc: { ...formData.kyc, fullName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  aria-label="Full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.kyc.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kyc: { ...formData.kyc, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="investor@example.com"
                  aria-label="Email address"
                />
              </div>

              <div>
                <label
                  htmlFor="nationality"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nationality *
                </label>
                <input
                  id="nationality"
                  type="text"
                  value={formData.kyc.nationality}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kyc: { ...formData.kyc, nationality: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., United States, Brazil, UAE"
                  aria-label="Nationality"
                />
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Country of Residence *
                </label>
                <select
                  id="country"
                  value={formData.kyc.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kyc: { ...formData.kyc, country: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Country of residence"
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
                  <option value="MX">Mexico</option>
                  <option value="AR">Argentina</option>
                </select>
              </div>

              <div className="pt-4 space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.kyc.pep}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kyc: { ...formData.kyc, pep: e.target.checked },
                      })
                    }
                    className="w-5 h-5 mt-0.5"
                    aria-label="Politically exposed person"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      I am a Politically Exposed Person (PEP)
                    </span>
                    <p className="text-gray-600 mt-1">
                      Check if you hold or have held a prominent public function
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.kyc.ofacAttestation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kyc: { ...formData.kyc, ofacAttestation: e.target.checked },
                      })
                    }
                    className="w-5 h-5 mt-0.5"
                    aria-label="OFAC attestation"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      OFAC Attestation *
                    </span>
                    <p className="text-gray-600 mt-1">
                      I confirm that I am not on any OFAC sanctions list and my funds
                      do not originate from sanctioned sources
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Section 1: Accreditation */}
          {currentSection === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Accreditation Status
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Are you an accredited investor? *
                </label>
                <div className="space-y-2">
                  {[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "unknown", label: "Unknown" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="isAccredited"
                        value={option.value}
                        checked={formData.accreditation.isAccredited === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accreditation: {
                              ...formData.accreditation,
                              isAccredited: e.target.value,
                            },
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.accreditation.isAccredited === "yes" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Basis for accreditation *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "income", label: "Income ($200K+ annually)" },
                      {
                        value: "networth",
                        label: "Net Worth ($1M+ excluding primary residence)",
                      },
                      { value: "entity", label: "Entity (Fund, Corporation, etc.)" },
                      { value: "na", label: "Not Applicable" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="basis"
                          value={option.value}
                          checked={formData.accreditation.basis === option.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              accreditation: {
                                ...formData.accreditation,
                                basis: e.target.value,
                              },
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-900">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Wallet */}
          {currentSection === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Wallet Information
              </h3>

              <div>
                <label
                  htmlFor="chain"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Blockchain Network *
                </label>
                <select
                  id="chain"
                  value={formData.wallet.chain}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wallet: { ...formData.wallet, chain: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Blockchain network"
                >
                  <option value="">Select network</option>
                  <option value="bsc">BNB Smart Chain (BSC)</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="walletAddress"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Wallet Address *
                </label>
                <input
                  id="walletAddress"
                  type="text"
                  value={formData.wallet.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wallet: { ...formData.wallet, address: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="0x..."
                  pattern="^0x[a-fA-F0-9]{40}$"
                  aria-label="Wallet address"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must start with 0x followed by 40 hexadecimal characters
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-900 font-medium">
                  🔒 Automated Wallet Screening
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  Your wallet will be automatically screened for OFAC sanctions and
                  risk scoring using Chainalysis. This ensures compliance with
                  international regulations.
                </p>
              </div>
            </div>
          )}

          {/* Section 3: Funding */}
          {currentSection === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Funding Details
              </h3>

              <div>
                <label
                  htmlFor="stablecoin"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Preferred Stablecoin *
                </label>
                <select
                  id="stablecoin"
                  value={formData.funding.preferredStablecoin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: {
                        ...formData.funding,
                        preferredStablecoin: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Preferred stablecoin"
                >
                  <option value="">Select stablecoin</option>
                  <option value="usdc">USDC</option>
                  <option value="usdt">USDT</option>
                  <option value="busd">BUSD</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Initial Investment Amount (USD) *
                </label>
                <input
                  id="amount"
                  type="number"
                  value={formData.funding.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, amount: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                  min="10000"
                  aria-label="Investment amount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum investment: $10,000 USD
                </p>
              </div>

              <div>
                <label
                  htmlFor="tranchePlan"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tranche Plan *
                </label>
                <select
                  id="tranchePlan"
                  value={formData.funding.tranchePlan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      funding: { ...formData.funding, tranchePlan: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Tranche plan"
                >
                  <option value="">Select plan</option>
                  <option value="single">Single Transfer</option>
                  <option value="monthly">Monthly Tranches</option>
                  <option value="quarterly">Quarterly Tranches</option>
                </select>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-900 font-medium">
                  🔐 Circle Escrow Integration
                </p>
                <p className="text-sm text-green-800 mt-2">
                  Funds will be held in secure Circle escrow until compliance
                  verification is complete. Escrow provider is fixed to Circle for
                  regulatory compliance.
                </p>
              </div>
            </div>
          )}

          {/* Section 4: Disclosures */}
          {currentSection === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Compliance & Disclosures
              </h3>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.disclosures.fatcaCrsSelfCert}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        disclosures: {
                          ...formData.disclosures,
                          fatcaCrsSelfCert: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 mt-1"
                    aria-label="FATCA/CRS self-certification"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      FATCA/CRS Self-Certification *
                    </div>
                    <div className="text-gray-600 mt-1">
                      I certify compliance with the Foreign Account Tax Compliance
                      Act (FATCA) and Common Reporting Standard (CRS)
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.disclosures.understandsRisk}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        disclosures: {
                          ...formData.disclosures,
                          understandsRisk: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 mt-1"
                    aria-label="Risk acknowledgment"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      Risk Acknowledgment *
                    </div>
                    <div className="text-gray-600 mt-1">
                      I understand and accept the risks associated with cryptocurrency
                      investments and real estate, including potential loss of capital
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.disclosures.agreesToTerms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        disclosures: {
                          ...formData.disclosures,
                          agreesToTerms: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 mt-1"
                    aria-label="Terms and conditions"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      Terms & Conditions *
                    </div>
                    <div className="text-gray-600 mt-1">
                      I agree to the platform terms, conditions, and investor
                      agreement
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-yellow-900 font-medium">
                  📋 Final Review
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  By submitting this form, you confirm that all information provided
                  is accurate and complete. Your application will be reviewed by our
                  compliance team within 48 hours. You will receive escrow
                  instructions via email.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleBack}
            disabled={currentSection === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              currentSection === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Back
          </button>

          {currentSection < sections.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternationalOnboarding;
