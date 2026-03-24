export default function TestPage() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-black mb-4">Test Page</h1>
        <p className="text-gray-700">If you can see this with a RED background, Tailwind is working!</p>
        <p className="text-gray-700 mt-4">If you see WHITE text on BLACK, Tailwind is NOT loading.</p>
      </div>
    </div>
  );
}