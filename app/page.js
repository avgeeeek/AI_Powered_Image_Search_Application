// File: app/page.js

"use client"; // This must be a Client Component

import { useState } from "react";

export default function Home() {
  // State for the upload
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // State for the search
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // --- UPLOAD HANDLER ---
  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("Getting secure upload link...");

    try {
      // 1. Ask our server for a pre-signed URL
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) throw new Error("Failed to get pre-signed URL.");
      const { url, key } = await response.json();

      setMessage("Uploading file...");

      // 2. Upload the file DIRECTLY to S3
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("S3 upload failed.");

      setMessage(`Upload successful! File key: ${key}. Your file is now being tagged.`);
      
      // Reset after 5 seconds
      setTimeout(() => setMessage(""), 5000);

    } catch (error) {
      console.error(error);
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      event.target.value = null; // Clear the file input
    }
  }

  // --- SEARCH HANDLER ---
  async function handleSearch(event) {
    event.preventDefault(); // Prevent form from reloading page
    if (!searchQuery) return;

    setSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/search?q=${searchQuery}`);
      if (!response.ok) throw new Error("Search request failed.");

      const results = await response.json();
      setSearchResults(results);

    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  }

  // --- PAGE CONTENT (JSX) ---
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Image Search App</h1>

      {/* --- UPLOAD SECTION --- */}
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-md mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-center">Upload an Image</h2>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700
            file:disabled:bg-gray-500
            file:cursor-pointer"
        />
        {message && <p className="mt-4 text-sm text-center text-gray-300">{message}</p>}
      </div>

      {/* --- SEARCH SECTION --- */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">Search for Images</h2>
        <form onSubmit={handleSearch} className="flex mb-8">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., beach, car, dog..."
            className="flex-grow p-3 rounded-l-lg border-0 bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="p-3 bg-blue-600 rounded-r-lg font-semibold hover:bg-blue-700 disabled:bg-gray-500"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {/* --- RESULTS GRID --- */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map((image) => (
              <div key={image.s3_key} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={image.url}
                  alt={`Image for ${searchQuery}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-2 text-xs text-gray-400">
                  {/* Optional: Show some tags */}
                  {image.labels.slice(0, 3).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}