export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full text-center space-y-8 p-8">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Kitchen System
          </h1>
          <p className="text-xl text-gray-600">
            Complete Restaurant Management Solution
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Dashboard</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">📦</div>
            <div className="font-medium">Inventory</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">🍽️</div>
            <div className="font-medium">Menu</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium">Sales</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">👨‍🍳</div>
            <div className="font-medium">KDS</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">📅</div>
            <div className="font-medium">Reservations</div>
          </div>
        </div>

        <div className="space-y-4">
          <a
            href="/login"
            className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="block w-full py-3 px-6 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
          >
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
}
