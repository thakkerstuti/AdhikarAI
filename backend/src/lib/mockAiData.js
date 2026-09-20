// Mock AI responses strictly conforming to Pranjal's schema in promptTemplate.js.
// Used for parallel backend development and local testing when USE_MOCK_AI=true.

export function getMockGroundedAnswer(question = "", lang = "en") {
  const isHindi = lang === "hi";
  const lowerQ = question.toLowerCase();

  // Scenario 1: Unpaid wages / salary
  if (lowerQ.includes("salary") || lowerQ.includes("wage") || lowerQ.includes("pay") || lowerQ.includes("वेतन") || lowerQ.includes("सैलरी")) {
    if (isHindi) {
      return {
        whatMayApply: "वेतन भुगतान अधिनियम, 1936 और मजदूरी संहिता, 2019 के अनुसार, नियोक्ता को वेतन अवधि समाप्त होने के 7 से 10 दिनों के भीतर देय वेतन का भुगतान करना अनिवार्य है। नियोक्ता बिना किसी कानूनी कारण के वेतन नहीं रोक सकता।",
        yourSituation: "आपके नियोक्ता ने बिना किसी स्पष्टीकरण के आपका देय वेतन रोक रखा है, जो श्रम कानूनों का उल्लंघन है।",
        nextSteps: [
          "नियोक्ता के एचआर और प्रबंधन को बकाया वेतन के तत्काल भुगतान के लिए एक औपचारिक लिखित नोटिस भेजें",
          "अपने रोजगार अनुबंध, उपस्थिति रिकॉर्ड और पिछले बैंक विवरण को प्रमाण के रूप में सुरक्षित रखें",
          "यदि 15 दिनों में भुगतान नहीं होता है, तो जिला श्रम आयुक्त (Labour Commissioner) कार्यालय में शिकायत दर्ज करें"
        ],
        documentsNeeded: [
          "नियुक्ति पत्र / रोजगार अनुबंध (Offer Letter / Contract)",
          "वेतन पर्ची (Salary Slips) और बैंक खाता विवरण",
          "बकाया वेतन की मांग करने वाले ईमेल या संदेशों की प्रतियां"
        ],
        source: {
          title: "वेतन भुगतान अधिनियम, 1936 - धारा 5 (वेतन के भुगतान का समय)",
          excerpt: "प्रत्येक व्यक्ति द्वारा नियोजित व्यक्तियों का वेतन वेतन अवधि के अंतिम दिन के बाद सातवें या दसवें दिन की समाप्ति से पहले भुगतान किया जाएगा।"
        },
        disclaimer: "यह सामान्य कानूनी जानकारी है, कानूनी सलाह नहीं। गंभीर या जरूरी मामलों के लिए किसी वकील से परामर्श लें।",
        lang: "hi",
      };
    }

    return {
      whatMayApply: "Under the Payment of Wages Act, 1936 and the Code on Wages, 2019, an employer is legally mandated to disburse wages within 7 to 10 days of the wage period ending. An employer cannot unlawfully withhold earned wages.",
      yourSituation: "Your employer has failed to disburse your salary for the period you worked, which constitutes a violation of statutory wage payment timelines.",
      nextSteps: [
        "Send a formal written demand letter to your employer requesting release of pending wages within 15 days",
        "Preserve your appointment letter, attendance logs, and past salary slips as evidence",
        "If unresolved, file a claim before the jurisdictional Labour Commissioner or submit a complaint on the Samadhan portal"
      ],
      documentsNeeded: [
        "Employment Agreement / Offer Letter",
        "Recent Salary Slips and Bank Account Statements",
        "Written communications/emails requesting unpaid salary"
      ],
      source: {
        title: "Payment of Wages Act, 1936 - Section 5 (Time of Payment of Wages)",
        excerpt: "The wages of every person employed shall be paid before the expiry of the seventh day or tenth day after the last day of the wage period."
      },
      disclaimer: "This is general legal information, not legal advice. For serious or urgent matters, consult a licensed advocate.",
      lang: "en",
    };
  }

  // Scenario 2: Consumer complaints / defective goods / refund
  if (lowerQ.includes("product") || lowerQ.includes("defective") || lowerQ.includes("refund") || lowerQ.includes("consumer") || lowerQ.includes("खराब") || lowerQ.includes("रिफंड")) {
    if (isHindi) {
      return {
        whatMayApply: "उपभोक्ता संरक्षण अधिनियम, 2019 के तहत, ग्राहकों को दोषपूर्ण वस्तुओं या घटिया सेवाओं के खिलाफ पूर्ण रिफंड या प्रतिस्थापन पाने का वैधानिक अधिकार है।",
        yourSituation: "विक्रेता ने आपको दोषपूर्ण सामान/सेवा प्रदान की है और अनुरोध के बावजूद रिफंड या समाधान देने से इनकार कर रहा है।",
        nextSteps: [
          "विक्रेता या ई-कॉमर्स प्लेटफॉर्म को शिकायत दर्ज करते हुए 15 दिनों का लीगल नोटिस भेजें",
          "राष्ट्रीय उपभोक्ता हेल्पलाइन (NCH) 1915 पर कॉल करें या ऑनलाइन शिकायत दर्ज करें",
          "समाधान न होने पर ई-दाखिल (e-Daakhil) पोर्टल के माध्यम से जिला उपभोक्ता आयोग में मामला दर्ज करें"
        ],
        documentsNeeded: [
          "खरीद बिल / चालान (Tax Invoice)",
          "उत्पाद दोष का फोटो या वीडियो प्रमाण",
          "कस्टमर केयर से हुई बातचीत या ईमेल रिकॉर्ड"
        ],
        source: {
          title: "उपभोक्ता संरक्षण अधिनियम, 2019 - धारा 2(47) (अनुचित व्यापार व्यवहार)",
          excerpt: "अनुचित व्यापार व्यवहार या दोषपूर्ण वस्तुओं की आपूर्ति के विरुद्ध उपभोक्ता को निवारण और क्षतिपूर्ति पाने का अधिकार प्राप्त है।"
        },
        disclaimer: "यह सामान्य कानूनी जानकारी है, कानूनी सलाह नहीं। गंभीर या जरूरी मामलों के लिए किसी वकील से परामर्श लें।",
        lang: "hi",
      };
    }

    return {
      whatMayApply: "Under the Consumer Protection Act, 2019, consumers are entitled to seek replacement, repair, or a full refund for defective goods and deficiency in services, along with compensation for unfair trade practices.",
      yourSituation: "You purchased a product or service that proved defective, and the seller or service provider has refused an adequate remedy or refund.",
      nextSteps: [
        "Send a formal written complaint / legal notice giving the seller 15 days to refund or replace",
        "Register an initial grievance on the National Consumer Helpline (NCH) portal or call 1915",
        "If unresolved, file a formal consumer complaint through the online e-Daakhil portal"
      ],
      documentsNeeded: [
        "Original Purchase Invoice / Receipt",
        "Photographic or video evidence showing the defect",
        "Written correspondence with customer support"
      ],
      source: {
        title: "Consumer Protection Act, 2019 - Section 35 (Manner in which complaint shall be made)",
        excerpt: "A consumer may file a complaint before the District Commission in relation to any goods sold or delivered or service provided."
      },
      disclaimer: "This is general legal information, not legal advice. For serious or urgent matters, consult a licensed advocate.",
      lang: "en",
    };
  }

  // Default Scenario: Tenancy / Security Deposit / General Rights
  if (isHindi) {
    return {
      whatMayApply: "मॉडल टेनेंसी एक्ट और संबंधित राज्य किराया नियंत्रण कानूनों के तहत, मकान मालिक को परिसर खाली करने के समय देय कटौती के बाद सुरक्षा जमा (सिक्योरिटी डिपॉज़िट) वापस करना अनिवार्य है। सामान्य टूट-फूट के नाम पर अनुचित कटौती नहीं की जा सकती।",
      yourSituation: "परिसर खाली करने और चाबियां सौंपने के बाद भी आपके मकान मालिक ने आपकी सुरक्षा जमा राशि वापस नहीं की है।",
      nextSteps: [
        "मकान मालिक को 15 दिनों के भीतर पूरी जमा राशि वापस करने की मांग का औपचारिक लिखित नोटिस भेजें",
        "किराया समझौता, बैंक ट्रांसफर रसीदें और घर सौंपने के समय की तस्वीरें साक्ष्य के रूप में रखें",
        "यदि राशि वापस नहीं की जाती, तो स्थानीय रेंट अथॉरिटी या उपभोक्ता फोरम में याचिका दायर करें"
      ],
      documentsNeeded: [
        "पंजीकृत अथवा हस्ताक्षरित किराया समझौता (Rent Agreement)",
        "सुरक्षा जमा भुगतान का बैंक प्रमाण या रसीद",
        "मकान खाली करने और चाबी सौंपने की लिखित सूचना / संदेश"
      ],
      source: {
        title: "मॉडल टेनेंसी एक्ट - धारा 13 (सुरक्षा जमा का नियमन)",
        excerpt: "परिसर का खाली कब्जा सौंपने की तारीख पर देय कटौती (यदि कोई हो) के बाद किरायेदार को सुरक्षा जमा वापस कर दिया जाएगा।"
      },
      disclaimer: "यह सामान्य कानूनी जानकारी है, कानूनी सलाह नहीं। गंभीर या जरूरी मामलों के लिए किसी वकील से परामर्श लें।",
      lang: "hi",
    };
  }

  return {
    whatMayApply: "Under the Model Tenancy Act and state tenancy regulations, a landlord is obligated to refund the security deposit upon vacating the premises, subject only to legitimate deductions for actual physical damage beyond ordinary wear and tear.",
    yourSituation: "You have vacated the rented accommodation and handed over possession, but your landlord has retained your deposit without legal justification.",
    nextSteps: [
      "Issue a formal written demand letter calling upon the landlord to refund the full deposit within 15 days",
      "Consolidate your lease agreement, bank transfer proofs, and move-out inspection documentation",
      "If the landlord defaults, file an application before the Rent Authority or District Consumer Commission"
    ],
    documentsNeeded: [
      "Signed Lease / Rental Agreement",
      "Bank statement showing payment of initial security deposit",
      "Written move-out confirmation or handover text/email"
    ],
    source: {
      title: "Model Tenancy Act - Section 13 (Security Deposit Regulations)",
      excerpt: "The security deposit shall be refunded to the tenant on the date of handing over vacant possession of the premises to the landlord, after making due deductions, if any."
    },
    disclaimer: "This is general legal information, not legal advice. For serious or urgent matters, consult a licensed advocate.",
    lang: "en",
  };
}

