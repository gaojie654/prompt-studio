import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <a href="/" className="inline-flex items-center px-1 pt-1 text-gray-900">Prompt Studio</a>
              <a href="/workspace" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900">Workspace</a>
              <a href="/prompts" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900">Prompts</a>
              <a href="/profile" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900">Profile</a>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
