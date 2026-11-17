import React, { useState } from 'react';
import MetricCard from '../components/MetricCard';
import TopicCard from '../components/TopicCard';

export default function TopicExplorer({ topics, onExploreTopic }) {
  const topicList = topics?.topics || [];
  const [selectedTopic, setSelectedTopic] = useState(topicList[0] || null);
  const totalEvents = topics?.total_events || 0;
  const noiseCount = topics?.noise_count || 0;
  const clusteredCount = totalEvents - noiseCount;
  const clusterCoverage = totalEvents > 0 ? Math.round((clusteredCount / totalEvents) * 100) : 0;

  return (
    <div className="page-topic-explorer">
      {/* High-Level Semantic Telemetry */}
      <div className="metrics-grid">
        <MetricCard
          title="Discovered Topics"
          value={topicList.length}
          detail="Cosine semantic clusters formed"
          icon="🏷"
          theme="purple"
        />
        <MetricCard
          title="Clustered Events"
          value={clusteredCount.toLocaleString()}
          detail={`${clusterCoverage}% of monitored corpus clustered`}
          icon="📦"
          theme="cyan"
        />
        <MetricCard
          title="Noise & Outliers"
          value={noiseCount}
          detail="Isolated unlinked statements filtered"
          icon="🌫"
          badge={{ text: 'FILTERED', type: 'neutral' }}
          theme="amber"
        />
      </div>

      <div className="topic-explorer-layout">
        {/* Left Column: Topic Clusters Grid */}
        <div className="topic-cards-column">
          <div className="section-title-row">
            <h3>Semantic Topic Clusters</h3>
            <span className="badge badge-purple">{topicList.length} CLUSTERS</span>
          </div>

          <div className="topic-cards-grid">
            {topicList.map((t) => (
              <TopicCard
                key={t.topic_id}
                topic={t}
                isSelected={selectedTopic?.topic_id === t.topic_id}
                onSelect={(top) => setSelectedTopic(top)}
              />
            ))}
            {!topicList.length && (
              <div className="empty-state">
                <p>No topic clusters found in this timeframe. Select Demo Mode to explore pre-computed intelligence clusters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column / Inspector: Deep Cluster Inspector & Related Discussions */}
        <aside className="topic-inspector-panel">
          {selectedTopic ? (
            <div className="inspector-inner">
              <div className="inspector-header">
                <div>
                  <span className="inspector-label">CLUSTER INSPECTION</span>
                  <h3 className="inspector-title">{selectedTopic.label}</h3>
                </div>
                <span className="pill info">{selectedTopic.size} events</span>
              </div>

              {/* Representative Exemplar Post */}
              <div className="inspector-section">
                <label className="field-label">Representative Exemplar Post</label>
                <div className="exemplar-card">
                  <div className="exemplar-meta">
                    <span className="exemplar-author">
                      Source ID: <code>{selectedTopic.exemplar_id || 'corpus-top'}</code>
                    </span>
                    <span className="pill small neutral">VERBATIM CAPTURE</span>
                  </div>
                  <blockquote className="exemplar-quote">
                    "{selectedTopic.exemplar_text}"
                  </blockquote>
                </div>
              </div>

              {/* Bilingual Keywords */}
              <div className="inspector-section">
                <label className="field-label">Bilingual Extracted Keywords (English & Indic)</label>
                <div className="keywords-wrap">
                  {(selectedTopic.keywords || []).map((k) => (
                    <span className="keyword-chip" key={k}>
                      #{k}
                    </span>
                  ))}
                </div>
              </div>

              {/* Related Discussions & Diffusion Vectors */}
              <div className="inspector-section">
                <label className="field-label">Related Discussions & Diffusion Vectors</label>
                <div className="related-discussions-list">
                  <div className="related-item">
                    <div className="related-header">
                      <strong>Cross-Platform Telegram Mirrors</strong>
                      <span className="pill small danger">CRITICAL AMPLIFICATION</span>
                    </div>
                    <p className="related-snippet">
                      Verbatim copypasta matched across 14 regional public channels within 8 minutes of seed post.
                    </p>
                  </div>

                  <div className="related-item">
                    <div className="related-header">
                      <strong>Fact-Checking Debunk Counters</strong>
                      <span className="pill small success">COUNTER-NARRATIVE</span>
                    </div>
                    <p className="related-snippet">
                      Local power authority released verified telemetry showing standard grid frequency (49.98 Hz).
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="inspector-actions">
                <button
                  className="btn-primary full-width"
                  onClick={() => onExploreTopic && onExploreTopic(selectedTopic)}
                >
                  Inspect Filtered Events in Event Explorer →
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-inspector">
              <p>Select any topic cluster on the left to inspect representative posts, keywords, and related discussions.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
