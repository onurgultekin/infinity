'use client';

import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import SearchStats from './components/SearchStats';
import { useSearchHistory } from './utils/searchHistory';
import { SmartLinkingEngine } from './utils/smartLinking';

export default function Home() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingWord, setLoadingWord] = useState('');
  const [showStats, setShowStats] = useState(false);
  const { history, addToHistory, wordCount } = useSearchHistory();
  const [smartLinker] = useState(() => new SmartLinkingEngine());

  useEffect(() => {
    // Get random word and explanation on first load
    getRandomWordExplanation();
  }, []);

  const getRandomWordExplanation = async () => {
    setIsLoading(true);
    setContent('');
    try {
      const response = await fetch('/api/explanation');
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'content') {
              fullContent += data.content;
              setContent(fullContent);
              
              // Stop loading indicator once content starts flowing
              if (isLoading) {
                setIsLoading(false);
              }
            }
            
            // Check if response is complete and add to history
            if (data.done && fullContent) {
              // Get the word from the initial data or use a default
              const wordToSave = data.word || 'Random Word';
              addToHistory(wordToSave, fullContent);
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setContent('Error loading content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordClick = async (word) => {
    setLoadingWord(word);
    setContent('');
    try {
      const response = await fetch('/api/explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
      });
      
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'content') {
              fullContent += data.content;
              setContent(fullContent);
              
              // Clear word loading indicator once content starts flowing
              if (loadingWord) {
                setLoadingWord('');
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
      
      // Add to history after content is complete
      if (fullContent) {
        addToHistory(word, fullContent);
      }
    } catch (error) {
      console.error('Error:', error);
      setContent('Error loading content. Please try again.');
    } finally {
      setLoadingWord('');
    }
  };

  const renderClickableText = (text) => {
    if (!text || !smartLinker) return text;
    
    try {
      return smartLinker.generateSmartLinks(text, handleWordClick, loadingWord);
    } catch (error) {
      console.error('Smart linking error:', error);
      // Fallback to simple rendering if smart linking fails
      return text.split(/(\s+|[.,;:!?()[\]{}"])/).map((word, index) => {
        if (word.match(/^[a-zA-Z]{2,}$/)) {
          return (
            <span
              key={index}
              className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors duration-200"
              onClick={() => handleWordClick(word)}
            >
              {word}
            </span>
          );
        }
        return <span key={index}>{word}</span>;
      });
    }
  };

  const handleSearchSelect = (item) => {
    setContent(item.content);
    // Optional: could re-fetch fresh content for this word
    // handleWordClick(item.word);
  };

  const handleNewWordSearch = (word) => {
    // Directly search for a new word that's not in history
    handleWordClick(word);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Clean minimal background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-20 w-px h-32 bg-gray-200 dark:bg-gray-800 rotate-12"></div>
        <div className="absolute bottom-40 left-16 w-2 h-2 bg-blue-400 rounded-full"></div>
        <div className="absolute top-1/2 left-8 w-1 h-16 bg-gray-300 dark:bg-gray-700"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12 sm:mb-16">
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 dark:text-gray-100 tracking-tight">
              Infinite Word Wiki
            </h1>
            {/* Simple underline */}
            <div className="mt-4 w-12 h-px bg-blue-500 mx-auto"></div>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 font-normal max-w-2xl mx-auto mb-8">
            Click any word to dive deeper into knowledge
          </p>
          
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar 
              searchHistory={history} 
              onSearchSelect={handleSearchSelect} 
              onNewWordSearch={handleNewWordSearch}
            />
          </div>
          
          {/* Stats Button */}
          {wordCount > 0 && (
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={() => setShowStats(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-sm text-gray-600 dark:text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>{wordCount} words explored</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="mb-12 sm:mb-16">
          <div className="relative">
            {/* Content Card with depth */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 sm:p-8 lg:p-10 transition-all duration-300">
              {/* Clean minimal decorations */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-bl-2xl rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 bg-gray-50 dark:bg-gray-800/50 rounded-tr-2xl rounded-bl-2xl"></div>
              
              {isLoading && !content ? (
                <div className="text-center py-20">
                  <div className="relative mb-8">
                    {/* Clean, minimal loader */}
                    <div className="w-12 h-12 mx-auto relative">
                      <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-blue-500 border-r-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                    Loading...
                  </p>
                </div>
              ) : loadingWord && !content ? (
                <div className="text-center py-20">
                  <div className="relative mb-8">
                    {/* Clean word-specific loader */}
                    <div className="w-14 h-14 mx-auto relative">
                      <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-blue-500 border-r-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border border-gray-300 dark:border-gray-600 rounded-full animate-ping opacity-30"></div>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 text-xl font-medium mb-1">
                    <span className="text-blue-600 dark:text-blue-400">"{loadingWord}"</span>
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Gathering information...
                  </p>
                </div>
              ) : (
                <div className="prose prose-lg sm:prose-xl prose-gray dark:prose-invert max-w-none transition-all duration-500 ease-in-out animate-fadeInUp">
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed font-light text-base sm:text-lg lg:text-xl">
                    <div className={`transition-opacity duration-300 ${content ? 'opacity-100' : 'opacity-50'}`}>
                      {renderClickableText(content)}
                      {(isLoading || loadingWord) && (
                        <span className="inline-flex items-center ml-2">
                          <span className="inline-block w-0.5 sm:w-1 h-5 sm:h-6 bg-blue-500 animate-pulse rounded-full mr-1"></span>
                          <span className="text-blue-500 dark:text-blue-400 text-sm font-medium animate-pulse">
                            {loadingWord ? `Loading "${loadingWord}"...` : 'Generating...'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            <span className="font-light">An Onur Gültekin product</span>
          </div>
        </footer>
      </div>
      
      {/* Search Stats Modal */}
      <SearchStats 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
        onWordClick={handleWordClick}
      />
    </div>
  );
}
