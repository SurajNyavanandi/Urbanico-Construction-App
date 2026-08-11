import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'en' | 'te' | 'hi' | 'kn' | 'ta';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (Default)',
    flag: '🇬🇧',
    region: 'Default Language',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    region: 'Andhra Pradesh & Telangana',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    region: 'Pan-India',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    region: 'Karnataka',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    region: 'Tamil Nadu',
  },
];

export interface TranslationDictionary {
  home: string;
  materials: string;
  services: string;
  basket: string;
  favorites: string;
  profile: string;
  settings: string;
  activity: string;
  language: string;
  languageSub: string;
  selectLanguagePromptTitle: string;
  selectLanguagePromptSub: string;
  confirmLanguage: string;
  changeLanguageAnytime: string;
  searchPlaceholder: string;
  orderNow: string;
  getQuote: string;
  addToBasket: string;
  checkout: string;
  deliveryLocation: string;
  themeMode: string;
  notifications: string;
  welcome: string;
  verifiedAccount: string;
  languageUpdatedToast: string;
  quickActions: string;
  allCategories: string;
  activeOrders: string;
}

const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    home: 'Home',
    materials: 'Materials',
    services: 'Services',
    basket: 'Basket',
    favorites: 'Favorites',
    profile: 'My Profile',
    settings: 'Preferences & Settings',
    activity: 'Activity Dashboard',
    language: 'Language Preferences',
    languageSub: 'Choose your preferred app display language',
    selectLanguagePromptTitle: 'Select Preferred Language',
    selectLanguagePromptSub: 'Welcome! Please choose your preferred language for the Urbanico app.',
    confirmLanguage: 'Confirm Language',
    changeLanguageAnytime: 'You can update your language anytime in Settings',
    searchPlaceholder: 'Search sand, cement, steel, JCB...',
    orderNow: 'Order Now',
    getQuote: 'Get Fast Quote',
    addToBasket: 'Add to Basket',
    checkout: 'Proceed to Checkout',
    deliveryLocation: 'Delivery Site Location',
    themeMode: 'Dark Mode Theme',
    notifications: 'Notification Controls',
    welcome: 'Welcome to Urbanico',
    verifiedAccount: 'Verified Contractor Account',
    languageUpdatedToast: 'App language updated to English',
    quickActions: 'Quick Actions',
    allCategories: 'All Categories',
    activeOrders: 'Active Orders',
  },
  te: {
    home: 'హోమ్',
    materials: 'మెటీరియల్స్',
    services: 'సేవలు',
    basket: 'బాస్కెట్',
    favorites: 'ఇష్టమైనవి',
    profile: 'నా ప్రొఫైల్',
    settings: 'ప్రాధాన్యతలు & సెట్టింగ్‌లు',
    activity: 'యాక్టివిటీ డాష్‌బోర్డ్',
    language: 'భాషా ప్రాధాన్యతలు',
    languageSub: 'యాప్ ప్రదర్శన భాషను ఎంచుకోండి',
    selectLanguagePromptTitle: 'మీ ప్రాధాన్య భాషను ఎంచుకోండి',
    selectLanguagePromptSub: 'స్వాగతం! అర్బానికో యాప్ కోసం మీ ప్రాధాన్యత భాషను ఎంచుకోండి.',
    confirmLanguage: 'భాషను స్థిరీకరించు',
    changeLanguageAnytime: 'మీరు సెట్టింగ్‌లలో దీన్ని ఎప్పుడైనా మార్చవచ్చు',
    searchPlaceholder: 'ఇసుక, సిమెంట్, ఐరన్ రోడ్లు వెతకండి...',
    orderNow: 'ఇప్పుడే ఆర్డర్ చేయండి',
    getQuote: 'త్వరిత కోట్ పొందండి',
    addToBasket: 'బాస్కెట్‌లో చేర్చండి',
    checkout: 'చెల్లింపుకు కొనసాగండి',
    deliveryLocation: 'డెలివరీ ప్రాంతం',
    themeMode: 'డార్క్ మోడ్ థీమ్',
    notifications: 'నోటిఫికేషన్ నియంత్రణలు',
    welcome: 'అర్బానికోకి స్వాగతం',
    verifiedAccount: 'ధృవీకరించబడిన కాంట్రాక్టర్ ఖాతా',
    languageUpdatedToast: 'యాప్ భాష తెలుగుకి నవీకరించబడింది',
    quickActions: 'త్వరిత చర్యలు',
    allCategories: 'అన్ని వర్గాలు',
    activeOrders: 'యాక్టివ్ ఆర్డర్‌లు',
  },
  hi: {
    home: 'होम',
    materials: 'सामग्री',
    services: 'सेवाएं',
    basket: 'टोकरी',
    favorites: 'पसंदीदा',
    profile: 'मेरी प्रोफ़ाइल',
    settings: 'प्राथमिकताएं और सेटिंग्स',
    activity: 'गतिविधि डैशबोर्ड',
    language: 'भाषा प्राथमिकताएं',
    languageSub: 'अपनी पसंदीदा ऐप भाषा चुनें',
    selectLanguagePromptTitle: 'पसंदीदा भाषा चुनें',
    selectLanguagePromptSub: 'स्वागत है! अर्बनिको ऐप के लिए अपनी पसंदीदा भाषा चुनें।',
    confirmLanguage: 'भाषा की पुष्टि करें',
    changeLanguageAnytime: 'आप इसे सेटिंग्स में कभी भी बदल सकते हैं',
    searchPlaceholder: 'रेत, सीमेंट, सरिया, जेसीबी खोजें...',
    orderNow: 'अभी ऑर्डर करें',
    getQuote: 'त्वरित कोट प्राप्त करें',
    addToBasket: 'टोकरी में जोड़ें',
    checkout: 'चेकआउट के लिए आगे बढ़ें',
    deliveryLocation: 'डिलीवरी का स्थान',
    themeMode: 'डार्क मोड थीम',
    notifications: 'सूचना नियंत्रण',
    welcome: 'अर्बनिको में आपका स्वागत है',
    verifiedAccount: 'सत्यापित ठेकेदार खाता',
    languageUpdatedToast: 'ऐप भाषा हिंदी में अपडेट की गई',
    quickActions: 'त्वरित कार्य',
    allCategories: 'सभी श्रेणियां',
    activeOrders: 'सक्रिय ऑर्डर',
  },
  kn: {
    home: 'ಹೋಮ್',
    materials: 'ಸಾಮಗ್ರಿಗಳು',
    services: 'ಸೇವೆಗಳು',
    basket: 'ಬುಟ್ಟಿ',
    favorites: 'ನೆಚ್ಚಿನವು',
    profile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    settings: 'ಆದ್ಯತೆಗಳು ಮತ್ತು ಸೇಟಿಂಗ್ಸ್',
    activity: 'ಚಟುವಟಿಕೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    language: 'ಭಾಷಾ ಆದ್ಯತೆಗಳು',
    languageSub: 'ನಿಮ್ಮ ಆಪ್ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    selectLanguagePromptTitle: 'ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    selectLanguagePromptSub: 'ಸ್ವಾಗತ! ಅರ್ಬಾನಿಕೋ ಆಪ್‌ಗಾಗಿ ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    confirmLanguage: 'ಭಾಷೆಯನ್ನು ಖಚಿತಪಡಿಸಿ',
    changeLanguageAnytime: 'ನೀವು ಸೇಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಯಾವಾಗ ಬೇಕಾದರೂ ಇದನ್ನು ಬದಲಾಯಿಸಬಹುದು',
    searchPlaceholder: 'ಮರಳು, ಸಿಮೆಂಟ್, ರೇಬಾರ್ ಹುಡುಕಿ...',
    orderNow: 'ಈಗಲೇ ಆರ್ಡರ್ ಮಾಡಿ',
    getQuote: 'ತ್ವರಿತ ಕೋಟ್ ಪಡೆಯಿರಿ',
    addToBasket: 'ಬುಟ್ಟಿಗೆ ಸೇರಿಸಿ',
    checkout: 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
    deliveryLocation: 'ಡೆಲಿವರಿ ಸ್ಥಳ',
    themeMode: 'ಡಾರ್ಕ್ ಮೋಡ್ ಥೀಮ್',
    notifications: 'ಅಧಿಸೂಚನೆ ನಿಯಂತ್ರಣಗಳು',
    welcome: 'ಅರ್ಬಾನಿಕೋಗೆ ಸ್ವಾಗತ',
    verifiedAccount: 'ಪರಿಶೀಲಿಸಿದ ಗುತ್ತಿಗೆದಾರ ಖಾತೆ',
    languageUpdatedToast: 'ಆಪ್ ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ನವೀಕರಿಸಲಾಗಿದೆ',
    quickActions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    activeOrders: 'ಸಕ್ರಿಯ ಆರ್ಡರ್‌ಗಳು',
  },
  ta: {
    home: 'முகப்பு',
    materials: 'பொருட்கள்',
    services: 'சேவைகள்',
    basket: 'கூடை',
    favorites: 'பிடித்தவை',
    profile: 'என் சுயவிவரம்',
    settings: 'விருப்பங்கள் & அமைப்புகள்',
    activity: 'செயல்பாட்டு டாஷ்போர்டு',
    language: 'மொழி விருப்பங்கள்',
    languageSub: 'உங்கள் பயன்பாட்டு மொழியைத் தேர்ந்தெடுக்கவும்',
    selectLanguagePromptTitle: 'விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',
    selectLanguagePromptSub: 'வரவேற்கிறோம்! அர்பானிகோ பயன்பாட்டிற்காக உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்.',
    confirmLanguage: 'மொழியை உறுதிப்படுத்தவும்',
    changeLanguageAnytime: 'அமைப்புகளில் இதை எப்போது வேண்டுமானாலும் மாற்றலாம்',
    searchPlaceholder: 'மணல், சிமெண்ட், இரும்பு தேடவும்...',
    orderNow: 'இப்பொழுதே ஆர்டர் செய்',
    getQuote: 'விரைவான கோரிக்கை பெறுக',
    addToBasket: 'கூடையில் சேர்',
    checkout: 'செக்அவுட்டிற்கு தொடரவும்',
    deliveryLocation: 'டெலிவரி இடம்',
    themeMode: 'டார்க் மோட் கருப்பொருள்',
    notifications: 'அறிவிப்பு கட்டுப்பாடுகள்',
    welcome: 'அர்பானிகோவிற்கு வரவேற்கிறோம்',
    verifiedAccount: 'சரிபார்க்கப்பட்ட ஒப்பந்ததாரர் கணக்கு',
    languageUpdatedToast: 'செயலி மொழி தமிழுக்கு புதுப்பிக்கப்பட்டது',
    quickActions: 'விரைவு செயல்கள்',
    allCategories: 'அனைத்து பிரிவுகள்',
    activeOrders: 'செயலில் உள்ள ஆர்டர்கள்',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  currentLanguageOption: LanguageOption;
  t: TranslationDictionary;
  languageOptions: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
  };

  const currentLanguageOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) || LANGUAGE_OPTIONS[0];

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageOption,
        t,
        languageOptions: LANGUAGE_OPTIONS,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
