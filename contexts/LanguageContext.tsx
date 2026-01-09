import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'zapoteco' | 'mixteco';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  greeting: string;
  languageLabel: string;
}

// Translations for key phrases in indigenous languages
const translations: Record<Language, Record<string, string>> = {
  es: {
    greeting: 'Bienvenido',
    welcome_message: 'La maxima fiesta de los Oaxaquenos',
    home: 'Inicio',
    events: 'Eventos',
    explore: 'Explorar',
    profile: 'Perfil',
    search: 'Buscar',
    transport: 'Transporte',
    program: 'Programa',
    stories: 'Historias',
    shop: 'Tienda',
    communities: 'Comunidades',
    discover_oaxaca: 'Descubre Oaxaca',
    next_event: 'Proximo Evento',
    see_more: 'Ver mas',
    hello: 'Hola',
    thank_you: 'Gracias',
    goodbye: 'Adios',
    festival: 'Festival',
    dance: 'Danza',
    music: 'Musica',
    food: 'Comida',
    crafts: 'Artesanias',
  },
  zapoteco: {
    // Zapoteco del Valle (Diidxazá)
    greeting: 'Padiuxhi',
    welcome_message: 'Lidxi ni runi guelaguetza',
    home: 'Lidxi',
    events: 'Guendarannaxhii',
    explore: 'Guyubi',
    profile: 'Laanu',
    search: 'Guiniu',
    transport: 'Guendarigà',
    program: 'Guendanabani',
    stories: 'Diidxagola',
    shop: 'Guigu',
    communities: 'Guendalisaa',
    discover_oaxaca: 'Guyubi Guisi',
    next_event: 'Stubi guendanabani',
    see_more: 'Guyubi mas',
    hello: 'Padiuxhi',
    thank_you: 'Xhidxi',
    goodbye: 'Adiuxhi',
    festival: 'Guelaguetza',
    dance: 'Xquenda',
    music: 'Saa',
    food: 'Guendaró',
    crafts: 'Gueela',
  },
  mixteco: {
    // Mixteco de la Costa
    greeting: 'Naxini',
    welcome_message: 'Viko koo savi',
    home: 'Vehi',
    events: 'Viko',
    explore: 'Kunio',
    profile: 'Yuunio',
    search: 'Nanio',
    transport: 'Kunchaa',
    program: 'Tutu viko',
    stories: 'Tutu nuu',
    shop: 'Tianui',
    communities: 'Ñuu',
    discover_oaxaca: 'Kunio Ñuu Savi',
    next_event: 'Siki viko',
    see_more: 'Kunio ka',
    hello: 'Naxini',
    thank_you: 'Tivini',
    goodbye: 'Kunchani',
    festival: 'Viko',
    dance: 'Yaa',
    music: 'Yaa',
    food: 'Nduchi',
    crafts: 'Tikuii',
  },
};

const languageLabels: Record<Language, string> = {
  es: 'Espanol',
  zapoteco: 'Diidxazá',
  mixteco: 'Tu\'un Savi',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('guelaguetza-language');
    return (saved as Language) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('guelaguetza-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['es'][key] || key;
  };

  const greeting = translations[language].greeting;
  const languageLabel = languageLabels[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, greeting, languageLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Language selector component
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, languageLabel } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; native: string; flag: string }[] = [
    { code: 'es', label: 'Espanol', native: 'Espanol', flag: '🇲🇽' },
    { code: 'zapoteco', label: 'Zapoteco', native: 'Diidxazá', flag: '🌸' },
    { code: 'mixteco', label: 'Mixteco', native: "Tu'un Savi", flag: '🌧️' },
  ];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs bg-oaxaca-purple/10 hover:bg-oaxaca-purple/20 text-oaxaca-purple dark:text-oaxaca-yellow rounded-full transition"
        >
          <span>{languages.find(l => l.code === language)?.flag}</span>
          <span className="font-medium">{languageLabel}</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Idioma / Language</p>
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    language === lang.code ? 'bg-oaxaca-purple/10 text-oaxaca-purple dark:text-oaxaca-yellow' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="text-left">
                    <p className="font-medium">{lang.native}</p>
                    <p className="text-[10px] text-gray-400">{lang.label}</p>
                  </div>
                  {language === lang.code && (
                    <span className="ml-auto text-oaxaca-pink">✓</span>
                  )}
                </button>
              ))}
              <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <p className="text-[10px] text-gray-400 text-center">
                  Preservando lenguas originarias
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <span className="text-lg">🗣️</span>
        Idioma / Language
      </h3>
      <div className="space-y-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              language === lang.code
                ? 'bg-oaxaca-purple text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="text-left">
              <p className="font-medium">{lang.native}</p>
              <p className={`text-xs ${language === lang.code ? 'text-white/70' : 'text-gray-400'}`}>
                {lang.label}
              </p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center mt-3">
        Preservando las lenguas originarias de Oaxaca
      </p>
    </div>
  );
}