export function getMockDocumentExplain(extractedText = "", lang = "en") {
  const isHindi = lang === "hi";

  if (isHindi) {
    return {
      documentType: "आवासीय किराया समझौता (Residential Rental Agreement)",
      summary: "यह 11 महीने की अवधि के लिए एक मानक आवासीय किराया समझौता है। यह मकान मालिक और किरायेदार के बीच मासिक किराया, सुरक्षा जमा राशि और नोटिस अवधि की शर्तों को निर्धारित करता है।",
      keyInformation: [
        { label: "दस्तावेज़ प्रकार", value: "आवासीय लीज एवं लाइसेंस समझौता" },
        { label: "मासिक किराया", value: "₹22,000 प्रति माह" },
        { label: "सुरक्षा जमा (Security Deposit)", value: "₹66,000 (वापसी योग्य)" },
        { label: "अवधि", value: "11 महीने" },
        { label: "नोटिस अवधि", value: "1 माह का लिखित नोटिस" },
        { label: "लॉक-इन अवधि", value: "6 महीने" }
      ],
      flaggedClauses: [
        {
          clauseTitle: "सुरक्षा जमा की वापसी व कटौती",
          whatItSays: "मकान खाली करने के 30 दिनों के भीतर रंग-रोगन (Painting) और नुकसान की कटौती के बाद जमा राशि वापस की जाएगी।",
          inSimpleLanguage: "मकान मालिक सामान्य टूट-फूट पर भी पेंटिंग का खर्च आपकी जमा राशि से काट सकता है, जिसे स्पष्ट करना आवश्यक है।"
        },
        {
          clauseTitle: "समयपूर्व समापन और नोटिस",
          whatItSays: "दोनों पक्षों में से कोई भी 1 महीने का लिखित नोटिस देकर समझौता समाप्त कर सकता है।",
          inSimpleLanguage: "यदि आप बिना 30 दिन की पूर्व सूचना दिए मकान खाली करते हैं, तो एक महीने का किराया काटा जा सकता है।"
        }
      ],
      lang: "hi",
    };
  }

  return {
    documentType: "Residential Rental Agreement",
    summary: "This is an 11-month residential tenancy agreement establishing the rights, rent obligations, security deposit terms, and termination notice rules between the landlord and tenant.",
    keyInformation: [
      { label: "Document Type", value: "Residential Lease & License Agreement" },
      { label: "Monthly Rent", value: "₹22,000 per month" },
      { label: "Security Deposit", value: "₹66,000 (Refundable)" },
      { label: "Agreement Period", value: "11 Months" },
      { label: "Notice Period", value: "1 Month written notice" },
      { label: "Lock-in Period", value: "6 Months" }
    ],
    flaggedClauses: [
      {
        clauseTitle: "Security Deposit Deductions",
        whatItSays: "The security deposit shall be refunded within 30 days after deducting charges for repainting and damages.",
        inSimpleLanguage: "The landlord reserves the right to deduct painting fees; ensure move-out condition is photographed so wear-and-tear is not wrongly charged."
      },
      {
        clauseTitle: "Termination & Notice Period",
        whatItSays: "Either party may terminate this agreement by providing one calendar month written notice.",
        inSimpleLanguage: "You must provide a full 30 days written notice before leaving to ensure you receive your full deposit back without penalty."
      }
    ],
    lang: "en",
  };
}

