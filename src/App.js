import React, { useState, useEffect } from 'react';
import { Moon, Sun, RefreshCw, Search } from 'lucide-react';
import './App.css';

const TRANSLATIONS = {
  "en-US": {
    "appTitle": "Parempi kuin tosi",
    "toggleTheme": "Toggle theme",
    "inputPlaceholder": "iloinen",
    "searchAlternative": "Search for alternative",
    "getAnotherSuggestion": "Get another suggestion",
    "errorMessage": "Let's try again",
    "veryLabel": "Tosi"
  },
  "fi-FI": {
    "appTitle": "Parempi kuin tosi",
    "toggleTheme": "Vaihda teemaa",
    "inputPlaceholder": "iloinen",
    "searchAlternative": "Etsi vaihtoehto",
    "getAnotherSuggestion": "Hanki toinen ehdotus",
    "errorMessage": "Yritetään uudelleen",
    "veryLabel": "Tosi"
  }
};

// Secure API configuration
const getApiKey = () => {
  return process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyD6uV3_GyqOsYAvLL8xPN9cQVyxbGW0vgo';
};

const appLocale = process.env.REACT_APP_LOCALE || 'fi-FI';
const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US';
const findMatchingLocale = (locale) => {
  if (TRANSLATIONS[locale]) return locale;
  const lang = locale.split('-')[0];
  const match = Object.keys(TRANSLATIONS).find(key => key.startsWith(lang + '-'));
  return match || 'en-US';
};
const locale = findMatchingLocale(appLocale !== 'undefined' ? appLocale : browserLocale);
const t = (key) => TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en-US'][key] || key;

// Custom hook for theme management
const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return { isDark, setIsDark };
};

// Typewriter animation component
const TypewriterText = ({ text, className = "", onStart }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex === 0 && text && onStart) {
      onStart();
    }
    
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, onStart]);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return <span className={className}>{displayText}</span>;
};

const App = () => {
  const [adjective, setAdjective] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [examples, setExamples] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fade, setFade] = useState(false);
  const [previousSuggestions, setPreviousSuggestions] = useState([]);
  const [error, setError] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { isDark, setIsDark } = useTheme();

  const getSuggestion = async (refresh = false) => {
    if (!adjective.trim() || isLoading) return;

    setIsLoading(true);
    setFade(true);
    setError(false);

    try {
      const fallbackSuggestions = {
        'iloinen': { suggestion: 'riemukkaasti', examples: ['Hän oli riemukkaasti innoissaan uudesta työstään.', 'Lapset leikkivät riemukkaasti puistossa.'] },
        'väsynyt': { suggestion: 'uupunut', examples: ['Hän oli täysin uupunut pitkän työpäivän jälkeen.', 'Maratonari oli uupunut maalissa.'] },
        'nopea': { suggestion: 'salamannopea', examples: ['Auto oli salamannopea moottoritiellä.', 'Hänen reaktionsa oli salamannopea.'] },
        'iso': { suggestion: 'valtava', examples: ['Rakennus oli valtava ja vaikuttava.', 'Järvi oli valtava ja syvä.'] },
        'kylmä': { suggestion: 'jäätävä', examples: ['Ilma oli jäätävä talviaamuna.', 'Hänen katseensa oli jäätävä.'] },
        'kuuma': { suggestion: 'polttava', examples: ['Aurinko oli polttava kesäpäivänä.', 'Hänen intohimonsa oli polttava.'] },
        'pieni': { suggestion: 'mitätön', examples: ['Ongelma oli mitätön verrattuna muihin.', 'Hänen panoksensa oli mitätön.'] },
        'hidas': { suggestion: 'hidasliikkeinen', examples: ['Kilpikonna oli hidasliikkeinen eläin.', 'Prosessi oli hidasliikkeinen ja raskas.'] },
        'kaunis': { suggestion: 'upea', examples: ['Maisema oli upea auringonlaskussa.', 'Hänen äänensä oli upea.'] },
        'hyvä': { suggestion: 'erinomainen', examples: ['Hänen suorituksensa oli erinomainen.', 'Ruoka oli erinomainen illallisella.'] }
      };
      
      const fallback = fallbackSuggestions[adjective.toLowerCase()] || {
        suggestion: 'voimakkaampi',
        examples: ['Tämä on voimakkaampi ilmaisu.', 'Käytä voimakkaampaa sanaa.']
      };
      
      setSuggestion(fallback.suggestion);
      setExamples(fallback.examples);
      setPreviousSuggestions(prev => [...prev, fallback.suggestion]);
      
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      setError(true);
      setSuggestion('');
      setExamples([]);
    } finally {
      setIsLoading(false);
      setFade(false);
    }
  };

  const handleInputChange = (e) => {
    setAdjective(e.target.value);
    setSuggestion('');
    setExamples([]);
    setPreviousSuggestions([]);
    setError(false);
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      getSuggestion();
    }
  };

  const handleRefresh = () => {
    if (suggestion && !isLoading) {
      setIsTyping(false);
      getSuggestion(true);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">
          {t('appTitle')}
        </h1>
        <button
          onClick={() => setIsDark(!isDark)}
          className="theme-toggle"
          aria-label={t('toggleTheme')}
          type="button"
        >
          {isDark ? <Sun className="icon" /> : <Moon className="icon" />}
        </button>
      </header>

      <main className="main">
        <div className="container">
          <div className={`input-section ${isTyping ? 'typing' : ''}`}>
            <div className="input-wrapper">
              <span className="very-label">{t('veryLabel')}</span>
              <div className="input-group">
                <input
                  type="text"
                  value={adjective}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onBlur={() => adjective && !suggestion && getSuggestion()}
                  placeholder={t('inputPlaceholder')}
                  className="adjective-input"
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  onClick={() => adjective && getSuggestion()}
                  className={`search-button ${!adjective ? 'disabled' : ''}`}
                  disabled={!adjective}
                  aria-label={t('searchAlternative')}
                  type="button"
                >
                  <Search className="icon-small" />
                </button>
              </div>
            </div>
          </div>

          {suggestion && (
            <div className={`result-section ${fade ? 'fade' : ''}`}>
              <div className="result-content">
                <div className="suggestion-wrapper">
                  <div className="suggestion">
                    "<TypewriterText 
                      text={suggestion} 
                      onStart={() => setIsTyping(true)}
                    />"
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className={`refresh-button ${isLoading ? 'loading' : ''}`}
                    aria-label={t('getAnotherSuggestion')}
                    type="button"
                  >
                    <RefreshCw className="icon-small" />
                  </button>
                </div>
                
                {examples.length > 0 && (
                  <div className="examples">
                    {examples.map((example, index) => (
                      <div key={index} className="example">
                        {example}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="error-section">
              <div className="error-message">
                {t('errorMessage')}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;