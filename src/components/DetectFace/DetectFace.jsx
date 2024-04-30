import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import Models from "../../Models";
import TinyDetector from "../TinyFaceDetector/TinyDetector";
import BlazeFaceShort from "../BlazeFaceShort/BlazeFaceShort";
import BlazeFaceFullRangeSparse from "../BlazeFaceFullRangeSparse/BlazeFaceFullSparse";

const DetectFace = () => {
  const [selectedModel, setSelectedModel] = React.useState(() => {
    const modelSelectedPreviously =
      sessionStorage.getItem("faceDetectionModel");
    if (Object.values(Models).includes(modelSelectedPreviously)) {
      return modelSelectedPreviously;
    } else {
      return Models.tinyFaceDetector;
    }
  });

  const loadBlazeFaceShortRangeModels = async () => {
    console.log("Loading blaze face short range model...");
    const vision = await FilesetResolver.forVisionTasks("/wasm/tasks-vision");
    const faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/blazeFace/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
    });
    blazeFaceShortRangeModel.current = faceDetector;
    console.log(faceDetector);
    console.log("Blaze face short range model loaded.");
  };

  const loadFaceDetectionModels = async () => {
    if (selectedModel === Models.tinyFaceDetector) {
      await loadTinyFaceDetectionModels();
    } else if (selectedModel === Models.blazeFaceShort) {
      await loadBlazeFaceShortRangeModels();
    }
  };
  //Loading face detection models ends here

  // Face detection methods starts here
  const detectWithTinyFaceDetector = (canvas) => {
    return faceapi.detectAllFaces(canvas);
  };
  const detectWithBlazeFaceShortRange = async (canvas) => {
    if (blazeFaceShortRangeModel.current) {
      const faceBlob = await canvas.toBlob();
      faceDetector
    } else {
      console.error("Blaze face short range model is not loaded.");
    }
  };

  const handleModelChange = (model) => {
    console.log("Model changed to:", model);
    setSelectedModel(model);
    sessionStorage.setItem("faceDetectionModel", model);
    window.location.reload();
  };

  return (
    <>
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
      {selectedModel === Models.tinyFaceDetector && <TinyDetector />}
      {selectedModel === Models.blazeFaceShort && <BlazeFaceShort />}
      {selectedModel === Models.blazeFaceFullRangeSparse && <BlazeFaceFullRangeSparse />}
    </>
  );
};

export default DetectFace;
