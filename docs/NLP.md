# NLP checkpoint 0.4

Language detection uses langid 1.1.6 with normalized scores and a 0.8 acceptance
threshold. Fewer than ten alphabetic characters or uncertain detection produces
`und`. Source-provided language is preserved separately. Scores are not calibrated
probabilities of correctness. Hindi/English code mixing and transliteration are
not reliably supported.

Sentiment uses the CPU INT8 ONNX conversion of CardiffNLP XLM-T, pinned at
`3112e85dea04f0019bf01282916588e3c9dd9bc8`. The pipeline handles Arabic, English,
French, German, Hindi, Italian, Spanish and Portuguese; other/undetected languages
produce unavailable sentiment, never a fabricated neutral result. URLs and mentions
are normalized. Inputs are truncated at 256 tokens and flagged in results.

Sources:
- https://github.com/saffsd/langid.py
- https://huggingface.co/cardiffnlp/twitter-xlm-roberta-base-sentiment
- https://huggingface.co/onnx-community/twitter-xlm-roberta-base-sentiment-ONNX

The conversion is third-party; numerical equivalence to the original model has
not been measured. Downloaded weights are not redistributed in this repository.
Consult upstream terms before deployment.

## Verification

`docs/experiments/nlp_smoke_results.json` records 12 authored synthetic English and
Hindi examples. Eleven received the expected language and sentiment; one Hindi
positive example was uncertain and abstained. This is a smoke check, not a held-out
accuracy benchmark. The confusion matrix includes an unavailable prediction column;
macro-F1 includes abstention as a false negative. Scores do not establish real-world
accuracy. Sarcasm, dialects, Hinglish, adversarial inputs and domain shift remain
unevaluated. Independent labelled data and calibration are required before making
accuracy claims.

The database integration tests check persistence, idempotency, rollback, metadata
preservation, pending counts and real inference when model files are installed.
No authentication is implemented; the server binds to loopback for development.
