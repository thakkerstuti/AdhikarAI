export type Language = "en" | "hi" | "hi-en" | "gu";

export interface TranslationSchema {
  next: string;
  skip: string;
  getStarted: string;
  back: string;
  continue: string;
  step1Of2: string;
  step2Of2: string;
  chooseLanguage: string;
  chooseLanguageDesc: string;

  // Slide 1
  slide1TitleLine1: string;
  slide1TitleLine2: string;
  slide1Subtitle: string;

  // Slide 2
  slide2Title: string;
  slide2Subtitle: string;
  slide2Bubble1: string;
  slide2Bubble2: string;
  slide2Bubble3: string;

  // Slide 3
  slide3TitleLine1: string;
  slide3TitleLine2: string;
  slide3Subtitle: string;
  slide3CardOfficial: string;
  slide3CardInfo: string;
  slide3CardSituation: string;
  slide3CardUnderstood: string;
  slide3CardNextSteps: string;
  slide3CardStep1: string;
  slide3CardStep2: string;
  slide3CardStep3: string;

  // Slide 4
  slide4Title: string;
  slide4Subtitle: string;
  area1Title: string;
  area1Desc: string;
  area2Title: string;
  area2Desc: string;
  area3Title: string;
  area3Desc: string;
  area4Title: string;
  area4Desc: string;
  area5Title: string;
  area5Desc: string;

