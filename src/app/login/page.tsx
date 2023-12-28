import React from 'react';

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Login</h1>
        <form className="flex flex-col items-center">
          <input type="text" placeholder="Username" className="w-64 px-4 py-2 mb-4 border border-gray-300 rounded" />
          <input
            type="password"
            placeholder="Password"
            className="w-64 px-4 py-2 mb-4 border border-gray-300 rounded"
          />
          <button type="submit" className="w-64 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Sign In
          </button>
        </form>
        <div className="mt-4">
          <button className="w-64 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Sign in with Google</button>
        </div>
      </div>
    </main>
  );
}
