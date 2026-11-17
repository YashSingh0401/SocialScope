import React from 'react';

export default function TopicCard({ topic, onSelect, isSelected }) {
  return (
    <article
      className={`topic-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(topic)}
    >
      <div className="topic-card-header">
        <h4 className="topic-name">{topic.label}</h4>
        <span className="topic-size-pill">
          {topic.size} posts
        </span>
      </div>

      <div className="topic-keywords">
        {(topic.keywords || []).map((k) => (
          <span className="keyword-tag" key={k}>
            #{k}
          </span>
        ))}
      </div>

      {topic.exemplar_text && (
        <blockquote className="topic-exemplar">
          "{topic.exemplar_text}"
        </blockquote>
      )}

      <div className="topic-footer">
        <small>Centroid ID: {topic.topic_id}</small>
        <span className="topic-action-hint">Explore topic →</span>
      </div>
    </article>
  );
}
