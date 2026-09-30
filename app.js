// ============================================
// VIEWER MODE CHECK (Hides controls for Person B)
// ============================================
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('mode') === 'viewer') {
    const controllerUI = document.getElementById('controller-ui');
    if (controllerUI) controllerUI.style.display = 'none';
    document.body.classList.add('viewer-mode');
}


// ============================================
// EPLUS AI VIDEO CALL
// ============================================

console.log("Eplus app.js loaded.");


// ============================================
// ELEMENTS
// ============================================

const camera =
  document.getElementById("camera");

const avatarCanvas =
  document.getElementById("avatarCanvas");

const startButton =
  document.getElementById("startButton");

const apiTestButton =
  document.getElementById("apiTestButton");

const callButton =
  document.getElementById("callButton");

const stopButton =
  document.getElementById("stopButton");

const status =
  document.getElementById("status");

const serverStatus =
  document.getElementById("serverStatus");

const mouthValue =
  document.getElementById("mouthValue");

const blinkValue =
  document.getElementById("blinkValue");

const smileValue =
  document.getElementById("smileValue");

// Custom Room Elements
const customRoomInput = document.getElementById("customRoomInput");
const setRoomButton = document.getElementById("setRoomButton");

// Handle Custom Room Link Input initialization
const existingRoom = urlParams.get('room');
if (existingRoom) {
  customRoomInput.value = existingRoom;
} else {
  customRoomInput.value = "eplus-call-" + Math.floor(Math.random() * 10000);
}

setRoomButton.addEventListener("click", () => {
  let roomName = customRoomInput.value.trim() || "my-room";
  roomName = roomName.replace(/\s+/g, '-');
  customRoomInput.value = roomName;

  const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?room=" + roomName;
  window.history.pushState({path: newUrl}, '', newUrl);

  status.textContent = "Room set to: " + roomName;
  console.log("Room link updated:", newUrl);
});


// ============================================
// CANVAS
// ============================================

const ctx =
  avatarCanvas.getContext("2d");

avatarCanvas.width = 600;
avatarCanvas.height = 600;


// ============================================
// CAMERA VARIABLES
// ============================================

let cameraStream = null;
let cameraStarted = false;


// ============================================
// MEDIAPIPE VARIABLES
// ============================================

let faceLandmarker = null;
let lastVideoTime = -1;
let trackingStarted = false;


// ============================================
// AVATAR VARIABLES
// ============================================

const avatarImage =
  new Image();

avatarImage.src =
  "./avatar.jpg";

let headX = 0;
let headY = 0;

let targetHeadX = 0;
let targetHeadY = 0;


// ============================================
// AVATAR IMAGE
// ============================================

avatarImage.onload = function () {

  console.log(
    "AVATAR IMAGE LOADED"
  );

  drawAvatar();

};


avatarImage.onerror = function () {

  console.error(
    "AVATAR IMAGE FAILED"
  );

  status.textContent =
    "avatar.jpg could not load.";

};


// ============================================
// DRAW AVATAR
// ============================================

function drawAvatar() {

  if (
    !avatarImage.complete ||
    avatarImage.naturalWidth === 0
  ) {

    requestAnimationFrame(
      drawAvatar
    );

    return;

  }


  ctx.clearRect(
    0,
    0,
    avatarCanvas.width,
    avatarCanvas.height
  );


  const canvasWidth =
    avatarCanvas.width;

  const canvasHeight =
    avatarCanvas.height;


  const imageRatio =
    avatarImage.naturalWidth /
    avatarImage.naturalHeight;

  const canvasRatio =
    canvasWidth /
    canvasHeight;


  let width;
  let height;


  if (
    imageRatio > canvasRatio
  ) {

    width =
      canvasWidth;

    height =
      canvasWidth /
      imageRatio;

  } else {

    height =
      canvasHeight;

    width =
      canvasHeight *
      imageRatio;

  }


  // Smooth head movement

  headX +=
    (
      targetHeadX -
      headX
    ) * 0.12;


  headY +=
    (
      targetHeadY -
      headY
    ) * 0.12;


  const x =
    (
      canvasWidth -
      width
    ) / 2 + headX;


  const y =
    (
      canvasHeight -
      height
    ) / 2 + headY;


  ctx.drawImage(
    avatarImage,
    x,
    y,
    width,
    height
  );


  requestAnimationFrame(
    drawAvatar
  );

}


// ============================================
// LOAD MEDIAPIPE
// ============================================

