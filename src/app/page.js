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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
      {/* Geometric Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 dark:bg-blue-950/30 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-100 dark:bg-purple-950/30 rounded-2xl rotate-45 blur-2xl opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-indigo-50 dark:bg-indigo-950/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-cyan-100 dark:bg-cyan-950/30 rounded-xl rotate-12 blur-2xl opacity-50"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12 sm:mb-4">
          <div className="relative inline-block mb-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extralight text-gray-900 dark:text-gray-100 tracking-[-0.02em]">
              Infinite
            </h1>
            {/* Decorative line */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-blue-500 rounded-full"></div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-purple-500 rounded-full"></div>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 font-light max-w-3xl mx-auto leading-relaxed px-4 mb-8">
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
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-6 sm:p-8 lg:p-12 transition-all duration-500">
              {/* Corner decorations */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 dark:bg-blue-400/5 rounded-bl-3xl rounded-tr-3xl"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/5 dark:bg-purple-400/5 rounded-tr-3xl rounded-bl-3xl"></div>
              
              {isLoading && !content ? (
                <div className="text-center py-20">
                  <div className="relative mb-8">
                    {/* Modern geometric loader */}
                    <div className="w-16 h-16 mx-auto relative">
                      <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-xl"></div>
                      <div className="absolute inset-0 border-2 border-blue-500 border-r-transparent border-b-transparent rounded-xl animate-spin"></div>
                      <div className="absolute inset-2 border-2 border-purple-500 border-l-transparent border-t-transparent rounded-lg animate-spin animate-reverse" style={{animationDuration: '1.5s'}}></div>
                      <div className="absolute inset-4 bg-blue-500 rounded-sm animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-xl font-light tracking-wide">
                    Discovering knowledge...
                  </p>
                  {/* Simple dots animation */}
                  <div className="mt-6 flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-lg sm:prose-xl prose-gray dark:prose-invert max-w-none">
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed font-light text-base sm:text-lg lg:text-xl">
                    {renderClickableText(content)}
                    {(isLoading || loadingWord) && (
                      <span className="inline-block w-0.5 sm:w-1 h-5 sm:h-6 bg-blue-500 animate-pulse ml-1 rounded-full"></span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center">
          <div className="inline-flex items-center space-x-3 text-gray-500 dark:text-gray-400 text-sm">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <span className="font-light">An Onur Gültekin product</span>
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
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
