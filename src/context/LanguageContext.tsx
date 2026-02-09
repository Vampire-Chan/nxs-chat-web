import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Language = 'en' | 'hi' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    "login.welcome": "Welcome back, Operator.",
    "login.subtitle": "Re-establish your neural link to the Matrix.",
    "login.email": "Identity Handle / Email",
    "login.password": "Access Key",
    "login.submit": "Initialize Link",
    "login.register": "New Identity?",
    "register.title": "Establish Node",
    "register.subtitle": "Construct a new node in the Matrix.",
    "register.handle": "Identity Handle",
    "register.name": "Public Name",
    "register.dob": "Date of Creation",
    "register.continue": "Continue",
    "register.abort": "Abort",
    "register.bio": "Bio-Transmission",
    "register.bio_placeholder": "Describe your node...",
    "register.enter": "Enter the Matrix",
    "nav.home": "Home",
    "nav.explore": "Explore",
    "nav.social": "Social",
    "nav.profile": "Profile Hub",
    "nav.settings": "System Config",
    "nav.logout": "Disconnect",
    "feed.broadcast": "Broadcast to the Matrix...",
    "feed.share": "Share",
    "feed.share_sector": "Share to this Sector...",
    "common.save": "Finalize",
    "common.cancel": "Cancel",
    "common.delete": "Purge",
    "common.edit": "Recalibrate",
    "common.back": "Return",
    "help.title": "Nexus Protocol // Manual",
    "help.intro": "Welcome to Nexus. A hybrid social architecture combining sovereign realms with a global neural matrix.",
    "help.realms": "Realms & Sectors",
    "help.realms_desc": "Independent community nodes for organized communication.",
    "help.matrix": "Neural Matrix",
    "help.matrix_desc": "The global stream of consciousness for mass broadcasts.",
    "help.identity": "Identity Security",
    "help.identity_desc": "Manage encryption, privacy, and node calibration.",
    "notifications.title": "Neural Pulse",
    "notifications.empty": "Zero Alerts Pending",
    "notifications.mark_all": "Mark All Read",
    "settings.language": "Neural Language",
    "settings.language_desc": "Select interface dialect.",
    "settings.appearance": "Visual Interface",
    "settings.security": "Identity Security",
    "settings.billing": "Premium Ledger",
    "settings.legal": "Nexus Protocols",
    "profile.displayname": "Public Alias",
    "profile.dob": "Date of Creation",
    "profile.bio": "Identity Description",
    "profile.private": "Private Ghost Node",
    "profile.private_desc": "Invisible to public matrix",
    "logout.confirm": "Sever neural link?",
    "logout.switch": "Switch account node?",
    "logout.desc": "Do you wish to disconnect or swap to another active identity?",
    "logout.btn_logout": "Logout",
    "logout.btn_switch": "Switch Node"
  },
  hi: {
    "login.welcome": "वापसी पर स्वागत है, ऑपरेटर।",
    "login.subtitle": "मैट्रिक्स के साथ अपना न्यूरल लिंक फिर से स्थापित करें।",
    "login.email": "पहचान हैंडल / ईमेल",
    "login.password": "एक्सेस कुंजी",
    "login.submit": "लिंक प्रारंभ करें",
    "login.register": "नई पहचान?",
    "register.title": "नोड स्थापित करें",
    "register.subtitle": "मैट्रिक्स में एक नया नोड बनाएं।",
    "register.handle": "पहचान हैंडल",
    "register.name": "सार्वजनिक नाम",
    "register.dob": "निर्माण की तिथि",
    "register.continue": "जारी रखें",
    "register.abort": "रद्द करें",
    "register.bio": "बायो-ट्रांसमिशन",
    "register.bio_placeholder": "अपने नोड का वर्णन करें...",
    "register.enter": "मैट्रिक्स में प्रवेश करें",
    "nav.home": "मुख्य",
    "nav.explore": "खोजें",
    "nav.social": "सामाजिक",
    "nav.profile": "प्रोफ़ाइल हब",
    "nav.settings": "सिस्टम सेटिंग्स",
    "nav.logout": "डिस्कनेक्ट",
    "feed.broadcast": "मैट्रिक्स में प्रसारित करें...",
    "feed.share": "साझा करें",
    "feed.share_sector": "इस सेक्टर में साझा करें...",
    "common.save": "अंतिम रूप दें",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.edit": "बदलें",
    "common.back": "वापस",
    "help.title": "नेक्सस प्रोटोकॉल // मैनुअल",
    "help.intro": "नेक्सस में आपका स्वागत है। एक हाइब्रिड सामाजिक वास्तुकला जो वैश्विक मैट्रिक्स के साथ संप्रभु लोकों को जोड़ती है।",
    "help.realms": "लोक और सेक्टर",
    "help.realms_desc": "संगठित संचार के लिए स्वतंत्र सामुदायिक नोड्स।",
    "help.matrix": "न्यूरल मैट्रिक्स",
    "help.matrix_desc": "सामूहिक प्रसारण के लिए चेतना की वैश्विक धारा।",
    "help.identity": "पहचान सुरक्षा",
    "help.identity_desc": "एन्क्रिप्शन, गोपनीयता और नोड अंशांकन प्रबंधित करें।",
    "notifications.title": "न्यूरल पल्स",
    "notifications.empty": "कोई अलर्ट लंबित नहीं",
    "notifications.mark_all": "सब पढ़ें",
    "settings.language": "भाषा",
    "settings.language_desc": "इंटरफ़ेस बोली चुनें।",
    "settings.appearance": "दृश्य इंटरफ़ेस",
    "settings.security": "पहचान सुरक्षा",
    "settings.billing": "प्रीमियम लेजर",
    "settings.legal": "नेक्सस प्रोटोकॉल",
    "profile.displayname": "सार्वजनिक उपनाम",
    "profile.dob": "निर्माण की तिथि",
    "profile.bio": "पहचान विवरण",
    "profile.private": "निजी घोस्ट नोड",
    "profile.private_desc": "सार्वजनिक मैट्रिक्स के लिए अदृश्य",
    "logout.confirm": "न्यूरल लिंक काट दें?",
    "logout.switch": "अकाउंट नोड बदलें?",
    "logout.desc": "क्या आप डिस्कनेक्ट करना चाहते हैं या किसी अन्य पहचान पर स्विच करना चाहते हैं?",
    "logout.btn_logout": "लॉगआउट",
    "logout.btn_switch": "नोड बदलें"
  },
  ne: {
    "login.welcome": "स्वागत छ, अपरेटर।",
    "login.subtitle": "म्याट्रिक्ससँग आफ्नो न्यूरल लिंक पुनः स्थापना गर्नुहोस्।",
    "login.email": "पहिचान ह्यान्डल / ईमेल",
    "login.password": "पहुँच कुञ्जी",
    "login.submit": "लिंक सुरु गर्नुहोस्",
    "login.register": "नयाँ पहिचान?",
    "register.title": "नोड स्थापना गर्नुहोस्",
    "register.subtitle": "म्याट्रिक्समा नयाँ नोड सिर्जना गर्नुहोस्।",
    "register.handle": "पहिचान ह्यान्डल",
    "register.name": "सार्वजनिक नाम",
    "register.dob": "सिर्जनाको मिति",
    "register.continue": "जारी राख्नुहोस्",
    "register.abort": "रद्द गर्नुहोस्",
    "register.bio": "बायो-प्रसारण",
    "register.bio_placeholder": "आफ्नो नोड वर्णन गर्नुहोस्...",
    "register.enter": "म्याट्रिक्समा प्रवेश गर्नुहोस्",
    "nav.home": "गृह",
    "nav.explore": "अन्वेषण",
    "nav.social": "सामाजिक",
    "nav.profile": "प्रोफाइल हब",
    "nav.settings": "प्रणाली सेटिङहरू",
    "nav.logout": "विच्छेद गर्नुहोस्",
    "feed.broadcast": "म्याट्रिक्समा प्रसारण गर्नुहोस्...",
    "feed.share": "साझेदारी गर्नुहोस्",
    "feed.share_sector": "यस क्षेत्रमा साझा गर्नुहोस्...",
    "common.save": "अन्तिम रूप दिनुहोस्",
    "common.cancel": "रद्द गर्नुहोस्",
    "common.delete": "मेटाउनुहोस्",
    "common.edit": "सम्पादन गर्नुहोस्",
    "common.back": "फिर्ता",
    "help.title": "नेक्सस प्रोटोकल // म्यानुअल",
    "help.intro": "नेक्ससमा स्वागत छ। एक हाइब्रिड सामाजिक संरचना जसले संगठित क्षेत्रहरूलाई विश्वव्यापी म्याट्रिक्ससँग जोड्दछ।",
    "help.realms": "क्षेत्र र सेक्टरहरू",
    "help.realms_desc": "संगठित सञ्चारको लागि स्वतन्त्र सामुदायिक नोडहरू।",
    "help.matrix": "न्यूरल म्याट्रिक्स",
    "help.matrix_desc": "सामूहिक प्रसारणको लागि चेतनाको विश्वव्यापी प्रवाह।",
    "help.identity": "पहिचान सुरक्षा",
    "help.identity_desc": "इन्क्रिप्सन, गोपनीयता र नोड क्यालिब्रेसन व्यवस्थापन गर्नुहोस्।",
    "notifications.title": "न्यूरल पल्स",
    "notifications.empty": "कुनै अलर्टहरू बाँकी छैनन्",
    "notifications.mark_all": "सबै पढ्नुहोस्",
    "settings.language": "भाषा",
    "settings.language_desc": "इन्टरफेस बोली चयन गर्नुहोस्।",
    "settings.appearance": "दृश्य इन्टरफेस",
    "settings.security": "पहिचान सुरक्षा",
    "settings.billing": "प्रीमियम लेजर",
    "settings.legal": "नेक्सस प्रोटोकल",
    "profile.displayname": "सार्वजनिक उपनाम",
    "profile.dob": "सिर्जनाको मिति",
    "profile.bio": "पहिचान विवरण",
    "profile.private": "निजी घोस्ट नोड",
    "profile.private_desc": "सार्वजनिक म्याट्रिक्समा अदृश्य",
    "logout.confirm": "न्यूरल लिंक विच्छेद गर्ने?",
    "logout.switch": "अकाउन्ट नोड स्विच गर्ने?",
    "logout.desc": "के तपाईं विच्छेद गर्न चाहनुहुन्छ वा अर्को पहिचानमा स्विच गर्न चाहनुहुन्छ?",
    "logout.btn_logout": "लॉगआउट",
    "logout.btn_switch": "नोड स्विच"
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('nexus_lang') as Language;
    if (saved && translations[saved]) setLanguage(saved);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('nexus_lang', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};