async function loadFaceTracker() {

  try {

    status.textContent =
      "Loading MediaPipe...";


    startButton.disabled =
      true;


    startButton.textContent =
      "Loading...";


    console.log(
      "STEP 1: Importing MediaPipe from CDN..."
    );


    const vision =
      await import(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs"
      );


    console.log(
      "STEP 2: MediaPipe module loaded."
    );


    const FaceLandmarker =
      vision.FaceLandmarker;


    const FilesetResolver =
      vision.FilesetResolver;


    if (!FaceLandmarker) {

      throw new Error(
        "FaceLandmarker export missing."
      );

    }


    if (!FilesetResolver) {

      throw new Error(
        "FilesetResolver export missing."
      );

    }


    console.log(
      "STEP 3: MediaPipe classes found."
    );


    // ========================================
    // LOAD LOCAL WASM
    // ========================================

    status.textContent =
      "Loading local MediaPipe WASM...";


    console.log(
      "STEP 4: Loading local WASM..."
    );


    const fileset =
      await FilesetResolver.forVisionTasks(
        "./mediapipe"
      );


    console.log(
      "STEP 4: WASM loaded."
    );


    // ========================================
    // LOAD FACE MODEL
    // ========================================

    status.textContent =
      "Loading face model...";


    console.log(
      "STEP 5: Creating FaceLandmarker..."
    );


    faceLandmarker =
      await FaceLandmarker.createFromOptions(
        fileset,
        {

          baseOptions: {

            modelAssetPath:
              "./models/face_landmarker.task"

          },


          runningMode:
            "VIDEO",


          numFaces:
            1,


          outputFaceBlendshapes:
            true,


          outputFacialTransformationMatrixes:
            true

        }
      );


    console.log(
      "STEP 6: FACE LANDMARKER READY."
    );


    status.textContent =
      "Face tracker ready.";


    startButton.disabled =
      false;


    startButton.textContent =
      "Start Camera";


  } catch (error) {

    console.error(
      "================================"
    );

    console.error(
      "FACE TRACKER ERROR:",
      error
    );

    console.error(
      "ERROR NAME:",
      error?.name
    );

    console.error(
      "ERROR MESSAGE:",
      error?.message
    );

    console.error(
      "ERROR STACK:",
      error?.stack
    );

    console.error(
      "================================"
    );


    status.textContent =
      "Face tracker failed.";

    startButton.disabled =
      true;

    startButton.textContent =
      "Tracker Failed";

  }

}


// ============================================
// START CAMERA
// ============================================

async function startCamera() {

  console.log(
    "CAMERA START REQUEST"
  );


  if (!faceLandmarker) {

    status.textContent =
      "Face tracker is still loading.";

    return;

  }


  status.textContent =
    "Requesting camera permission...";


  try {

    if (
      !navigator.mediaDevices
    ) {

      throw new Error(
        "Camera API is unavailable."
      );

    }


    if (
      !navigator.mediaDevices.getUserMedia
    ) {

      throw new Error(
        "getUserMedia is not supported."
      );

    }


    const cameraPromise =
      navigator.mediaDevices.getUserMedia(
        {

          video: {

            facingMode:
              "user",

            width: {

              ideal: 640

            },

            height: {

              ideal: 480

            }

          },


          audio:
            false

        }
      );


    const timeoutPromise =
      new Promise(
        function (_, reject) {

          setTimeout(
            function () {

              reject(
                new Error(
                  "Camera request timed out after 10 seconds."
                )
              );

            },
            10000
          );

        }
      );


    cameraStream =
      await Promise.race(
        [
          cameraPromise,
          timeoutPromise
        ]
      );


    console.log(
      "CAMERA STREAM RECEIVED",
      cameraStream
    );


    camera.srcObject =
      cameraStream;


    await camera.play();


    cameraStarted =
      true;


    startButton.disabled =
      true;


    startButton.textContent =
      "Camera Running";


    status.textContent =
      "Camera running. Tracking face...";


    console.log(
      "CAMERA VIDEO PLAYING"
    );


    startFaceTracking();


  } catch (error) {

    console.error(
      "CAMERA ERROR:",
      error
    );


    status.textContent =
      "Camera failed: " +
      error.message;


    startButton.disabled =
      false;


    startButton.textContent =
      "Try Camera Again";

  }

}


// ============================================
// START FACE TRACKING
// ============================================

function startFaceTracking() {

  if (!faceLandmarker) {

    status.textContent =
      "Face tracker is not ready.";

    return;

  }


  if (trackingStarted) {

    return;

  }


  trackingStarted =
    true;


  console.log(
    "FACE TRACKING STARTED"
  );


  requestAnimationFrame(
    detectFace
  );

}


// ============================================
// DETECT FACE
// ============================================

function detectFace() {

  if (
    !cameraStarted ||
    !cameraStream ||
    !faceLandmarker
  ) {

    requestAnimationFrame(
      detectFace
    );

    return;

  }


  if (
    camera.readyState >= 2 &&
    camera.currentTime !==
      lastVideoTime
  ) {

    lastVideoTime =
      camera.currentTime;


    try {

      const result =
        faceLandmarker.detectForVideo(
          camera,
          performance.now()
        );


      processFaceResult(
        result
      );


    } catch (error) {

      console.error(
        "FACE DETECTION ERROR:",
        error
      );

    }

  }


  requestAnimationFrame(
    detectFace
  );

}