export function getMockDocumentAsk(extractedText = "", question = "", lang = "en") {
  const isHindi = lang === "hi";

  if (isHindi) {
    return {
      whatMayApply: "दस्तावेज़ की शर्तों के अनुसार, किरायेदार और मकान मालिक दोनों के लिए 1 महीने (30 दिन) का लिखित नोटिस अनिवार्य है।",
      yourSituation: "आपके द्वारा अपलोड किए गए अनुबंध में नोटिस अवधि और सुरक्षा जमा की वापसी की शर्तें स्पष्ट रूप से उल्लिखित हैं।",
      nextSteps: [
        "मकान खाली करने की योजना से कम से कम 30 दिन पहले मकान मालिक को लिखित नोटिस दें",
        "नोटिस की पावती या ईमेल/व्हाट्सएप संदेश सुरक्षित रखें"
      ],
      documentsNeeded: [
        "हस्ताक्षरित किराया समझौता",
        "लिखित नोटिस की प्रति"
      ],
      source: {
        title: "अपलोड किया गया किराया समझौता",
        excerpt: "दोनों पक्षों में से कोई भी 1 महीने का लिखित नोटिस देकर समझौता समाप्त कर सकता है।"
      },
      disclaimer: "यह सामान्य कानूनी जानकारी है, कानूनी सलाह नहीं। गंभीर या जरूरी मामलों के लिए किसी वकील से परामर्श लें।",
      lang: "hi",
    };
  }

  return {
    whatMayApply: "According to the terms in the uploaded document, either party can terminate the tenancy by serving a 30-day (1 calendar month) advance written notice.",
    yourSituation: "Your question regarding the termination terms is governed by Clause 8 of your uploaded lease agreement.",
    nextSteps: [
      "Serve your written notice via email or registered message at least 30 days prior to your intended move-out date",
      "Request a joint inspection of the premises on the move-out date to confirm no damages"
    ],
    documentsNeeded: [
      "Uploaded Lease Agreement",
      "Written Notice Delivery Receipt"
    ],
    source: {
      title: "the uploaded document",
      excerpt: "Either party may terminate this agreement by providing one calendar month written notice in writing to the other party."
    },
    disclaimer: "This is general legal information, not legal advice. For serious or urgent matters, consult a licensed advocate.",
    lang: "en",
  };
}

