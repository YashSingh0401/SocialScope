"""Emotion and Stance classification labels and multilingual lexicons."""

EMOTION_LABELS = ['anger', 'fear', 'joy', 'sadness', 'surprise', 'neutral']

STANCE_LABELS = ['support', 'oppose', 'neutral']

# High-precision bilingual seed lexicon for affective signals
EMOTION_LEXICON = {
    'anger': {
        'angry', 'furious', 'rage', 'boycott', 'scandal', 'corrupt', 'disgrace', 'outrage',
        'hate', 'shameful', 'liar', 'treason', 'betrayal',
        'गुस्सा', 'नाराज़', 'बहिष्कार', 'धोखा', 'शर्मनाक', 'भ्रष्ट', 'घोटाला', 'क्रोध'
    },
    'fear': {
        'panic', 'terrified', 'danger', 'threat', 'collapse', 'alert', 'crisis', 'breach',
        'unsafe', 'dread', 'warning', 'emergency', 'blackout',
        'डर', 'खतरा', 'आतंक', 'आपातकाल', 'तबाही', 'असुरक्षित', 'संकट', 'दहशत'
    },
    'joy': {
        'happy', 'proud', 'wonderful', 'excellent', 'victory', 'congratulations', 'celebrate',
        'love', 'success', 'bravo', 'splendid',
        'खुशी', 'गर्व', 'बधाई', 'सफल', 'जीत', 'शानदार', 'उत्साह', 'सुंदर'
    },
    'sadness': {
        'sad', 'tragedy', 'mourning', 'grief', 'heartbroken', 'loss', 'condolences', 'shattered',
        'दुख', 'शोक', 'निराशा', 'मातम', 'आंसू', 'पीड़ा'
    },
    'surprise': {
        'shocking', 'unbelievable', 'unprecedented', 'unexpected', 'astonishing', 'stunned',
        'हैरान', 'स्तब्ध', 'अविश्वसनीय', 'अचानक'
    }
}