// ============================================
// PROCESS FACE RESULT
// ============================================

function processFaceResult(
  result
) {

  if (
    !result.faceBlendshapes ||
    !result.faceBlendshapes.length
  ) {

    return;

  }


  const categories =
    result
      .faceBlendshapes[0]
      .categories;


  function getScore(
    name
  ) {

    const item =
      categories.find(
        function (x) {

          return (
            x.categoryName ===
            name
          );

        }
      );


    return item
      ? item.score
      : 0;

  }


  // ========================================
  // MOUTH
  // ========================================

  const jawOpen =
    getScore(
      "jawOpen"
    );


  // ========================================
  // BLINK
  // ========================================

  const blinkLeft =
    getScore(
      "eyeBlinkLeft"
    );


  const blinkRight =
    getScore(
      "eyeBlinkRight"
    );


  const blink =
    (
      blinkLeft +
      blinkRight
    ) / 2;


  // ========================================
  // SMILE
  // ========================================

  const smileLeft =
    getScore(
      "mouthSmileLeft"
    );


  const smileRight =
    getScore(
      "mouthSmileRight"
    );


  const smile =
    (
      smileLeft +
      smileRight
    ) / 2;


  // ========================================
  // SHOW VALUES
  // ========================================

  mouthValue.textContent =
    jawOpen.toFixed(2);


  blinkValue.textContent =
    blink.toFixed(2);


  smileValue.textContent =
    smile.toFixed(2);


  // ========================================
  // HEAD MOVEMENT
  // ========================================

  if (
    result.facialTransformationMatrixes &&
    result.facialTransformationMatrixes.length
  ) {

    const matrix =
      result
        .facialTransformationMatrixes[0];


    const data =
      matrix.data;


    if (
      data &&
      data.length >= 16
    ) {

      const rotationY =
        Math.atan2(
          data[2],
          data[10]
        );


      const rotationX =
        Math.atan2(
          -data[6],
          Math.sqrt(
            data[5] *
            data[5] +
            data[9] *
            data[9]
          )
        );


      targetHeadX =
        rotationY * 80;


      targetHeadY =
        rotationX * 50;

    }

  }

}


// ============================================
// TEST LIVEPORTRAIT API
// ============================================

async function testAPI() {

  serverStatus.textContent =
    "Checking server...";


  serverStatus.style.color =
    "#ffb000";


  try {

    if (
      !window.LivePortraitAPI
    ) {

      throw new Error(
        "liveportrait-api.js is missing."
      );

    }


    await LivePortraitAPI.checkServer();


    serverStatus.textContent =
      "LivePortrait server connected.";


    serverStatus.style.color =
      "#00d66b";


  } catch (error) {

    console.error(
      "API TEST:",
      error
    );


    serverStatus.textContent =
      "Server not connected yet.";


    serverStatus.style.color =
      "#ff4444";

  }

}


// ============================================
// PREPARE AVATAR VIDEO STREAM
// ============================================

function startVideoCall() {

  if (!cameraStream) {

    status.textContent =
      "Start camera first.";

    return;

  }


  if (
    !avatarCanvas.captureStream
  ) {

    status.textContent =
      "Canvas video streaming is unavailable.";

    return;

  }


  const avatarStream =
    avatarCanvas.captureStream(
      30
    );


  const avatarVideoTrack =
    avatarStream.getVideoTracks()[0];


  console.log(
    "AVATAR VIDEO TRACK:",
    avatarVideoTrack
  );


  status.textContent =
    "Avatar video stream ready.";

}


// ============================================
// STOP EVERYTHING
// ============================================

function stopEverything() {

  if (cameraStream) {

    cameraStream
      .getTracks()
      .forEach(
        function (track) {

          track.stop();

        }
      );


    cameraStream =
      null;

  }


  camera.srcObject =
    null;


  cameraStarted =
    false;


  trackingStarted =
    false;


  lastVideoTime =
    -1;


  startButton.disabled =
    !faceLandmarker;


  startButton.textContent =
    faceLandmarker
      ? "Start Camera"
      : "Loading...";


  status.textContent =
    faceLandmarker
      ? "Face tracker ready."
      : "Loading face tracker...";

}


// ============================================
// BUTTON EVENTS
// ============================================

startButton.addEventListener(
  "click",
  startCamera
);


apiTestButton.addEventListener(
  "click",
  testAPI
);


callButton.addEventListener(
  "click",
  startVideoCall
);


stopButton.addEventListener(
  "click",
  stopEverything
);


// ============================================
// START APPLICATION
// ============================================

loadFaceTracker();
