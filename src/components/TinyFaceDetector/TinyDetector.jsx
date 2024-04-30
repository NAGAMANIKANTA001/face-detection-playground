import React,{useState, useRef, useEffect} from 'react';
import * as faceapi from 'face-api.js';
import styles from '../styles.module.scss';

const TinyDetector = () => {
    const [videoStream, setVideoStream] = useState(null);
    const videoPreviewRef = useRef(null);
    const [faceCount, setFaceCount] = useState(0);

    const loadFaceDetectionModels = async () => {
      console.log("Loading tiny face detection model...");
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models/tinyFace");
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models/tinyFace");
      console.log("Tiny face detection model loaded.");
    };

    const detectWithTinyFaceDetector = (canvas) => {
      return faceapi.detectAllFaces(canvas);
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
      let faces = await detectWithTinyFaceDetector(canvas);
      console.log("Tiny Faces:", faces);
      setFaceCount(faces.length);
    };
  const monitor = async () => {
        try {
          await loadFaceDetectionModels();
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 360, frameRate: 30 },
          });
          console.log("Got MediaStream:", stream);
          setVideoStream(stream);
          console.log(videoPreviewRef)
          if (videoPreviewRef.current) {
            console.log("Setting video stream to video element.",stream);
            videoPreviewRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Error monitoring face:", error);
        }
    }
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
  },[])

  return (
    <>
      <br />
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
}

export default TinyDetector;