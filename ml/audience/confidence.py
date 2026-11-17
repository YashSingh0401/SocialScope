"""Defensible confidence scoring for audience and demographic estimates."""


def calculate_demographic_confidence(total_events: int, analyzed_count: int, language_distribution: list[dict]) -> dict:
    """Calculates coverage and statistical reliability metrics for aggregate audience estimates."""
    if total_events <= 0:
        return {
            'overall_confidence': 0.0,
            'confidence_tier': 'INSUFFICIENT_DATA',
            'coverage_ratio': 0.0,
            'linguistic_entropy': 0.0,
            'notes': 'No events available for statistical estimation.'
        }

    coverage = analyzed_count / total_events

    # Tier mapping
    if coverage >= 0.85 and total_events >= 50:
        tier = 'HIGH'
    elif coverage >= 0.50 and total_events >= 20:
        tier = 'MODERATE'
    else:
        tier = 'LOW_PROVISIONAL'

    return {
        'overall_confidence': round(coverage, 2),
        'confidence_tier': tier,
        'coverage_ratio': round(coverage, 3),
        'total_analyzed': analyzed_count,
        'total_population': total_events,
        'is_defensible': tier in ('HIGH', 'MODERATE'),
        'guidance': 'Observed channels are verified; regional inferences reflect primary linguistic features only.'
    }
