import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md mx-auto text-center">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Medication Not Found
                    </h1>
                    <p className="text-gray-600 mb-6">
                        The medication you're looking for doesn't exist or has been removed.
                    </p>
                    <Link 
                        href="/"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
} 