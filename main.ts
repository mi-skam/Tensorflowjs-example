import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { hasGetUserMedia, changeNextWebcam } from "./webcam";

// SETUP

let handLandmarker;
let enableWebcamButton: HTMLElement;
let changeNextWebcamButton: HTMLElement;

let webcamRunning: Boolean = false;
const video = document.getElementById("webcamVideo") as HTMLVideoElement;
const canvasElement = document.getElementById(
  "outputCanvas"
) as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d");

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.

const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    // local directory, copied from node_modules/@mediapipe/tasks-vision/wasm to public/wasm
    "wasm"
    // "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
  return handLandmarker;
};
createHandLandmarker();

// APP

if (hasGetUserMedia()) {
  changeNextWebcamButton = document.getElementById("webcamNext");
  changeNextWebcamButton.addEventListener("click", changeNextWebcam);
  enableWebcamButton = document.getElementById("webcamEnable");
  enableWebcamButton?.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

async function enableCam(event) {
  handLandmarker = await createHandLandmarker();

  if (!handLandmarker) {
    console.warn("Wait! objectDetector not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "Enable";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "Disable";
  }

  // getUsermedia parameters.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
console.log(video);

async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;

  // Now let's start detecting the stream.
  //await handLandmarker?.setOptions({ runningMode: "VIDEO" });

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
    }
  }
  canvasCtx.restore();

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
