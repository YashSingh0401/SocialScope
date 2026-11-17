import React, { useState } from 'react';
import MetricCard from '../components/MetricCard';
import TopicCard from '../components/TopicCard';

export default function TopicExplorer({ topics, onExploreTopic }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const topicList = topics?.topics || [];
  const totalEvents = topics?.total_events || 0;
  const noiseCount = topics?.noise_count || 0;
  const clusteredCount = totalEvents - noiseCount;
  const clusterCoverage = totalEvents > 0 ? Math.round((clusteredCount / totalEvents) * 100) : 0;

  return (
    <div className="page-topic-explorer">
      <div className="metrics-grid">
        <MetricCard
          title="Discovered Topics"
          value={topicList.length}
          detail="Cosine semantic clusters formed"
          icon="🏷"
        />
        <MetricCard
          title="Clustered Events"
          value={clusteredCount}
          detail={`${clusterCoverage}% of all posts clustered`}
          icon="📦"
        />
        <MetricCard
          title="Noise / Outliers"
          value={noiseCount}
          detail="Isolated unlinked statements"
          icon="🌫"
          badge={{ text: 'FILTERED', type: 'neutral' }}
        />
      </div>

      <div className="topic-explorer-layout">
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
              <p>No topic clusters found. Ingest datasets to group conversations semantically.</p>
            </div>
          )}
        </div>

        {selectedTopic && (
          <aside className="topic-inspector-drawer">
            <div className="drawer-header">
              <h3>Cluster Inspector</h3>
              <button onClick={() => setSelectedTopic(null)}>✕</button>
            </div>

            <div className="drawer-body">
              <div className="drawer-field">
                <label>Semantic Label</label>
                <strong>{selectedTopic.label}</strong>
              </div>

              <div className="drawer-field">
                <label>Post Volume</label>
                <span>{selectedTopic.size} events</span>
              </div>

              <div className="drawer-field">
                <label>Bilingual Extracted Keywords (English & Devanagari)</label>
                <div className="drawer-keywords">
                  {(selectedTopic.keywords || []).map((k) => (
                    <span className="keyword-tag" key={k}>#{k}</span>
                  ))}
                </div>
              </div>

              <div className="drawer-field">
                <label>Representative Exemplar Post</label>
                <blockquote className="drawer-exemplar">
                  "{selectedTopic.exemplar_text}"
                </blockquote>
              </div>

              <div className="drawer-actions">
                <button
                  className="primary"
                  onClick={() => onExploreTopic && onExploreTopic(selectedTopic)}
                >
                  Inspect Filtered Events →
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