  // Auth Choice
  authTitle: string;
  authSubtitle: string;
  createAccount: string;
  signIn: string;
  continueAsGuest: string;
  alreadyHaveAccount: string;
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  en: {
    next: "Next",
    skip: "Skip",
    getStarted: "Get Started",
    back: "Back",
    continue: "Continue",
    step1Of2: "Step 1 of 2",
    step2Of2: "Step 2 of 2",
    chooseLanguage: "Choose your language",
    chooseLanguageDesc:
      "Select the language you'd like to use with Adhikar AI. You can change this anytime in settings.",

    slide1TitleLine1: "Know Your Rights.",
    slide1TitleLine2: "Know Your Next Step.",
    slide1Subtitle:
      "Your personal legal companion for everyday situations, explained in a language you understand.",

    slide2Title: "Speak. Don't Struggle.",
    slide2Subtitle:
      "Describe what happened naturally. We'll help you understand what it means and what you can do next.",
    slide2Bubble1: '"My landlord hasn\'t returned my deposit."',
    slide2Bubble2: '"मुझे कानूनी सहायता चाहिए"',
    slide2Bubble3: '"What are my rights?"',

    slide3TitleLine1: "Legal Information,",
    slide3TitleLine2: "Made Simple.",
    slide3Subtitle:
      "Understand your rights, next steps, and important documents using information from verified legal sources.",
    slide3CardOfficial: "Official Sources",
    slide3CardInfo: "Legal Info",
    slide3CardSituation: "YOUR SITUATION",
    slide3CardUnderstood: "What we understood",
    slide3CardNextSteps: "NEXT STEPS",
    slide3CardStep1: "1. Collect your documents",
    slide3CardStep2: "2. Check your agreement",
    slide3CardStep3: "3. Follow complaint process",

    slide4Title: "Help When You Need It.",
    slide4Subtitle: "Get clear legal information across five everyday areas.",
    area1Title: "Police & Criminal Procedure",
    area1Desc: "Questioning & FIR guidance",
    area2Title: "Tenant–Landlord",
    area2Desc: "Deposits, agreements & eviction",
    area3Title: "Employment",
    area3Desc: "Unpaid wages & contracts",
    area4Title: "Consumer Rights",
    area4Desc: "Refunds, defective items & fraud",
    area5Title: "Women & Personal Safety",
    area5Desc: "Protection & emergency aid",

    authTitle: "Your legal rights, in your pocket",
    authSubtitle:
      "Get instant legal guidance in your language. Create an account to save cases and track your progress.",
    createAccount: "Create Account",
    signIn: "Sign In",
    continueAsGuest: "Continue as Guest",
    alreadyHaveAccount: "Already have an account?",
  },
  hi: {
    next: "आगे बढ़ें",
    skip: "छोड़ें",
    getStarted: "शुरू करें",
    back: "पीछे जाएं",
    continue: "आगे बढ़ें",
    step1Of2: "चरण 1 ऑफ 2",
    step2Of2: "चरण 2 ऑफ 2",
    chooseLanguage: "अपनी भाषा चुनें",
    chooseLanguageDesc:
      "Adhikar AI का उपयोग करने के लिए अपनी पसंदीदा भाषा चुनें। इसे आप कभी भी बदल सकते हैं।",

    slide1TitleLine1: "अपने अधिकार जानें।",
    slide1TitleLine2: "सही कदम उठाएं।",
    slide1Subtitle:
      "आपकी रोजमर्रा की कानूनी समस्याओं के लिए आपका व्यक्तिगत सहायक, आपकी अपनी भाषा में।",

    slide2Title: "बोलकर अपनी बात कहें।",
    slide2Subtitle:
      "अपनी समस्या आसान शब्दों में बताएं। हम आपको आसान भाषा में कानूनी समाधान समझाएंगे।",
    slide2Bubble1: '"मकान मालिक डिपॉजिट वापस नहीं कर रहा है।"',
    slide2Bubble2: '"मुझे कानूनी सहायता चाहिए"',
    slide2Bubble3: '"मेरे क्या अधिकार हैं?"',

    slide3TitleLine1: "कानूनी जानकारी,",
    slide3TitleLine2: "बिल्कुल सरल भाषा में।",
    slide3Subtitle:
      "प्रमाणित कानूनी स्रोतों से अपने अधिकार, अगले कदम और आवश्यक दस्तावेज समझें।",
    slide3CardOfficial: "सरकारी स्रोत",
    slide3CardInfo: "कानूनी जानकारी",
    slide3CardSituation: "आपकी स्थिति",
    slide3CardUnderstood: "जो हमने समझा",
    slide3CardNextSteps: "अगले कदम",
    slide3CardStep1: "1. अपने दस्तावेज एकत्र करें",
    slide3CardStep2: "2. एग्रीमेंट की जांच करें",
    slide3CardStep3: "3. शिकायत प्रक्रिया अपनाएं",

    slide4Title: "जब जरूरत हो, तुरंत मदद।",
    slide4Subtitle:
      "इन 5 मुख्य क्षेत्रों में स्पष्ट कानूनी जानकारी प्राप्त करें।",
    area1Title: "पुलिस और आपराधिक प्रक्रिया",
    area1Desc: "पूछताछ और FIR संबंधी मार्गदर्शन",
    area2Title: "किरायेदार और मकान मालिक",
    area2Desc: "डिपॉजिट, एग्रीमेंट और बेदखली",
    area3Title: "रोजगार और नौकरी",
    area3Desc: "बकाया वेतन और कॉन्ट्रैक्ट",
    area4Title: "उपभोक्ता अधिकार",
    area4Desc: "रिफंड, खराब सामान और धोखाधड़ी",
    area5Title: "महिला सुरक्षा और अधिकार",
    area5Desc: "सुरक्षा और आपातकालीन कानूनी सहायता",

    authTitle: "आपके कानूनी अधिकार, अब आपके हाथ में",
    authSubtitle:
      "अपनी भाषा में तुरंत कानूनी मार्गदर्शन पाएं। केस सुरक्षित रखने के लिए अकाउंट बनाएं।",
    createAccount: "अकाउंट बनाएं",
    signIn: "साइन इन करें",
    continueAsGuest: "गेस्ट के रूप में जारी रखें",
    alreadyHaveAccount: "क्या आपके पास पहले से अकाउंट है?",
  },
  "hi-en": {
    next: "Next",
    skip: "Skip",
    getStarted: "Get Started",
    back: "Back",
    continue: "Continue",
    step1Of2: "Step 1 of 2",
    step2Of2: "Step 2 of 2",
    chooseLanguage: "Apni bhasha chunein",
    chooseLanguageDesc:
      "Adhikar AI use karne ke liye apni language chunein. Isse aap kabhi bhi change kar sakte hain.",

    slide1TitleLine1: "Apne Rights Jaanein.",
    slide1TitleLine2: "Sahi Step Uthayein.",
    slide1Subtitle:
      "Aapka personal legal companion jo har situation mein aapko easy language mein guide karega.",

    slide2Title: "Bolein, tension na lein.",
    slide2Subtitle:
      "Apni problem naturally bataayein. Hum aapko simple Hinglish mein aapke rights samjhayenge.",
    slide2Bubble1: '"Landlord deposit return nahi kar raha."',
    slide2Bubble2: '"Mujhe legal help chahiye"',
    slide2Bubble3: '"Mere kya rights hain?"',

    slide3TitleLine1: "Legal Information,",
    slide3TitleLine2: "Ekdam Simple.",
    slide3Subtitle:
      "Verified legal sources se apne rights, next steps aur zaroori documents samjhein.",
    slide3CardOfficial: "Verified Sources",
    slide3CardInfo: "Legal Info",
    slide3CardSituation: "YOUR SITUATION",
    slide3CardUnderstood: "Jo humne samjha",
    slide3CardNextSteps: "NEXT STEPS",
    slide3CardStep1: "1. Apne documents collect karein",
    slide3CardStep2: "2. Agreement check karein",
    slide3CardStep3: "3. Complaint process follow karein",

    slide4Title: "Jab zaroorat ho, instant help.",
    slide4Subtitle: "In 5 main areas mein clear legal guidance paayein.",
    area1Title: "Police & FIR Procedure",
    area1Desc: "Questioning & FIR ki puri jankari",
    area2Title: "Tenant & Landlord",
    area2Desc: "Deposit, rent agreement & eviction",
    area3Title: "Job & Employment",
    area3Desc: "Unpaid salary & contract issues",
    area4Title: "Consumer Rights",
    area4Desc: "Refund, defective product & fraud",
    area5Title: "Women & Safety Rights",
    area5Desc: "Protection & emergency legal aid",

    authTitle: "Aapke legal rights, aapke pocket mein",
    authSubtitle:
      "Apni language mein instant legal help paayein. Cases save karne ke liye account banayein.",
    createAccount: "Create Account",
    signIn: "Sign In",
    continueAsGuest: "Continue as Guest",
    alreadyHaveAccount: "Pehle se account hai?",
  },
  gu: {
    next: "આગળ વધો",
    skip: "રદ કરો",
    getStarted: "શરૂ કરો",
    back: "પાછા જાઓ",
    continue: "આગળ વધો",
    step1Of2: "પગલું 1 / 2",
    step2Of2: "પગલું 2 / 2",
    chooseLanguage: "તમારી ભાષા પસંદ કરો",
    chooseLanguageDesc:
      "Adhikar AI માટે તમારી પ્રિય ભાષા પસંદ કરો. તમે આ પછીથી સેટિંગ્સમાં બદલી શકો છો.",

    slide1TitleLine1: "તમારા અધિકારો જાણો.",
    slide1TitleLine2: "યોગ્ય દાવ પેચ પસંદ કરો.",
    slide1Subtitle:
      "તમારી રોજિંદી કાનૂની પરિસ્થિતિઓ માટે તમારી પોતાની ભાષામાં વ્યક્તિગત સહાયક.",

    slide2Title: "બોલો. મુશ્કેલી ના અનુભવો.",
    slide2Subtitle:
      "તમારી પરિસ્થિતિ સહજ રીતે કહો. અમે તમને સરળ કાનૂની માર્ગદર્શન આપીશું.",
    slide2Bubble1: '"મકાનમાલિક ડિપોઝિટ પરત આપતો નથી."',
    slide2Bubble2: '"મને કાનૂની મદદ જોઈએ છે"',
    slide2Bubble3: '"મારા શું અધિકારો છે?"',

    slide3TitleLine1: "કાનૂની માહિતી,",
    slide3TitleLine2: "એકદમ સરળ ભાષામાં.",
    slide3Subtitle:
      "સરકારી કાનૂની સ્ત્રોતોમાંથી તમારા અધિકારો, આગળના પગલાં અને મહત્વના દસ્તાવેજો સમજો.",
    slide3CardOfficial: "સત્તાવાર સ્ત્રોત",
    slide3CardInfo: "કાનૂની માહિતી",
    slide3CardSituation: "તમારી પરિસ્થિતિ",
    slide3CardUnderstood: "જે અમે સમજ્યા",
    slide3CardNextSteps: "આગળના પગલાં",
    slide3CardStep1: "1. દસ્તાવેજો એકત્ર કરો",
    slide3CardStep2: "2. કરારની તપાસ કરો",
    slide3CardStep3: "3. ફરિયાદ પ્રક્રિયા અનુસરો",

    slide4Title: "જ્યારે જરૂર હોય ત્યારે મદદ.",
    slide4Subtitle: "મુખ્ય 5 ક્ષેત્રોમાં સ્પષ્ટ કાનૂની માહિતી મેળવો.",
    area1Title: "પોલીસ અને ગુનાહિત પ્રક્રિયા",
    area1Desc: "પૂછપરછ અને FIR સંબંધી માર્ગદર્શન",
    area2Title: "ભાડૂઆત અને મકાનમાલિક",
    area2Desc: "ડિપોઝિટ, કરાર અને ખાલી કરાવવું",
    area3Title: "રોજગાર અને નોકરી",
    area3Desc: "બિનચૂકવેલ પગાર અને કરાર",
    area4Title: "ગ્રાહક અધિકારો",
    area4Desc: "રીફંડ, ખામીયુક્ત વસ્તુઓ અને છેતરપિંડી",
    area5Title: "મહિલા સુરક્ષા અને અધિકારો",
    area5Desc: "સુરક્ષા અને કટોકટીની કાનૂની મદદ",

    authTitle: "તમારા કાનૂની અધિકારો, તમારા ખિસ્સામાં",
    authSubtitle: "તમારી પોતાની ભાષામાં તાત્કાલિક કાનૂની માર્ગદર્શન મેળવો.",
    createAccount: "એકાઉન્ટ બનાવો",
    signIn: "સાઇન ઇન કરો",
    continueAsGuest: "ગેસ્ટ તરીકે આગળ વધો",
    alreadyHaveAccount: "પહેલેથી એકાઉન્ટ છે?",
  },
};

export function getTranslation(lang: Language): TranslationSchema {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
