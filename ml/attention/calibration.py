"""Attention Score calibration and dynamic threshold adjustments."""


class AttentionCalibrator:
    """Calibrates attention weights and maps continuous attention scores (0-100) to threat tiers."""

    DEFAULT_THRESHOLDS = {
        'CRITICAL': 75.0,
        'HIGH': 50.0,
        'MEDIUM': 25.0,
        'LOW': 0.0
    }

    def __init__(self, thresholds: dict = None):
        self.thresholds = thresholds or self.DEFAULT_THRESHOLDS

    def get_threat_level(self, score: float) -> str:
        """Maps a 0-100 score into a discrete threat severity tier."""
        if score >= self.thresholds['CRITICAL']:
            return 'CRITICAL'
        elif score >= self.thresholds['HIGH']:
            return 'HIGH'
        elif score >= self.thresholds['MEDIUM']:
            return 'MEDIUM'
        return 'LOW'

    def calibrate_weights(self, validation_samples: list[dict]) -> dict:
        """Evaluates alignment between multi-signal scores and analyst severity annotations."""
        if not validation_samples:
            return {'status': 'insufficient_samples', 'calibrated': False}

        agreements = 0
        for sample in validation_samples:
            assigned = self.get_threat_level(sample.get('attention_score', 0))
            if assigned == sample.get('expected_severity'):
                agreements += 1

        accuracy = agreements / len(validation_samples)
        return {
            'calibrated': True,
            'validation_count': len(validation_samples),
            'severity_agreement_rate': round(accuracy, 3),
            'thresholds_in_use': self.thresholds
        }
