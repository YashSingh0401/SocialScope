"""Entity types and taxonomy for SocialScope intelligence extraction."""

ENTITY_TYPES = {
    'ORGANIZATION': 'Official bodies, state institutions, defense forces, media, tech platforms',
    'LOCATION': 'Geographic locations, border zones, cities, provinces, districts',
    'PERSON': 'Identified leaders, officials, public figures, actor references',
    'INFRASTRUCTURE': 'Critical national infrastructure, telecommunications, power grid, transport',
    'SECURITY_THREAT': 'Cyber threats, attacks, sabotage, security alerts, weapon systems',
    'HASHTAG': 'Campaign and narrative coordination markers'
}

# Bilingual gazetteer / keyword dictionaries for English & Hindi/Devanagari
ORGANIZATION_KEYWORDS = {
    'ntro', 'cert-in', 'drdo', 'isro', 'indian army', 'iaf', 'navy', 'bsf', 'crpf',
    'police', 'ministry', 'parliament', 'government', 'rbi', 'intelligence bureau', 'raw',
    'twitter', 'telegram', 'reddit', 'youtube', 'whatsapp', 'facebook',
    'सरकार', 'पुलिस', 'सेना', 'मंत्रालय', 'खुफिया', 'इसरो', 'डीआरडीओ'
}

LOCATION_KEYWORDS = {
    'delhi', 'new delhi', 'mumbai', 'bengaluru', 'hyderabad', 'kolkata', 'chennai',
    'jammu', 'kashmir', 'srinagar', 'ladakh', 'punjab', 'assam', 'manipur', 'arunachal',
    'india', 'pakistan', 'china', 'tibet', 'bangladesh', 'myanmar',
    'दिल्ली', 'मुंबई', 'जम्मू', 'कश्मीर', 'लद्दाख', 'पंजाब', 'भारत', 'श्रीनगर'
}

INFRASTRUCTURE_KEYWORDS = {
    'power grid', 'grid', 'substation', 'transmission', 'nuclear plant', 'satellite',
    'refinery', 'pipeline', 'telecom', 'tower', 'fiber optic', 'airport', 'railway', 'station',
    'server', 'datacenter', 'gateway', 'switch',
    'पावर ग्रिड', 'ग्रिड', 'सबस्टेशन', 'बिजली', 'दूरसंचार', 'उपग्रह', 'हवाई अड्डा', 'रेलवे'
}

SECURITY_THREAT_KEYWORDS = {
    'blackout', 'breach', 'cyberattack', 'malware', 'ransomware', 'exploit', 'phishing',
    'ddos', 'sabotage', 'blast', 'explosion', 'leak', 'espionage', 'incursion', 'ambush',
    'threat', 'compromised', 'outage', 'alert', 'emergency', 'attack',
    'हमला', 'हैक', 'विस्फोट', 'ब्लाकआउट', 'धमाका', 'जासूसी', 'खतरा', 'सेंधमारी', 'साइबर हमला'
}
