'use client';

import { useState, useRef, useEffect } from 'react';

export default function SearchBar({ searchHistory, onSearchSelect, onNewWordSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchHistory.filter(item => 
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      ).sort((a, b) => b.timestamp - a.timestamp); // Most recent first

      setFilteredResults(filtered.slice(0, 7)); // Limit to 7 results to make room for "Search new word"
      setIsOpen(true); // Always show dropdown when there's a query
    } else {
      setFilteredResults([]);
      setIsOpen(false);
    }
  }, [searchQuery, searchHistory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (item) => {
    onSearchSelect(item);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleNewWordSearch = () => {
    if (searchQuery.trim()) {
      onNewWordSearch(searchQuery.trim());
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // If there are results, select the first one, otherwise search for new word
      if (filteredResults.length > 0) {
        handleSearchSelect(filteredResults[0]);
      } else {
        handleNewWordSearch();
      }
    }
  };

  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 px-0.5 rounded">
          {part}
        </mark> : part
    );
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search or explore any word..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl shadow-gray-200/20 dark:shadow-gray-900/20 max-h-96 overflow-y-auto z-50"
        >
          <div className="p-2">
            {/* Search in history results */}
            {filteredResults.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  From your exploration history
                </div>
                {filteredResults.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchSelect(item)}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors duration-150 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {highlightMatch(item.word, searchQuery)}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {highlightMatch(
                            item.content.slice(0, 120) + (item.content.length > 120 ? '...' : ''), 
                            searchQuery
                          )}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Search for new word option */}
            {searchQuery.trim() && (
              <>
                {filteredResults.length > 0 && (
                  <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                )}
                <button
                  onClick={handleNewWordSearch}
                  className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors duration-150 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        Explore "{searchQuery}"
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Search for this new word
                      </p>
                    </div>
                  </div>
                </button>
              </>
            )}

            {/* No results state */}
            {!searchQuery.trim() && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <svg className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm">Type to search or explore new words</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}