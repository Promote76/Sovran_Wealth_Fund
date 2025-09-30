export default function Contact() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
      <form method="POST" action="mailto:info@tribefundrealty.com" className="space-y-4">
        <input type="text" name="name" placeholder="Your Name" className="w-full border p-3 rounded" required />
        <input type="email" name="email" placeholder="Your Email" className="w-full border p-3 rounded" required />
        <textarea name="message" placeholder="Your Message" className="w-full border p-3 rounded" rows="5" required></textarea>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Send</button>
      </form>
    </div>
  );
}