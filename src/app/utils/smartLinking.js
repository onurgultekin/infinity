// Advanced word linking algorithm for Infinite Wiki
export class SmartLinkingEngine {
  constructor() {
    // Stop words to exclude from linking
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 
      'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 
      'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 
      'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 
      'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'whose', 'this', 
      'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 
      'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 
      'may', 'might', 'must', 'can', 'shall', 'not', 'no', 'nor', 'so', 'than', 'too', 'very', 
      'just', 'now', 'here', 'there', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 
      'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'also', 
      'as', 'if', 'because', 'while', 'since', 'until', 'although', 'unless', 'whether'
    ]);

    // High-value word patterns (more likely to be interesting)
    this.highValuePatterns = [
      /^[A-Z][a-z]+ism$/, // -ism words (capitalism, Buddhism)
      /^[A-Z][a-z]+ology$/, // -ology words (psychology, biology)
      /^[A-Z][a-z]+graphy$/, // -graphy words (photography, geography)
      /^[a-z]+tion$/, // -tion words (evolution, creation)
      /^[a-z]+ness$/, // -ness words (happiness, darkness)
      /^[a-z]+ment$/, // -ment words (development, movement)
      /^[a-z]+ical$/, // -ical words (philosophical, mathematical)
      /^[a-z]+eous$/, // -eous words (simultaneous, gorgeous)
      /^[a-z]+ous$/, // -ous words (mysterious, fabulous)
      /^[a-z]+ing$/, // -ing words (thinking, feeling)
      /^un[a-z]+/, // un- prefix (unusual, unexpected)
      /^re[a-z]+/, // re- prefix (revolution, renaissance)
      /^pre[a-z]+/, // pre- prefix (prehistoric, predetermined)
      /^meta[a-z]+/, // meta- prefix (metaphysical, metamorphosis)
      /^[a-z]*phon[a-z]*/, // phon- root (phonetic, symphony)
      /^[a-z]*graph[a-z]*/, // graph- root (graphic, telegraph)
      /^[a-z]*psych[a-z]*/, // psych- root (psychology, psyche)
      /^[a-z]*philosoph[a-z]*/, // philosoph- root
    ];

    // Academic/scientific domains
    this.domainKeywords = {
      science: ['quantum', 'molecular', 'atomic', 'neural', 'genetic', 'chemical', 'physical', 'biological'],
      philosophy: ['existential', 'metaphysical', 'ethical', 'consciousness', 'reality', 'truth', 'meaning'],
      psychology: ['cognitive', 'behavioral', 'emotional', 'mental', 'psychological', 'subconscious'],
      art: ['aesthetic', 'creative', 'artistic', 'visual', 'musical', 'literary', 'cultural'],
      history: ['ancient', 'medieval', 'renaissance', 'historical', 'traditional', 'classical'],
      technology: ['digital', 'computational', 'algorithmic', 'technological', 'innovative', 'systematic']
    };

    // Word importance weights
    this.importanceWeights = {
      high: ['concept', 'theory', 'principle', 'phenomenon', 'paradigm', 'methodology'],
      medium: ['process', 'system', 'structure', 'function', 'element', 'factor'],
      specialized: [] // Will be populated dynamically
    };
  }

  // Main function to process text and return linkable words
  processText(text, excludedWords = []) {
    const words = this.tokenizeText(text);
    const linkableWords = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const analysis = this.analyzeWord(word, i, words);
      
      if (analysis.isLinkable && !excludedWords.includes(word.toLowerCase())) {
        linkableWords.push({
          word: word,
          position: i,
          importance: analysis.importance,
          category: analysis.category,
          confidence: analysis.confidence
        });
      }
    }
    
    return this.rankAndFilterWords(linkableWords);
  }

  // Tokenize text into words and punctuation
  tokenizeText(text) {
    return text.split(/(\s+|[.,;:!?()[\]{}"\-–—])/);
  }

  // Analyze individual word for linkability
  analyzeWord(word, position, allWords) {
    const cleanWord = word.toLowerCase().trim();
    
    // Basic filters
    if (!this.passesBasicFilters(cleanWord)) {
      return { isLinkable: false };
    }

    // Calculate importance score
    const importance = this.calculateImportance(cleanWord, position, allWords);
    const category = this.categorizeWord(cleanWord);
    const confidence = this.calculateConfidence(cleanWord, importance, category);
    
    return {
      isLinkable: confidence > 0.3, // Threshold for linking
      importance,
      category,
      confidence
    };
  }

  // Basic filtering rules
  passesBasicFilters(word) {
    // Must be meaningful word (2+ characters, alphabetic)
    if (!/^[a-zA-Z]{2,}$/.test(word)) return false;
    
    // Not a stop word
    if (this.stopWords.has(word)) return false;
    
    // Not too short for context
    if (word.length < 3) return false;
    
    // Not a common pronoun or article we missed
    if (['he', 'she', 'it', 'we', 'they', 'his', 'her', 'its', 'our'].includes(word)) return false;
    
    return true;
  }

  // Calculate word importance (0-1 scale)
  calculateImportance(word, position, allWords) {
    let score = 0.5; // Base score
    
    // Length bonus (longer words often more meaningful)
    if (word.length > 6) score += 0.2;
    if (word.length > 9) score += 0.1;
    
    // High-value patterns
    for (const pattern of this.highValuePatterns) {
      if (pattern.test(word)) {
        score += 0.3;
        break;
      }
    }
    
    // Capitalization (proper nouns)
    if (/^[A-Z]/.test(allWords[position])) {
      score += 0.2;
    }
    
    // Domain-specific terms
    for (const [domain, keywords] of Object.entries(this.domainKeywords)) {
      if (keywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
        score += 0.25;
        break;
      }
    }
    
    // Context clues (surrounded by important words)
    const contextScore = this.getContextScore(position, allWords);
    score += contextScore * 0.1;
    
    return Math.min(score, 1.0);
  }

  // Categorize word by domain
  categorizeWord(word) {
    for (const [domain, keywords] of Object.entries(this.domainKeywords)) {
      if (keywords.some(keyword => 
        word.includes(keyword) || 
        keyword.includes(word) ||
        this.semanticSimilarity(word, keyword) > 0.7
      )) {
        return domain;
      }
    }
    return 'general';
  }

  // Simple semantic similarity (can be enhanced with more sophisticated NLP)
  semanticSimilarity(word1, word2) {
    // Simple character-based similarity for now
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    
    return matches / longer.length;
  }

  // Calculate confidence score
  calculateConfidence(word, importance, category) {
    let confidence = importance;
    
    // Category bonus
    if (category !== 'general') confidence += 0.1;
    
    // Word uniqueness (avoid common words)
    const commonWords = ['time', 'make', 'take', 'come', 'know', 'get', 'give', 'think', 'look', 'use', 'find', 'want', 'tell', 'ask', 'seem', 'feel', 'try', 'leave'];
    if (commonWords.includes(word)) confidence -= 0.3;
    
    return Math.max(0, Math.min(1, confidence));
  }

  // Analyze word context
  getContextScore(position, allWords) {
    let contextScore = 0;
    const windowSize = 3; // Look 3 words before and after
    
    for (let i = Math.max(0, position - windowSize); i <= Math.min(allWords.length - 1, position + windowSize); i++) {
      if (i === position) continue;
      
      const contextWord = allWords[i].toLowerCase();
      if (this.isImportantWord(contextWord)) {
        contextScore += 0.2;
      }
    }
    
    return Math.min(contextScore, 1.0);
  }

  // Check if word is inherently important
  isImportantWord(word) {
    const importantWords = [...this.importanceWeights.high, ...this.importanceWeights.medium];
    return importantWords.includes(word) || 
           this.highValuePatterns.some(pattern => pattern.test(word));
  }

  // Final ranking and filtering
  rankAndFilterWords(linkableWords) {
    // Sort by confidence score
    const sorted = linkableWords.sort((a, b) => b.confidence - a.confidence);
    
    // Limit to top 70% to avoid over-linking
    const maxLinks = Math.ceil(sorted.length * 0.7);
    const filtered = sorted.slice(0, maxLinks);
    
    // Ensure minimum quality threshold
    return filtered.filter(item => item.confidence > 0.4);
  }

  // Get styling class based on word importance
  getWordStyling(importance, category) {
    if (importance > 0.8) return 'link-high-importance';
    if (importance > 0.6) return 'link-medium-importance';
    return 'link-standard';
  }

  // Main public method
  generateSmartLinks(text, onWordClick, loadingWord = '') {
    const tokens = this.tokenizeText(text);
    const linkableData = this.processText(text);
    
    // Create lookup for quick access
    const linkableMap = new Map();
    linkableData.forEach(item => {
      linkableMap.set(item.word.toLowerCase(), item);
    });
    
    return tokens.map((token, index) => {
      const cleanToken = token.toLowerCase().trim();
      const linkData = linkableMap.get(cleanToken);
      
      if (linkData && /^[a-zA-Z]{2,}$/.test(token)) {
        const styling = this.getWordStyling(linkData.importance, linkData.category);
        
        return (
          <span
            key={index}
            className={`
              smart-link ${styling}
              relative cursor-pointer transition-all duration-200 ease-out
              hover:text-blue-700 dark:hover:text-blue-400
              px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded-lg
              hover:bg-blue-50 dark:hover:bg-blue-950/40
              hover:shadow-sm hover:shadow-blue-200/30 dark:hover:shadow-blue-900/20
              transform hover:scale-[1.02] hover:-translate-y-0.5
              ${loadingWord === token ? 
                'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/50' : 
                'hover:border hover:border-blue-200/30 dark:hover:border-blue-700/30'
              }
              before:absolute before:inset-0 before:rounded-lg before:border before:border-transparent
              hover:before:border-blue-300/20 dark:hover:before:border-blue-600/20
              after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-blue-500 after:rounded-full
              hover:after:w-full after:transition-all after:duration-300
            `}
            onClick={() => onWordClick(token)}
            title={`Explore "${token}" (${linkData.category} • ${Math.round(linkData.confidence * 100)}% relevance)`}
          >
            {token}
          </span>
        );
      }
      
      return <span key={index}>{token}</span>;
    });
  }
}