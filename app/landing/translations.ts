/**
 * Landing-page translations. Keys are the page's English HTML (whitespace collapsed, exactly as the
 * browser serialises it), so the English copy in index.html stays the source of truth. Text that is
 * not listed here (brand names, numbers) is left as it is in every language.
 * If you edit English copy in index.html, update its key here.
 */
export type LandingLang = "english" | "hindi" | "hinglish";

export const TRANSLATIONS: Record<string, { hindi: string; hinglish: string }> = {
  "Skip to content": { hindi: "मुख्य सामग्री पर जाएँ", hinglish: "Seedha content par jaiye" },
  "The problem": { hindi: "समस्या", hinglish: "Samasya" },
  Solution: { hindi: "समाधान", hinglish: "Samadhan" },
  "Impact in India": { hindi: "भारत में असर", hinglish: "India mein asar" },
  "How to use": { hindi: "कैसे इस्तेमाल करें", hinglish: "Kaise use karein" },
  FAQ: { hindi: "सवाल-जवाब", hinglish: "Sawaal-jawab" },
  "Try it live": { hindi: "लाइव आज़माएँ", hinglish: "Live try karein" },
  '<span class="material-symbols-outlined" aria-hidden="true">record_voice_over</span> Voice billing for India\'s tradespeople':
    {
      hindi:
        '<span class="material-symbols-outlined" aria-hidden="true">record_voice_over</span> भारत के कारीगरों के लिए वॉइस बिलिंग',
      hinglish:
        '<span class="material-symbols-outlined" aria-hidden="true">record_voice_over</span> India ke karigaron ke liye voice billing',
    },
  'Speak the job.<br> <span class="accent">Get the bill. Get paid.</span>': {
    hindi: 'बोलकर बिल बनाइए।<br> <span class="accent">काम बताइए। पैसे पाइए।</span>',
    hinglish: 'Bol ke bill banaiye.<br> <span class="accent">Kaam boliye. Paisa paiye.</span>',
  },
  "An electrician, plumber or AC technician says one sentence in Hinglish, Hindi or English. KaamBill builds the itemized bill, checks the total with them, and shows a UPI QR the customer can scan, all without typing on a dusty screen.":
    {
      hindi:
        "इलेक्ट्रीशियन, प्लंबर या AC टेक्नीशियन हिंग्लिश, हिंदी या अंग्रेज़ी में बस एक वाक्य बोलते हैं। KaamBill आइटम-वार बिल बनाता है, कुल रकम उनसे पक्की करवाता है, और ग्राहक के स्कैन करने के लिए UPI QR दिखाता है, वो भी धूल भरी स्क्रीन पर टाइप किए बिना।",
      hinglish:
        "Electrician, plumber ya AC technician Hinglish, Hindi ya English mein bas ek line bolte hain. KaamBill item-wise bill banata hai, total unse confirm karwata hai, aur customer ke scan karne ke liye UPI QR dikhata hai, wo bhi dhool bhari screen par type kiye bina.",
    },
  'Try KaamBill live <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>':
    {
      hindi:
        'KaamBill लाइव आज़माएँ <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>',
      hinglish:
        'KaamBill live try karein <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>',
    },
  "See how it works": { hindi: "देखें कैसे काम करता है", hinglish: "Dekhiye kaise kaam karta hai" },
  '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span> Works on low-end Android phones':
    {
      hindi:
        '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span> कम कीमत वाले Android फ़ोन पर भी चलता है',
      hinglish:
        '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span> Sasta Android phone par bhi chalta hai',
    },
  '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span> No account or sign-up':
    {
      hindi:
        '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span> न अकाउंट, न साइन-अप',
      hinglish:
        '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span> Na account, na sign-up',
    },
  "“Verma ji's house, 2 Havells MCB, 15 meter Finolex wire and 500 labour, make the bill.”": {
    hindi: "“वर्मा जी के घर 2 Havells MCB, 15 मीटर Finolex wire, और 500 लेबर का बिल बना दो।”",
    hinglish:
      "“Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do.”",
  },
  "Worker speaks · about 15 seconds": {
    hindi: "कारीगर बोलता है · लगभग 15 सेकंड",
    hinglish: "Karigar bolta hai · lagbhag 15 second",
  },
  "Bill for Verma ji": { hindi: "वर्मा जी का बिल", hinglish: "Verma ji ka bill" },
  "Ready to send": { hindi: "भेजने के लिए तैयार", hinglish: "Bhejne ke liye ready" },
  Labour: { hindi: "मज़दूरी", hinglish: "Mazdoori" },
  Total: { hindi: "कुल", hinglish: "Total" },
  "Illustrative example. Prices come from the worker's own rate card.": {
    hindi: "यह एक उदाहरण है। कीमतें कारीगर के अपने रेट कार्ड से आती हैं।",
    hinglish: "Yeh ek example hai. Kimatein karigar ke apne rate card se aati hain.",
  },
  "≈ 7.3 crore": { hindi: "≈ 7.3 करोड़", hinglish: "≈ 7.3 crore" },
  "unincorporated non-farm enterprises in India": {
    hindi: "भारत में गैर-निगमित गैर-कृषि उद्यम",
    hinglish: "India mein unincorporated non-farm enterprises",
  },
  "≈ 12 crore": { hindi: "≈ 12 करोड़", hinglish: "≈ 12 crore" },
  "workers employed by those enterprises": {
    hindi: "इन उद्यमों में काम करने वाले कामगार",
    hinglish: "In enterprises mein kaam karne wale workers",
  },
  "of Indians speak English as a first, second or third language": {
    hindi: "भारतीय अंग्रेज़ी को पहली, दूसरी या तीसरी भाषा के रूप में बोलते हैं",
    hinglish: "Indians English ko first, second ya third language ke roop mein bolte hain",
  },
  "≈ 89 in 100": { hindi: "≈ 100 में 89", hinglish: "≈ 100 mein se 89" },
  "are left out of English-first software": {
    hindi: "अंग्रेज़ी-प्रधान सॉफ़्टवेयर से बाहर रह जाते हैं",
    hinglish: "English-first software se bahar reh jaate hain",
  },
  "Sources: NSO, ASUSE 2023-24 (MoSPI); Census of India 2011.": {
    hindi: "स्रोत: NSO, ASUSE 2023-24 (MoSPI); भारत की जनगणना 2011।",
    hinglish: "Source: NSO, ASUSE 2023-24 (MoSPI); Census of India 2011.",
  },
  "The pain point": { hindi: "असली समस्या", hinglish: "Asli samasya" },
  "Billing apps need a keyboard and English. Tradespeople have neither.": {
    hindi: "बिलिंग ऐप्स को कीबोर्ड और अंग्रेज़ी चाहिए। कारीगरों के पास दोनों नहीं होते।",
    hinglish: "Billing apps ko keyboard aur English chahiye. Karigaron ke paas dono nahi hote.",
  },
  "Solo electricians, plumbers, AC technicians and painters work alone. They run on Android and UPI, but apps like Tally, Zoho and Vyapar still ask for typing. So they quote a lump sum out loud, or scribble it on paper.":
    {
      hindi:
        "अकेले काम करने वाले इलेक्ट्रीशियन, प्लंबर, AC टेक्नीशियन और पेंटर Android और UPI चलाते हैं, पर Tally, Zoho और Vyapar जैसे ऐप अब भी टाइपिंग माँगते हैं। इसलिए वे एकमुश्त रकम ज़ुबानी बताते हैं, या काग़ज़ पर लिख लेते हैं।",
      hinglish:
        "Akele kaam karne wale electrician, plumber, AC technician aur painter Android aur UPI chalate hain, par Tally, Zoho aur Vyapar jaise apps ab bhi typing maangte hain. Isliye ve lump sum zubaani bata dete hain, ya kaagaz par likh lete hain.",
    },
  "No itemized quote": { hindi: "आइटम-वार कोटेशन नहीं", hinglish: "Item-wise quote nahi" },
  "Customers haggle because they can't see what each part cost.": {
    hindi: "ग्राहक मोलभाव करते हैं, क्योंकि उन्हें हर पुर्ज़े की कीमत दिखती नहीं।",
    hinglish: "Customer mol-bhaav karte hain, kyunki unhe har part ki keemat dikhti nahi.",
  },
  "Forgotten add-ons": { hindi: "छूट जाने वाले एड-ऑन", hinglish: "Chhoot jaane wale add-ons" },
  "Extra wire, fittings and visiting charges get left off the bill.": {
    hindi: "एक्स्ट्रा तार, फ़िटिंग और विज़िट चार्ज बिल से छूट जाते हैं।",
    hinglish: "Extra wire, fittings aur visiting charge bill se chhoot jaate hain.",
  },
  "Slow payments": { hindi: "देर से पेमेंट", hinglish: "Der se payment" },
  "No bill and no payment link means days of follow-up calls.": {
    hindi: "बिल और पेमेंट लिंक न हो तो वसूली में कई दिन फ़ॉलो-अप कॉल करने पड़ते हैं।",
    hinglish:
      "Bill aur payment link na ho to vasooli mein kai din follow-up call karne padte hain.",
  },
  "No financial record": { hindi: "कोई वित्तीय रिकॉर्ड नहीं", hinglish: "Koi financial record nahi" },
  "Without a record of income, credit such as MUDRA or PM SVANidhi is out of reach.": {
    hindi: "आमदनी का रिकॉर्ड न हो तो MUDRA या PM SVANidhi जैसा कर्ज़ पहुँच से बाहर रहता है।",
    hinglish:
      "Aamdani ka record na ho to MUDRA ya PM SVANidhi jaisa credit pahunch se bahar rehta hai.",
  },
  "Why existing tools don't work": {
    hindi: "मौजूदा टूल क्यों काम नहीं करते",
    hinglish: "Maujooda tools kyun kaam nahi karte",
  },
  "<b>Typing-heavy screens.</b> Dropdowns and forms don't suit busy hands.": {
    hindi: "<b>टाइपिंग वाली स्क्रीन।</b> ड्रॉपडाउन और फ़ॉर्म व्यस्त हाथों के लिए ठीक नहीं।",
    hinglish: "<b>Typing-heavy screens.</b> Dropdown aur forms busy haathon ke liye theek nahi.",
  },
  "<b>Mixed languages.</b> “dedh hazaar” and “do inch CPVC elbow” are slow to type.": {
    hindi: "<b>भाषा का मेल।</b> “dedh hazaar” और “do inch CPVC elbow” टाइप करना धीमा है।",
    hinglish: "<b>Mixed languages.</b> “dedh hazaar” aur “do inch CPVC elbow” type karna slow hai.",
  },
  "<b>Accounting jargon.</b> “SKU” and “ledger” mean nothing on site.": {
    hindi: "<b>अकाउंटिंग की भारी भाषा।</b> “SKU” और “ledger” काम की जगह पर बेमतलब हैं।",
    hinglish: "<b>Accounting jargon.</b> “SKU” aur “ledger” site par bematlab hain.",
  },
  "<b>A keyboard mic only transcribes.</b> Workers need software that understands the whole job.": {
    hindi: "<b>कीबोर्ड का माइक सिर्फ़ लिखता है।</b> कारीगरों को पूरा काम समझने वाला सॉफ़्टवेयर चाहिए।",
    hinglish:
      "<b>Keyboard ka mic sirf transcribe karta hai.</b> Karigaron ko poora kaam samajhne wala software chahiye.",
  },
  "The problem in one line": { hindi: "एक लाइन में समस्या", hinglish: "Samasya ek line mein" },
  "Solo tradespeople lose money, time and credibility because billing means typing in English-first apps.":
    {
      hindi:
        "अकेले कारीगर पैसा, समय और साख खोते हैं, क्योंकि बिलिंग के लिए अंग्रेज़ी-प्रधान ऐप्स में टाइप करना पड़ता है।",
      hinglish:
        "Solo karigar paisa, time aur saakh khote hain, kyunki billing ke liye English-first apps mein typing karni padti hai.",
    },
  "The solution": { hindi: "समाधान", hinglish: "Samadhan" },
  "Speak the job. Get a bill the customer trusts.": {
    hindi: "बोलिए काम। पाइए ऐसा बिल जिस पर ग्राहक भरोसा करे।",
    hinglish: "Boliye kaam. Paiye aisa bill jis par customer bharosa kare.",
  },
  "These workers already run their business by voice: calls and WhatsApp voice notes. KaamBill builds on that habit, and checks the amount before anything is sent.":
    {
      hindi:
        "ये कारीगर पहले से ही कॉल और WhatsApp वॉइस नोट से काम चलाते हैं। KaamBill इसी आदत पर बना है, और कुछ भी भेजने से पहले रकम जाँचता है।",
      hinglish:
        "Ye karigar pehle se hi calls aur WhatsApp voice notes se kaam chalate hain. KaamBill isi aadat par bana hai, aur kuch bhi bhejne se pehle raqam check karta hai.",
    },
  "Hands-free": { hindi: "हैंड्स-फ़्री", hinglish: "Hands-free" },
  "Tap the mic and describe the job. The screen is only for checking.": {
    hindi: "माइक दबाइए और काम बताइए। स्क्रीन सिर्फ़ जाँचने के लिए है।",
    hinglish: "Mic dabaiye aur kaam bataiye. Screen sirf check karne ke liye hai.",
  },
  "Understands how you talk": { hindi: "आपकी बोली समझता है", hinglish: "Aapki boli samajhta hai" },
  "Hinglish, Hindi or English, with brand names, units and number words.": {
    hindi: "हिंग्लिश, हिंदी या अंग्रेज़ी, ब्रांड के नाम, यूनिट और संख्या-शब्द सहित।",
    hinglish: "Hinglish, Hindi ya English, brand names, units aur number words ke saath.",
  },
  "Nothing sent unchecked": {
    hindi: "बिना जाँचे कुछ नहीं भेजा जाता",
    hinglish: "Bina check kiye kuch nahi jaata",
  },
  "KaamBill shows the total and sends nothing until you say “yes”.": {
    hindi: "KaamBill कुल रकम दिखाता है, और आपके “हाँ” कहने तक कुछ नहीं भेजता।",
    hinglish: "KaamBill total dikhata hai, aur aapke “haan” kehne tak kuch nahi bhejta.",
  },
  "Get paid on the spot": { hindi: "मौके पर ही पैसा पाइए", hinglish: "Mauke par hi paisa paiye" },
  "A UPI QR with the amount filled in. You confirm when the money arrives.": {
    hindi: "रकम भरा हुआ UPI QR। पैसे आने पर आप पुष्टि करते हैं।",
    hinglish: "Raqam bhara hua UPI QR. Paisa aane par aap confirm karte hain.",
  },
  "Impact in real-world India": { hindi: "असल भारत पर असर", hinglish: "Asli India par asar" },
  "Small bills, large effects on India's informal economy.": {
    hindi: "छोटे बिल, भारत की अनौपचारिक अर्थव्यवस्था पर बड़े असर।",
    hinglish: "Chhote bill, India ki informal economy par bade asar.",
  },
  "Most unincorporated businesses in India are run by one person who does all the billing. A proper bill, made easily, changes what they earn, collect and can prove.":
    {
      hindi:
        "भारत के ज़्यादातर गैर-निगमित कारोबार एक ही व्यक्ति चलाता है, जो सारी बिलिंग खुद करता है। सही बिल आसानी से बनाने से उसकी कमाई, वसूली और साबित करने की क्षमता बदलती है।",
      hinglish:
        "India ke zyadatar unincorporated business ek hi vyakti chalata hai, jo saari billing khud karta hai. Sahi bill aasaani se banane se uski kamai, vasooli aur saabit karne ki kshamta badalti hai.",
    },
  "More money earned": { hindi: "कमाई का ज़्यादा पैसा", hinglish: "Kamai ka zyada paisa" },
  "Itemizing as you speak catches the extra wire, fittings and visiting charges.": {
    hindi: "बोलते-बोलते आइटम जोड़ने से एक्स्ट्रा तार, फ़िटिंग और विज़िट चार्ज पकड़ में आते हैं।",
    hinglish:
      "Bolte-bolte item jodne se extra wire, fittings aur visiting charge pakad mein aate hain.",
  },
  "Faster collections": { hindi: "तेज़ वसूली", hinglish: "Tez vasooli" },
  "A UPI QR on the spot replaces days of follow-up calls.": {
    hindi: "मौके पर UPI QR फ़ॉलो-अप कॉल के दिनों की जगह लेता है।",
    hinglish: "Mauke par UPI QR follow-up call ke dinon ki jagah leta hai.",
  },
  "A step toward formal credit": {
    hindi: "औपचारिक कर्ज़ की ओर एक क़दम",
    hinglish: "Formal credit ki taraf ek kadam",
  },
  "Every bill is a record of income, a base for MUDRA and PM SVANidhi.": {
    hindi: "हर बिल आमदनी का रिकॉर्ड है, MUDRA और PM SVANidhi जैसी योजनाओं की नींव।",
    hinglish: "Har bill aamdani ka record hai, MUDRA aur PM SVANidhi jaisi yojnaon ki neenv.",
  },
  "Clarity for households": { hindi: "घरों के लिए साफ़गोई", hinglish: "Gharon ke liye saafgoi" },
  "Customers see what each part cost, so there's less haggling.": {
    hindi: "ग्राहक देखते हैं कि हर पुर्ज़े की कीमत क्या है, इसलिए मोलभाव कम होता है।",
    hinglish: "Customer dekhte hain ki har part ki keemat kya hai, isliye mol-bhaav kam hota hai.",
  },
  "Software in the user's language": {
    hindi: "यूज़र की भाषा में सॉफ़्टवेयर",
    hinglish: "User ki language mein software",
  },
  "About 89 in 100 Indians don't use English as a first, second or third language. Voice-first, mixed-language software reaches the people English-first apps leave out.":
    {
      hindi:
        "लगभग 100 में से 89 भारतीय अंग्रेज़ी को पहली, दूसरी या तीसरी भाषा के रूप में नहीं बोलते। आवाज़ से चलने वाला, मिली-जुली भाषा वाला सॉफ़्टवेयर उन लोगों तक पहुँचता है जिन्हें अंग्रेज़ी-प्रधान ऐप्स छोड़ देते हैं।",
      hinglish:
        "Lagbhag 100 mein se 89 Indians English ko first, second ya third language ke roop mein nahi bolte. Awaaz se chalne wala, mili-juli bhasha wala software un logon tak pahunchta hai jinhe English-first apps chhod dete hain.",
    },
  "How big is the opportunity?": {
    hindi: "कितना बड़ा मौक़ा है?",
    hinglish: "Opportunity kitni badi hai?",
  },
  Level: { hindi: "स्तर", hinglish: "Level" },
  Who: { hindi: "कौन", hinglish: "Kaun" },
  Size: { hindi: "आकार", hinglish: "Size" },
  Sector: { hindi: "सेक्टर", hinglish: "Sector" },
  "All unincorporated non-farm enterprises": {
    hindi: "भारत के सभी गैर-निगमित, गैर-कृषि उद्यम",
    hinglish: "Sabhi unincorporated non-farm enterprises",
  },
  "<b>≈ 7.3 crore</b> establishments, <b>≈ 12 crore</b> workers": {
    hindi: "<b>≈ 7.3 करोड़</b> प्रतिष्ठान, <b>≈ 12 करोड़</b> कामगार",
    hinglish: "<b>≈ 7.3 crore</b> establishments, <b>≈ 12 crore</b> workers",
  },
  "Addressable <em>(estimate)</em>": {
    hindi: "संभावित बाज़ार <em>(अनुमान)</em>",
    hinglish: "Addressable <em>(estimate)</em>",
  },
  "Repair, installation and trade services": {
    hindi: "मरम्मत, इंस्टॉलेशन और ट्रेड सेवाएँ",
    hinglish: "Repair, installation aur trade services",
  },
  "≈ 1–1.5 crore": { hindi: "≈ 1–1.5 करोड़", hinglish: "≈ 1–1.5 crore" },
  "First market <em>(estimate)</em>": {
    hindi: "पहला बाज़ार <em>(अनुमान)</em>",
    hinglish: "Pehla market <em>(estimate)</em>",
  },
  "Solo electricians, plumbers and AC technicians in Hindi-belt cities": {
    hindi: "हिंदी पट्टी के शहरों में अकेले इलेक्ट्रीशियन, प्लंबर और AC टेक्नीशियन",
    hinglish: "Hindi-belt shehron mein solo electrician, plumber aur AC technician",
  },
  "≈ 10–20 lakh": { hindi: "≈ 10–20 लाख", hinglish: "≈ 10–20 lakh" },
  "Sector figures: NSO, ASUSE 2023-24 (MoSPI). Addressable and first-market rows are our own estimates.":
    {
      hindi:
        "सेक्टर के आँकड़े: NSO, ASUSE 2023-24 (MoSPI)। संभावित बाज़ार और पहले बाज़ार वाली पंक्तियाँ हमारे अपने अनुमान हैं।",
      hinglish:
        "Sector ke figures: NSO, ASUSE 2023-24 (MoSPI). Addressable aur first-market rows hamare apne estimates hain.",
    },
  "What success looks like": { hindi: "सफलता कैसी दिखेगी", hinglish: "Safalta kaisi dikhegi" },
  "of active users create 5+ voice bills a week": {
    hindi: "सक्रिय यूज़र हर हफ़्ते 5+ वॉइस बिल बनाएँ",
    hinglish: "active users har hafte 5+ voice bills banayein",
  },
  "&lt; 25 s": { hindi: "&lt; 25 सेकंड", hinglish: "&lt; 25 s" },
  "from tapping the mic to the WhatsApp share": {
    hindi: "माइक दबाने से WhatsApp शेयर तक",
    hinglish: "mic dabane se WhatsApp share tak",
  },
  "first-pass accuracy on mixed-language items and spoken numbers": {
    hindi: "मिली-जुली भाषा के आइटम और बोले हुए नंबरों पर पहली बार में सही पहचान",
    hinglish: "mixed-language items aur bole hue numbers par first-pass accuracy",
  },
  "of bills paid through the UPI link within 24 hours": {
    hindi: "24 घंटे के भीतर UPI लिंक से चुकाए गए बिल",
    hinglish: "24 ghante ke andar UPI link se chukaye gaye bills",
  },
  "These are our product targets, not measured results.": {
    hindi: "ये हमारे प्रोडक्ट के लक्ष्य हैं, मापे गए नतीजे नहीं।",
    hinglish: "Ye hamare product targets hain, measured results nahi.",
  },
  "How to use KaamBill": { hindi: "KaamBill कैसे इस्तेमाल करें", hinglish: "KaamBill kaise use karein" },
  "From “job done” to “payment received” in five steps.": {
    hindi: "“काम पूरा” से “पेमेंट मिला” तक पाँच क़दमों में।",
    hinglish: "“Kaam pura” se “payment mila” tak paanch steps mein.",
  },
  "A step bar inside the app always shows where you are. First time? Set your name, UPI ID and rate card once. After that, every bill starts with your voice.":
    {
      hindi:
        "ऐप के अंदर का स्टेप बार हमेशा बताता है कि आप कहाँ हैं। पहली बार? अपना नाम, UPI ID और रेट कार्ड एक बार सेट करें। उसके बाद हर बिल आपकी आवाज़ से शुरू होता है।",
      hinglish:
        "App ke andar ka step bar hamesha batata hai ki aap kahan hain. Pehli baar? Apna naam, UPI ID aur rate card ek baar set karein. Uske baad har bill aapki awaaz se shuru hota hai.",
    },
  "See it in action": { hindi: "काम करते हुए देखें", hinglish: "Kaam karte hue dekhein" },
  "One sentence in, a ready-to-send bill out.": {
    hindi: "एक वाक्य अंदर, भेजने लायक बिल बाहर।",
    hinglish: "Ek sentence andar, bhejne layak bill bahar.",
  },
  "<b>Say or type the job.</b> “Verma ji's house, 2 Havells MCB, 15 meter Finolex wire and 500 labour, make the bill.”":
    {
      hindi:
        "<b>काम बोलिए या टाइप कीजिए।</b> “वर्मा जी के घर 2 Havells MCB, 15 मीटर Finolex wire, और 500 लेबर का बिल बना दो।”",
      hinglish:
        "<b>Kaam boliye ya type kijiye.</b> “Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do.”",
    },
  "<b>Check the items.</b> Prices come from your rate card; confirm the total with one tap.": {
    hindi: "<b>आइटम जाँचिए।</b> कीमतें आपके रेट कार्ड से आती हैं; एक टैप में कुल रकम पक्की कीजिए।",
    hinglish:
      "<b>Items check kijiye.</b> Kimatein aapke rate card se aati hain; ek tap mein total confirm kijiye.",
  },
  "<b>Pick how they pay.</b> UPI QR, cash or later, with the amount already filled in.": {
    hindi: "<b>पेमेंट का तरीक़ा चुनिए।</b> UPI QR, कैश या बाद में, रकम पहले से भरी हुई।",
    hinglish:
      "<b>Payment ka tareeka chuniye.</b> UPI QR, cash ya baad mein, raqam pehle se bhari hui.",
  },
  "<b>Send on WhatsApp.</b> A clean PDF bill with a UPI QR, sent when you press Send.": {
    hindi: "<b>WhatsApp पर भेजिए।</b> UPI QR वाला साफ़ PDF बिल, Send दबाते ही चला जाता है।",
    hinglish:
      "<b>WhatsApp par bhejiye.</b> UPI QR wala saaf PDF bill, Send dabate hi chala jaata hai.",
  },
  'Try it yourself <span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span>':
    {
      hindi:
        'खुद आज़माएँ <span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span>',
      hinglish:
        'Khud try karein <span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span>',
    },
  Items: { hindi: "सामान <small>आइटम</small>", hinglish: "Saaman <small>Items</small>" },
  "Tap the mic and describe the job, or tap <b>“Type it in”</b> to type or dictate with Wispr Flow.":
    {
      hindi: "माइक दबाकर काम बताइए, या <b>“लिख के डालें”</b> दबाकर Wispr Flow से टाइप या डिक्टेट कीजिए।",
      hinglish:
        "Mic dabakar kaam bataiye, ya <b>“Likh ke daalein”</b> dabakar Wispr Flow se type ya dictate kijiye.",
    },
  Check: { hindi: "जाँच <small>चेक</small>", hinglish: "Jaanch <small>Check</small>" },
  "Answer one question at a time (a missing price, an unsure quantity), then confirm the total with “yes”.":
    {
      hindi:
        "एक बार में एक सवाल का जवाब दीजिए (छूटी कीमत, अनिश्चित मात्रा), फिर “हाँ” कहकर कुल रकम पक्की कीजिए।",
      hinglish:
        "Ek baar mein ek sawaal ka jawab dijiye (chhooti keemat, unsure quantity), phir “haan” bol kar total confirm kijiye.",
    },
  Details: { hindi: "विवरण", hinglish: "Details" },
  "Check the amount and your UPI ID, add the customer's WhatsApp number, and pick UPI, Cash or Later (on credit).":
    {
      hindi:
        "रकम और अपनी UPI ID जाँचिए, ग्राहक का WhatsApp नंबर जोड़िए, और UPI, कैश या बाद में (उधार) चुनिए।",
      hinglish:
        "Amount aur apni UPI ID check kijiye, customer ka WhatsApp number jodiye, aur UPI, Cash ya Baad mein (udhaar) chuniye.",
    },
  Payment: { hindi: "पेमेंट", hinglish: "Payment" },
  "The customer scans the QR with the amount filled in. You tap <b>“Got the money”</b> (or “Yes, got the cash”).":
    {
      hindi: "ग्राहक रकम भरे हुए QR को स्कैन करता है। आप <b>“पैसा मिल गया”</b> (या “हाँ, कैश मिला”) दबाते हैं।",
      hinglish:
        "Customer raqam bhare hue QR ko scan karta hai. Aap <b>“Paisa mil gaya”</b> (ya “Haan, cash mila”) dabate hain.",
    },
  Invoice: { hindi: "बिल", hinglish: "Bill" },
  "The bill is marked <b>PAID</b> or <b>DUE</b>. WhatsApp opens with the PDF and you press Send.": {
    hindi:
      "बिल पर <b>PAID</b> या <b>DUE</b> का निशान लग जाता है। WhatsApp PDF के साथ खुलता है और आप Send दबाते हैं।",
    hinglish:
      "Bill par <b>PAID</b> ya <b>DUE</b> ka nishaan lag jaata hai. WhatsApp PDF ke saath khulta hai aur aap Send dabate hain.",
  },
  "Say it like you'd tell a friend": {
    hindi: "दोस्त को बताने की तरह बोलिए",
    hinglish: "Dost ko batane ki tarah boliye",
  },
  "Pauses are fine. KaamBill waits for you, or say “Stop” when you're done.": {
    hindi: "रुकना ठीक है। KaamBill आपका इंतज़ार करता है, या काम पूरा होने पर “रुकिए” कहिए।",
    hinglish:
      "Rukna theek hai. KaamBill aapka intezaar karta hai, ya kaam poora hone par “Ruk jaiye” boliye.",
  },
  "Verma ji's house, 2 Havells MCB, 15 meter Finolex wire and 500 labour, make the bill": {
    hindi: "वर्मा जी के घर 2 Havells MCB, 15 मीटर Finolex wire, और 500 लेबर का बिल बना दो",
    hinglish:
      "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
  },
  Copy: { hindi: "कॉपी", hinglish: "Copy" },
  "At Sharma ji's place, AC gas refill, fifteen hundred, and 300 visiting charge": {
    hindi: "शर्मा जी के यहाँ AC गैस रिफिल, डेढ़ हज़ार, और 300 विज़िटिंग चार्ज",
    hinglish: "Sharma ji ke yahan AC gas refill, dedh hazaar, aur 300 visiting charge",
  },
  "Gupta ji's house, 4 CPVC elbows at 40 rupees each, and 200 labour": {
    hindi: "गुप्ता जी के घर 4 CPVC एल्बो, 40 रुपये का एक, और 200 लेबर",
    hinglish: "Gupta ji ke ghar 4 CPVC elbow, 40 rupaye ka ek, aur 200 labour",
  },
  "Good to know": { hindi: "जानने लायक बातें", hinglish: "Jaanne layak baatein" },
  "Use <b>Chrome</b> and allow the microphone when asked.": {
    hindi: "<b>Chrome</b> इस्तेमाल कीजिए और पूछे जाने पर माइक की अनुमति दीजिए।",
    hinglish: "<b>Chrome</b> use kijiye aur poochhe jaane par microphone ki permission dijiye.",
  },
  "No mic, weak network or a noisy site? Tap <b>“Type it in”</b> and type or dictate with Wispr Flow.":
    {
      hindi:
        "माइक नहीं, नेटवर्क कमज़ोर या साइट पर शोर? <b>“लिख के डालें”</b> दबाइए और Wispr Flow से टाइप या डिक्टेट कीजिए।",
      hinglish:
        "Mic nahi, network kamzor ya site par shor? <b>“Likh ke daalein”</b> dabaiye aur Wispr Flow se type ya dictate kijiye.",
    },
  "Choose Hinglish, हिंदी or English from the top bar of the app.": {
    hindi: "ऐप के ऊपर वाले बार से हिंग्लिश, हिंदी या अंग्रेज़ी चुनिए।",
    hinglish: "App ke top bar se Hinglish, Hindi ya English chuniye.",
  },
  "Nothing is sent to your customer until you approve the total and press Send.": {
    hindi: "जब तक आप कुल रकम मंज़ूर करके Send नहीं दबाते, ग्राहक को कुछ नहीं भेजा जाता।",
    hinglish:
      "Jab tak aap total approve karke Send nahi dabate, customer ko kuch nahi bheja jaata.",
  },
  "The real KaamBill app, right here.": {
    hindi: "असली KaamBill ऐप, यहीं पर।",
    hinglish: "Asli KaamBill app, yahin par.",
  },
  "This is the full working app, not a mock-up. Finish the quick set-up, then speak or type a job and watch the bill appear.":
    {
      hindi:
        "यह पूरा चलने वाला ऐप है, कोई मॉक-अप नहीं। छोटा सा सेट-अप पूरा कीजिए, फिर कोई काम बोलिए या टाइप कीजिए और बिल बनता देखिए।",
      hinglish:
        "Yeh poora chalne wala app hai, koi mock-up nahi. Chhota sa set-up poora kijiye, phir koi kaam boliye ya type kijiye aur bill banta dekhiye.",
    },
  "Complete the 3-step set-up (your name, UPI ID, rate card).": {
    hindi: "3 स्टेप का सेट-अप पूरा कीजिए (आपका नाम, UPI ID, रेट कार्ड)।",
    hinglish: "3-step ka set-up poora kijiye (aapka naam, UPI ID, rate card).",
  },
  "Tap the mic, or tap “Type it in” and paste an example sentence.": {
    hindi: "माइक दबाइए, या “लिख के डालें” दबाकर कोई उदाहरण वाक्य पेस्ट कीजिए।",
    hinglish: "Mic dabaiye, ya “Likh ke daalein” dabakar koi example sentence paste kijiye.",
  },
  "Check the total, say “yes”, and continue to the UPI QR.": {
    hindi: "कुल रकम जाँचिए, “हाँ” कहिए, और UPI QR तक आगे बढ़िए।",
    hinglish: "Total check kijiye, “haan” boliye, aur UPI QR tak aage badhiye.",
  },
  'Open full screen <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>':
    {
      hindi:
        'फ़ुल स्क्रीन में खोलें <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>',
      hinglish:
        'Full screen mein kholein <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>',
    },
  "Designed for phone screens. For the best experience on a phone, open the app full screen.": {
    hindi: "फ़ोन की स्क्रीन के लिए बना है। फ़ोन पर बेहतर अनुभव के लिए ऐप को फ़ुल स्क्रीन में खोलें।",
    hinglish:
      "Phone ki screen ke liye bana hai. Phone par behtar experience ke liye app ko full screen mein kholein.",
  },
  Questions: { hindi: "सवाल", hinglish: "Sawaal" },
  "Frequently asked": {
    hindi: "अक्सर पूछे जाने वाले सवाल",
    hinglish: "Aksar poochhe jaane wale sawaal",
  },
  "Which languages does KaamBill understand?": {
    hindi: "KaamBill कौन सी भाषाएँ समझता है?",
    hinglish: "KaamBill kaun si languages samajhta hai?",
  },
  "Hinglish, Hindi and English, including mixing them in one sentence. The app language you pick changes the screen text, the mic language and the app's messages together.":
    {
      hindi:
        "हिंग्लिश, हिंदी और अंग्रेज़ी, एक ही वाक्य में मिलाकर भी। आप जो ऐप-भाषा चुनते हैं वह स्क्रीन का टेक्स्ट, माइक की भाषा और ऐप के संदेश, तीनों एक साथ बदल देती है।",
      hinglish:
        "Hinglish, Hindi aur English, ek hi sentence mein mix karke bhi. Aap jo app language chunte hain woh screen ka text, mic ki language aur app ke messages, teeno ek saath badal deti hai.",
    },
  "Is this a GST invoice?": { hindi: "क्या यह GST इनवॉइस है?", hinglish: "Kya yeh GST invoice hai?" },
  "No. KaamBill produces a simple Bill or Estimate, and labels it that way. GST invoice mode is on the roadmap.":
    {
      hindi:
        "नहीं। KaamBill सादा बिल या एस्टीमेट बनाता है, और उस पर वही लिखता है। GST इनवॉइस मोड आगे की योजना में है।",
      hinglish:
        "Nahi. KaamBill simple Bill ya Estimate banata hai, aur use waisa hi label karta hai. GST invoice mode roadmap par hai.",
    },
  "Can KaamBill see whether the customer has paid?": {
    hindi: "क्या KaamBill देख सकता है कि ग्राहक ने पेमेंट किया या नहीं?",
    hinglish: "Kya KaamBill dekh sakta hai ki customer ne payment kiya ya nahi?",
  },
  "Not yet. “Paid” is the worker's own confirmation after they see the payment. Automatic payment status from UPI is on the roadmap.":
    {
      hindi:
        "अभी नहीं। “Paid” कारीगर की अपनी पुष्टि है, जो वह पेमेंट देखने के बाद देता है। UPI से अपने-आप पेमेंट स्टेटस आगे की योजना में है।",
      hinglish:
        "Abhi nahi. “Paid” karigar ki apni confirmation hai, jo woh payment dekhne ke baad deta hai. UPI se automatic payment status roadmap par hai.",
    },
  "What if I say the wrong amount, or it mishears?": {
    hindi: "अगर मैं ग़लत रकम बोल दूँ, या वह ग़लत सुन ले तो?",
    hinglish: "Agar main galat amount bol dun, ya woh galat sun le toh?",
  },
  "Nothing reaches the customer until you've seen the total on screen and approved it. You can edit any item, quantity or price before then.":
    {
      hindi:
        "जब तक आप स्क्रीन पर कुल रकम देखकर मंज़ूर नहीं करते, ग्राहक तक कुछ नहीं पहुँचता। उससे पहले आप कोई भी आइटम, मात्रा या कीमत बदल सकते हैं।",
      hinglish:
        "Jab tak aap screen par total dekh kar approve nahi karte, customer tak kuch nahi pahunchta. Usse pehle aap koi bhi item, quantity ya price edit kar sakte hain.",
    },
  "Where is my customers' data stored?": {
    hindi: "मेरे ग्राहकों का डेटा कहाँ रखा जाता है?",
    hinglish: "Mere customers ka data kahan store hota hai?",
  },
  "Customer names and phone numbers are stored only on your device. The text of what you say is sent to an AI service to turn it into bill items.":
    {
      hindi:
        "ग्राहकों के नाम और फ़ोन नंबर सिर्फ़ आपके डिवाइस पर रखे जाते हैं। आप जो बोलते हैं उसका टेक्स्ट बिल के आइटम बनाने के लिए एक AI सेवा को भेजा जाता है।",
      hinglish:
        "Customers ke naam aur phone number sirf aapke device par store hote hain. Aap jo bolte hain uska text bill ke items banane ke liye ek AI service ko bheja jaata hai.",
    },
  "Does it work without a good network?": {
    hindi: "क्या अच्छे नेटवर्क के बिना भी यह चलता है?",
    hinglish: "Kya achhe network ke bina bhi yeh chalta hai?",
  },
  "The app loads offline, and you can finish and share a bill that's already been built. Understanding a new sentence needs a connection; if you're offline it's queued so you can retry.":
    {
      hindi:
        "ऐप ऑफ़लाइन भी खुलता है, और जो बिल बन चुका है उसे आप पूरा करके शेयर कर सकते हैं। नया वाक्य समझने के लिए कनेक्शन चाहिए; ऑफ़लाइन होने पर वह कतार में रखा जाता है ताकि आप दोबारा कोशिश कर सकें।",
      hinglish:
        "App offline bhi khulta hai, aur jo bill ban chuka hai use aap poora karke share kar sakte hain. Naya sentence samajhne ke liye connection chahiye; offline hone par woh queue mein rakha jaata hai taaki aap dobara try kar sakein.",
    },
  "Your next bill, in 15 seconds.": {
    hindi: "आपका अगला बिल, 15 सेकंड में।",
    hinglish: "Aapka agla bill, 15 second mein.",
  },
  "Say the job. Check the total. Get paid.": {
    hindi: "काम बोलिए। कुल रकम जाँचिए। पैसा पाइए।",
    hinglish: "Kaam boliye. Total check kijiye. Paisa paiye.",
  },
  'Try KaamBill now <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>':
    {
      hindi:
        'अभी KaamBill आज़माएँ <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>',
      hinglish:
        'Abhi KaamBill try karein <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>',
    },
  "Hands-free voice billing for India's electricians, plumbers, technicians and repair workers.": {
    hindi: "भारत के इलेक्ट्रीशियन, प्लंबर, टेक्नीशियन और मरम्मत कारीगरों के लिए हाथ फ़्री वॉइस बिलिंग।",
    hinglish:
      "India ke electrician, plumber, technician aur repair karigaron ke liye hands-free voice billing.",
  },
  "Built for <b>India Runs on Voice</b>, a Scaler × Wispr Flow hackathon · Small business track.": {
    hindi: "<b>India Runs on Voice</b> के लिए बना, एक Scaler × Wispr Flow हैकाथॉन · स्मॉल बिज़नेस ट्रैक।",
    hinglish:
      "<b>India Runs on Voice</b> ke liye bana, ek Scaler × Wispr Flow hackathon · Small business track.",
  },
  Explore: { hindi: "देखें", hinglish: "Explore" },
  App: { hindi: "ऐप", hinglish: "App" },
  "Open full screen": { hindi: "फ़ुल स्क्रीन में खोलें", hinglish: "Full screen mein kholein" },
  "All rights reserved.": { hindi: "सर्वाधिकार सुरक्षित।", hinglish: "Saare adhikar surakshit." },
  '<span class="material-symbols-outlined" aria-hidden="true">download</span> License (MIT)': {
    hindi: '<span class="material-symbols-outlined" aria-hidden="true">download</span> लाइसेंस (MIT)',
    hinglish:
      '<span class="material-symbols-outlined" aria-hidden="true">download</span> License (MIT)',
  },
};
