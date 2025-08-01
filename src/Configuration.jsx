import React, { useState } from "react";
import "./Configuration.css";

const tags = ["tag1", "tag2", "tag3", "tag4"];
const aggregationTypes = ["sum", "avg", "min", "max"];

const Configuration = ({ onBack }) => {
  const [tagValues, setTagValues] = useState({
    tag1: "0",
    tag2: "0",
    tag3: "0",
    tag4: "0",
  });

  const [aggregations, setAggregations] = useState([]);

  const handleTagValueChange = (tag, value) => {
    setTagValues(prev => ({
      ...prev,
      [tag]: value,
    }));
  };

  const handleAddAggregation = () => {
    setAggregations(prev => [...prev, { type: "sum", tags: [] }]);
  };

  const handleAggregationChange = (index, updatedAgg) => {
    const updated = [...aggregations];
    updated[index] = updatedAgg;
    setAggregations(updated);
  };

  const handleRemoveAggregation = (index) => {
    setAggregations(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="config-wrapper">
      <button onClick={onBack} className="back-btn">← Wróć</button>
      <h2>Konfiguracja Tagi i Agregacje</h2>

      <div className="tags-form">
        {tags.map(tag => (
          <div key={tag} className="tag-input">
            <label>{tag.toUpperCase()}</label>
            <input
              type="text"
              value={tagValues[tag]}
              onChange={(e) => handleTagValueChange(tag, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="aggregations">
        <h3>Agregacje</h3>
        {aggregations.map((agg, index) => (
          <div key={index} className="aggregation">
            <div>
              <label>Typ:</label>
              <select
                value={agg.type}
                onChange={(e) =>
                  handleAggregationChange(index, { ...agg, type: e.target.value })
                }
              >
                {aggregationTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Tagi:</label>
              {tags.map(tag => (
                <label key={tag} style={{ marginRight: "8px" }}>
                  <input
                    type="checkbox"
                    checked={agg.tags.includes(tag)}
                    onChange={(e) => {
                      const newTags = e.target.checked
                        ? [...agg.tags, tag]
                        : agg.tags.filter(t => t !== tag);
                      handleAggregationChange(index, { ...agg, tags: newTags });
                    }}
                  />
                  {tag}
                </label>
              ))}
            </div>

            <button className="remove-agg" onClick={() => handleRemoveAggregation(index)}>Usuń agregację</button>
          </div>
        ))}
        <button className="add-btn" onClick={handleAddAggregation}>➕ Dodaj agregację</button>
      </div>

      <div className="tiles">
        {Object.entries(tagValues).map(([tag, value]) => (
          <div className="tile" key={tag}>
            <div className="tile-title">{tag}</div>
            <div>{value}</div>
          </div>
        ))}
        {aggregations.map((agg, index) => (
          <div className="tile" key={`agg-${index}`}>
            <div className="tile-title">{agg.type}</div>
            <div>{agg.tags.length ? agg.tags.join(", ") : "Brak tagów"}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Configuration;