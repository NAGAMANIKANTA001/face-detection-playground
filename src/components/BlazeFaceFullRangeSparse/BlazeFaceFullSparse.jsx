import React, { useState, useRef, useEffect } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import styles from "../styles.module.scss";

const BlazeFaceFullRangeSparse = () => {
  const [videoStream, setVideoStream] = useState(null);
  const videoPreviewRef = useRef(null);
  const blazeFaceShortRangeModel = useRef(null);
  const [faceCount, setFaceCount] = useState(0);

  const loadFaceDetectionModels = async () => {
    console.log("Loading blaze face full range sparse model...");
    const vision = await FilesetResolver.forVisionTasks(
      "/wasm/tasks-vision/full-range-sparse"
    );
    const faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/blazeFace/face_detection_full_range_sparse.tflite",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
    });
    blazeFaceShortRangeModel.current = faceDetector;
    console.log("Blaze face full range sparse model is loaded.");
  };

  const detectWithBlazeFaceShortRange = async (canvas) => {
    return await blazeFaceShortRangeModel.current.detect(canvas);
  };

  const detectFace = async () => {
    if (!videoPreviewRef.current.srcObject) {
      console.error("No video stream found.");
      return;
    }
    const video = videoPreviewRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    let faces = await detectWithBlazeFaceShortRange(canvas);
    console.log("Blaze face", faces);
    setFaceCount(faces.detections.length);
  };
  const monitor = async () => {
    try {
      await loadFaceDetectionModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360, frameRate: 30 },
      });
      console.log("Got MediaStream:", stream);
      setVideoStream(stream);
      console.log(videoPreviewRef);
      if (videoPreviewRef.current) {
        console.log("Setting video stream to video element.", stream);
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error monitoring face:", error);
    }
  };
  useEffect(() => {
    let intervalRef = null;
    const startMonitoring = async () => {
      await monitor();
      intervalRef = setInterval(() => {
        detectFace();
      }, 1000);
    };
    startMonitoring();
    return () => {
      clearInterval(intervalRef);
    };
  }, []);

  return (
    <>
      <div className={styles.videoPreviewContainer}>
        <video
          ref={videoPreviewRef}
          width={"100%"}
          height={"100%"}
          autoPlay
          hidden={videoStream === null}
        ></video>
        {videoStream === null && <h2>Loading video stream...</h2>}
      </div>
      <div className={styles.faceCountContainer}>
        {faceCount === 0 && <h2>No face is visible</h2>}
        {faceCount === 1 && <h2>1 face is visible</h2>}
        {faceCount > 1 && <h2>{faceCount} faces are visible</h2>}
      </div>
    </>
  );
};

export default BlazeFaceFullRangeSparse;
