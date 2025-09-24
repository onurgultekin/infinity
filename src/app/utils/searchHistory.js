// Search history management utilities
export class SearchHistory {
  static STORAGE_KEY = 'infinite-wiki-history';
  static MAX_HISTORY_SIZE = 100;

  static getHistory() {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  static addToHistory(word, content) {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getHistory();
      
      // Remove existing entry for this word if it exists
      const filteredHistory = history.filter(item => item.word !== word);
      
      // Add new entry at the beginning
      const newEntry = {
        word,
        content: content.slice(0, 500), // Store first 500 chars for search
        timestamp: Date.now(),
        id: `${word}-${Date.now()}`
      };
      
      filteredHistory.unshift(newEntry);
      
      // Keep only the most recent entries
      const trimmedHistory = filteredHistory.slice(0, this.MAX_HISTORY_SIZE);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving to search history:', error);
    }
  }

  static clearHistory() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  static getWordCount() {
    return this.getHistory().length;
  }

  static getExploredWords() {
    return this.getHistory().map(item => item.word);
  }

  static searchInHistory(query) {
    const history = this.getHistory();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return [];
    
    return history.filter(item => 
      item.word.toLowerCase().includes(searchTerm) ||
      item.content.toLowerCase().includes(searchTerm)
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  static getMostExploredTopics(limit = 10) {
    const history = this.getHistory();
    const wordCount = {};
    
    // Count word frequency
    history.forEach(item => {
      wordCount[item.word] = (wordCount[item.word] || 0) + 1;
    });
    
    // Sort by frequency and return top items
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([word, count]) => ({
        word,
        count,
        lastExplored: history.find(item => item.word === word)?.timestamp
      }));
  }

  static getRecentExplorations(limit = 10) {
    return this.getHistory()
      .slice(0, limit)
      .map(item => ({
        word: item.word,
        timestamp: item.timestamp,
        preview: item.content.slice(0, 100) + '...'
      }));
  }
}

// Hook for using search history in React components
import { useState, useEffect } from 'react';

export function useSearchHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(SearchHistory.getHistory());
  }, []);

  const addToHistory = (word, content) => {
    SearchHistory.addToHistory(word, content);
    setHistory(SearchHistory.getHistory());
  };

  const clearHistory = () => {
    SearchHistory.clearHistory();
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    clearHistory,
    wordCount: history.length,
    exploredWords: history.map(item => item.word)
  };
}