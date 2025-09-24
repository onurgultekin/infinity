'use client';

import { useState } from 'react';
import { SearchHistory } from '../utils/searchHistory';

export default function SearchStats({ isOpen, onClose, onWordClick }) {
  const [activeTab, setActiveTab] = useState('recent');
  
  if (!isOpen) return null;

  const recentExplorations = SearchHistory.getRecentExplorations(10);
  const mostExplored = SearchHistory.getMostExploredTopics(10);
  const totalWords = SearchHistory.getWordCount();

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">
              Exploration Insights
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              You've explored {totalWords} unique words
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'popular'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Most Explored
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'recent' && (
            <div className="space-y-3">
              {recentExplorations.length > 0 ? (
                recentExplorations.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onWordClick(item.word);
                      onClose();
                    }}
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.word}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {item.preview}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-4 flex-shrink-0">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.44-.795-6.14-2.124C5.688 10.76 5 7.888 5 5a5 5 0 0110 0c0 2.888-.688 5.76-.86 7.876z" />
                  </svg>
                  <p>No exploration history yet</p>
                  <p className="text-sm mt-1">Start exploring words to see your journey here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'popular' && (
            <div className="space-y-3">
              {mostExplored.length > 0 ? (
                mostExplored.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onWordClick(item.word);
                      onClose();
                    }}
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.word}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Explored {item.count} time{item.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {item.lastExplored && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(item.lastExplored)}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>No popular topics yet</p>
                  <p className="text-sm mt-1">Explore more to see your trending interests</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear your exploration history?')) {
                SearchHistory.clearHistory();
                onClose();
                window.location.reload(); // Simple refresh to update the UI
              }
            }}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            Clear all history
          </button>
        </div>
      </div>
    </div>
  );
}