export function getMockLetter(letterType = "security_deposit", lang = "en", details = {}) {
  const isHindi = lang === "hi";
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  if (letterType === "security_deposit") {
    const tenant = details.tenantName || "[Tenant Name]";
    const landlord = details.landlordName || "[Landlord Name]";
    const address = details.propertyAddress || "[Property Address]";
    const amount = details.depositAmount || "[Deposit Amount, e.g. Rs. 50,000]";
    const moveOutDate = details.moveOutDate || "[Move Out Date]";

    if (isHindi) {
      return `दिनांक: ${dateStr}

सेवा में,
${landlord}
पता: ${address}

विषय: सुरक्षा जमा राशि (Security Deposit) रुपये ${amount} की तत्काल वापसी हेतु औपचारिक नोटिस

महोदय/महोदया,

1. मैं, ${tenant}, आपके उपरोक्त परिसर (${address}) में किरायेदार के रूप में निवास कर रहा था।
2. मैंने दिनांक ${moveOutDate} को परिसर को शांतिपूर्वक, स्वच्छ स्थिति में और सभी चाबियां सौंपकर खाली कर दिया था।
3. किराया समझौते के अनुसार, मेरे द्वारा जमा की गई सुरक्षा राशि रुपये ${amount} मकान खाली करने पर वापसी योग्य है।
4. परिसर खाली किए जाने के बावजूद, उक्त जमा राशि मुझे अब तक वापस नहीं की गई है।

अतः आपसे सादर अनुरोध है कि इस नोटिस की प्राप्ति के 15 दिनों के भीतर मेरी सुरक्षा जमा राशि रुपये ${amount} मेरे बैंक खाते में अंतरित करने की कृपा करें।

यदि निर्धारित 15 दिनों की अवधि में उक्त राशि प्राप्त नहीं होती है, तो मैं बाध्य होकर उचित कानूनी मंच / रेंट अथॉरिटी के समक्ष शिकायत दर्ज करने के लिए स्वतंत्र होऊंगा।

सधन्यवाद,

भवदीय,
${tenant}
संपर्क: [फ़ोन नंबर / ईमेल]`;
    }

    return `Date: ${dateStr}

To,
${landlord}
Address: ${address}

SUBJECT: FORMAL NOTICE FOR REFUND OF SECURITY DEPOSIT OF RS. ${amount}

Dear ${landlord},

1. I, ${tenant}, was a tenant at your residential premises situated at ${address}, under our rental agreement.
2. I have duly vacated the premises and handed over vacant, peaceful possession along with all keys on ${moveOutDate}.
3. At the inception of the tenancy, I deposited a sum of Rs. ${amount} as a refundable security deposit.
4. As on date, the premises have been handed over in good and tenantable condition, and no rent arrears or utility dues remain outstanding.
5. In accordance with applicable tenancy laws and our agreement, the security deposit was due to be refunded upon handover, but remains unpaid to date.

I hereby formally call upon you to refund the full security deposit amount of Rs. ${amount} to my bank account within fifteen (15) calendar days from the receipt of this notice.

Should you fail to remit the amount within the stipulated timeframe of 15 days, I shall be compelled to initiate appropriate legal proceedings before the competent Rent Authority / Consumer Commission at your sole risk and cost.

Thank you.

Yours sincerely,

${tenant}
Contact: [Phone / Email]`;
  }

  if (letterType === "unpaid_wages") {
    const employee = details.employeeName || "[Employee Name]";
    const employer = details.employerName || "[Employer/Company Name]";
    const address = details.companyAddress || "[Company Address]";
    const period = details.periodOwed || "[Period Owed, e.g. July - August 2024]";
    const amount = details.amountOwed || "[Amount Owed, e.g. Rs. 75,000]";

    return `Date: ${dateStr}

To,
${employer}
Address: ${address}

SUBJECT: FORMAL DEMAND NOTICE FOR PAYMENT OF OUTSTANDING WAGES (RS. ${amount})

Dear Sir/Madam,

1. I, ${employee}, was employed with ${employer} and have diligently performed my duties.
2. An aggregate amount of Rs. ${amount} remains due and payable towards my salary for the period: ${period}.
3. Under the Payment of Wages Act, 1936 and applicable statutory labor standards, wages must be disbursed without undue delay.
4. Despite repeated follow-ups, my earned salary has not been credited.

I hereby call upon you to disburse the pending salary of Rs. ${amount} to my registered bank account within fifteen (15) days of this notice.

Failing this, I reserve the right to approach the jurisdictional Labour Commissioner's office and adopt appropriate statutory remedies.

Yours sincerely,

${employee}`;
  }

  // Consumer complaint
  const customer = details.customerName || "[Customer Name]";
  const seller = details.sellerName || "[Seller / Company Name]";
  const product = details.productOrService || "[Product or Service]";
  const date = details.purchaseDate || "[Purchase Date]";
  const issue = details.issueDescription || "[Description of the defect or service deficiency]";
  const resolution = details.resolutionRequested || "Full refund of the purchase amount";

  return `Date: ${dateStr}

To,
${seller}

SUBJECT: NOTICE UNDER CONSUMER PROTECTION ACT, 2019 CONCERNING DEFECTIVE ${product.toUpperCase()}

Dear Sir/Madam,

1. I, ${customer}, purchased ${product} from your company/store on ${date}.
2. Upon receipt/use, the following grievance was encountered: ${issue}.
3. Despite reporting this deficiency, no satisfactory rectification has been provided.

In terms of the Consumer Protection Act, 2019, you are requested to provide ${resolution} within fifteen (15) days from the receipt of this notice.

If this matter is not resolved amicably within 15 days, I shall be constrained to lodge a formal complaint before the District Consumer Disputes Redressal Commission.

Yours sincerely,

${customer}`;
}
