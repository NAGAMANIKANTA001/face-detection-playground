import React, { useState } from "react";
import Models from "../../Models";
import TinyDetector from "../TinyFaceDetector/TinyDetector";
import BlazeFaceShort from "../BlazeFaceShort/BlazeFaceShort";
import BlazeFaceFullRangeSparse from "../BlazeFaceFullRangeSparse/BlazeFaceFullSparse";
import SsdMobileNet from "../SSDMobileNet/SSDMobileNet";

const DetectFace = () => {
  const [minConfidence, setMinConfidence] = useState(() => {
    const minConfidence = sessionStorage.getItem("minConfidence");
    if (minConfidence) {
      return parseFloat(minConfidence);
    } else {
      return 0.5;
    }
  });
  const [frequency, setFrequency] = useState(() => {
    const frequency = sessionStorage.getItem("frequency");
    if (frequency) {
      return parseInt(frequency);
    } else {
      return 1000;
    }
  });
  const [selectedModel, setSelectedModel] = React.useState(() => {
    const modelSelectedPreviously =
      sessionStorage.getItem("faceDetectionModel");
    if (Object.values(Models).includes(modelSelectedPreviously)) {
      return modelSelectedPreviously;
    } else {
      return Models.tinyFaceDetector;
    }
  });

  const handleModelChange = (model) => {
    console.log("Model changed to:", model);
    setSelectedModel(model);
    sessionStorage.setItem("faceDetectionModel", model);
    window.location.reload();
  };
  const handleMinConfidenceChange = (e) => {
    if (e.target.value.length === 0) {
      setMinConfidence(0.5);
      sessionStorage.setItem("minConfidence", 0.5);
    } else if (e.target.value > 1 || e.target.value < 0.1) {
      alert("Min confidence should be between 0 and 1");
    } else {
      setMinConfidence(parseFloat(e.target.value));
      sessionStorage.setItem("minConfidence", e.target.value);
    }
  };
  const handleFrequencyChange = (e) => {
    const value = parseInt(e.target.value);
    if (e.target.value.length === 0 || !value) {
      setFrequency(1000);
      sessionStorage.setItem("frequency", 1000);
    } else if (value > 2000 || value < 10) {
      alert("Min confidence should be between 10 and 2000");
    } else {
      setFrequency(value);
      sessionStorage.setItem("frequency", value);
    }
  };
  return (
    <>
      <div>
        <select
          value={selectedModel}
          onChange={(e) => {
            handleModelChange(e.target.value);
          }}
        >
          {Object.values(Models).map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <div>
          <label>Min Confidence:</label>
          <input
            type="number"
            style={{ width: "80px" }}
            step={0.1}
            min={0.1}
            max={0.99}
            placeholder="Enter minConfidence"
            value={minConfidence}
            onChange={handleMinConfidenceChange}
          />
        </div>
        <div>
          <label>Frequency in ms:</label>
          <input
            type="number"
            style={{ width: "100px" }}
            step={200}
            min={10}
            max={2000}
            placeholder="Enter Frequency in ms"
            value={frequency}
            onChange={handleFrequencyChange}
          />
        </div>
      </div>
      {selectedModel === Models.tinyFaceDetector && (
        <TinyDetector minConfidence={minConfidence} frequency={frequency} />
      )}
      {selectedModel === Models.blazeFaceShort && (
        <BlazeFaceShort minConfidence={minConfidence} frequency={frequency} />
      )}
      {selectedModel === Models.ssdMobileNet && (
        <SsdMobileNet minConfidence={minConfidence} frequency={frequency} />
      )}
      {selectedModel === Models.blazeFaceFullRangeSparse && (
        <BlazeFaceFullRangeSparse />
      )}
    </>
  );
};

export default DetectFace;
