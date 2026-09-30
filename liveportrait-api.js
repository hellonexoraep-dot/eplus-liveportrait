// ============================================
// EPLUS LIVEPORTRAIT API CLIENT
// ============================================
//
// There is no paid GPU server connected yet.
//
// When we have the server, change:
//
// const LIVEPORTRAIT_API_URL = "";
//
// to the real API URL.
//
// ============================================


const LIVEPORTRAIT_API_URL = "";


// ============================================
// CHECK SERVER
// ============================================

async function checkLivePortraitServer() {

  if (!LIVEPORTRAIT_API_URL) {

    throw new Error(
      "LivePortrait server URL has not been configured."
    );

  }


  const response =
    await fetch(
      LIVEPORTRAIT_API_URL,
      {
        method: "GET"
      }
    );


  if (!response.ok) {

    throw new Error(
      "Server returned HTTP " +
      response.status
    );

  }


  return true;

}


// ============================================
// SEND SOURCE + DRIVING VIDEO
// ============================================

async function animateAvatar(
  sourceImage,
  drivingVideo
) {

  if (!LIVEPORTRAIT_API_URL) {

    throw new Error(
      "LivePortrait server URL has not been configured."
    );

  }


  const formData =
    new FormData();


  formData.append(
    "source_image",
    sourceImage
  );


  formData.append(
    "driving_video",
    drivingVideo
  );


  const response =
    await fetch(
      LIVEPORTRAIT_API_URL,
      {
        method: "POST",

        body: formData
      }
    );


  if (!response.ok) {

    throw new Error(
      "LivePortrait server returned HTTP " +
      response.status
    );

  }


  return await response.blob();

}


// ============================================
// EXPORT TO EPLUS
// ============================================

window.LivePortraitAPI = {

  checkServer:
    checkLivePortraitServer,

  animate:
    animateAvatar

};


console.log(
  "Eplus LivePortrait API client loaded."
);
