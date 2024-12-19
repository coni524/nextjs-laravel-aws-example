import type { NextPage } from 'next'
import Link from 'next/link'

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Welcome to Next.js + Laravel Example
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          This is a static page served from CloudFront + S3.
        </p>
        <Link 
          href="/samples" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          View Dynamic Samples
        </Link>
      </main>
    </div>
  )
}

export default Home