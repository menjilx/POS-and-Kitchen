export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-sm w-full text-center space-y-10 p-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            POS + Kitchen System
          </h1>
          <div className="mt-2 h-px w-12 bg-gray-900 mx-auto" />
        </div>

        <a
          href="/login"
          className="block w-full py-3 px-6 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium text-sm transition-colors"
        >
          Sign In
        </a>
      </div>
    </div>
  );
}
