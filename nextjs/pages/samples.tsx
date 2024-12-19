import { GetServerSideProps, NextPage } from 'next'

interface Sample {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

interface Props {
  samples: Sample[]
  error?: string
  debug?: string  // デバッグ情報用
}

const SamplesPage: NextPage<Props> = ({ samples, error, debug }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Samples from MySQL Database
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {debug && (
          <pre className="bg-gray-100 p-4 mb-4 overflow-auto">
            {debug}
          </pre>
        )}

        <div className="grid gap-6">
          {samples && samples.map(sample => (
            <div 
              key={sample.id} 
              className="bg-white shadow rounded-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {sample.name}
              </h2>
              <p className="text-gray-600">
                {sample.description}
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Created at: {new Date(sample.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const apiUrl = process.env.API_URL
    console.log('Fetching from:', apiUrl) // CloudWatchログに記録される

    const res = await fetch(`${apiUrl}/api/samples`)
    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`)
    }

    const data = await res.json()
    
    return {
      props: {
        samples: data.data,
        debug: `API URL: ${apiUrl}\nResponse: ${JSON.stringify(data, null, 2)}` // デバッグ用
      }
    }
  } catch (error) {
    console.error('Error fetching samples:', error)
    return {
      props: {
        samples: [],
        error: `Failed to load data: ${(error as Error).message}`,
        debug: `Error occurred while fetching data: ${(error as Error).toString()}`
      }
    }
  }
}

export default SamplesPage