import FAQAccordion from "../components/FAQAccordion";

const faqs = [
  { question: "What is Proof of Reserves?", answer: "Independent verification of on-chain balances for Sovran-controlled wallets." },
  { question: "How often are reports published?", answer: "Monthly reports are published with downloadable PDFs." },
  { question: "How can I invest?", answer: "You may join through approved investor programs following KYC/AML compliance." },
];

export default function FAQPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>
      <FAQAccordion faqs={faqs} />
    </div>
  );
}