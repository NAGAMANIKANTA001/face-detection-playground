import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import styles from "../styles.module.scss";

const TinyBlaze = ({ minConfidence, frequency }) => {
  const checkFrequency = frequency ?? 1000;
  const minimumConfidence = minConfidence ?? 0.5;
  const [videoStream, setVideoStream] = useState(null);
  const videoPreviewRef = useRef(null);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);
  const blazeFaceShortRangeModel = useRef(null);
  const [faceCount, setFaceCount] = useState(0);

  const loadFaceDetectionModels = async () => {
    console.log("Loading Tiny face detection model...");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models/face-api");
    console.log("Tiny face detection model loaded.");
    console.log("Loading blaze face short model...");
    const vision = await FilesetResolver.forVisionTasks(
      "/wasm/tasks-vision/short-range"
    );
    const faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/blazeFace/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      minDetectionConfidence: minimumConfidence,
    });
    blazeFaceShortRangeModel.current = faceDetector;
    console.log("Blaze face short model is loaded.");
  };

  const detectWithTinyFaceDetector = (canvas) => {
    return faceapi.detectAllFaces(
      canvas,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: minimumConfidence })
    );
  };
  const detectWithBlazeFaceShortRange = async (canvas) => {
    console.log(
      "Detecting with blaze face short range model...",
      checkFrequency
    );
    return await blazeFaceShortRangeModel.current.detect(canvas);
  };
  const drawBoundingBoxesForBlazeFace = (canvas, faces) => {
    const context = canvas.getContext("2d");
    faces.forEach((detection) => {
      const { originX, originY, width, height } = detection.boundingBox;
      context.strokeStyle = "red";
      context.lineWidth = 2;
      context.beginPath();
      context.rect(originX, originY, width, height);
      context.stroke();
      context.fillStyle = "red";
      context.font = "12px Arial";
      context.fillText(
        `Score: ${detection.categories[0].score.toFixed(2)}`,
        originX,
        originY - 5
      );
    });
  };

  const detectFace = async () => {
    if (!videoPreviewRef.current.srcObject || !canvasRef.current) {
      console.error("No video stream found.");
      return;
    }
    const video = videoPreviewRef.current;
    const context = canvasRef.current.getContext("2d");
    context.drawImage(
      video,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    let tinyFaces = await detectWithTinyFaceDetector(canvasRef.current);
    let blazeFaces = await detectWithBlazeFaceShortRange(canvasRef.current);
    const resizedDetections = faceapi.resizeResults(tinyFaces, {
      width: video.clientWidth,
      height: video.clientHeight,
    });
    faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
    drawBoundingBoxesForBlazeFace(canvasRef.current, blazeFaces.detections);
    console.log("Tiny Faces:", tinyFaces);
    console.log("Blaze Faces:", blazeFaces);
    const faces = Math.max(
      Math.min(blazeFaces.detections.length, 1),
      tinyFaces.length
    );
    setFaceCount(faces);
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
  const closeAllCanvases = () => {
    const previousCanvases = document.querySelectorAll("canvas");
    previousCanvases.forEach((canvas) => {
      canvas.remove();
    });
  };
  const createCanvas = () => {
    const video = videoPreviewRef.current;
    console.log("clientWidth", video.clientWidth);
    console.log("clientHeight", video.clientHeight);
    console.log("videoWidth", video.videoWidth);
    console.log("videoHeight", video.videoHeight);
    canvasRef.current = faceapi.createCanvasFromMedia(video);
    canvasRef.current.width = video.clientWidth;
    canvasRef.current.height = video.clientHeight;
    canvasRef.current.style.position = "absolute";
    canvasRef.current.style.float = "center";
    canvasRef.current.style.top = video.offsetTop + "px";
    canvasRef.current.style.left = video.offsetLeft + "px";
    console.log(video.offsetTop, video.offsetLeft);
    closeAllCanvases();
    document.body.append(canvasRef.current);
    faceapi.matchDimensions(canvasRef.current, {
      width: video.clientWidth,
      height: video.clientHeight,
    });
  };
  useEffect(() => {
    screen.orientation.addEventListener("change", () => {
      if (videoPreviewRef.current && canvasRef.current) {
        console.log(
          videoPreviewRef.current.offsetTop,
          videoPreviewRef.current.offsetLeft
        );
        canvasRef.current.width = videoPreviewRef.current.clientWidth;
        canvasRef.current.height = videoPreviewRef.current.clientHeight;
        canvasRef.current.style.top = videoPreviewRef.current.offsetTop + "px";
        canvasRef.current.style.left =
          videoPreviewRef.current.offsetLeft + "px";
      }
      console.log("Setting canvas width and height...");
    });
  }, []);

  useEffect(() => {
    const startMonitoring = async () => {
      closeAllCanvases();
      await monitor();
      const video = videoPreviewRef.current;
      if (!video) {
        return;
      }
      video.addEventListener("loadeddata", createCanvas);
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        detectFace();
      }, checkFrequency);
    };
    startMonitoring();
    return () => {
      console.log("Clearing interval...");
      closeAllCanvases();
      clearInterval(intervalRef.current);
      const video = videoPreviewRef.current;
      if (video) {
        video.removeEventListener("loadeddata", createCanvas);
      }
    };
  }, [minConfidence, checkFrequency]);

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

export default TinyBlaze;
