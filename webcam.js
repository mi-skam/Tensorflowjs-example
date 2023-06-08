// Check if webcam access is supported
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

const changeWebcam = (videoDevices) => {
  const video = document.querySelector("#webcamVideo");
  let nextDevice;

  if (video.srcObject) {
    const currentDeviceId = video.srcObject
      .getVideoTracks()[0]
      .getSettings().deviceId;
    nextDevice = videoDevices.find(
      (device) => device.deviceId !== currentDeviceId
    );
  }

  if (nextDevice) {
    const constraints = { video: { deviceId: nextDevice.deviceId } };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        video.srcObject = stream;
      })
      .catch(function (error) {
        console.error("Error switching camera:", error);
      });
  }
};

const getWebcams = async () => {
  return navigator.mediaDevices
    .enumerateDevices()
    .then(function (devices) {
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      console.log("Available webcams:", videoDevices);
      return videoDevices;
    })
    .catch(function (error) {
      console.error("Error enumerating devices:", error);
    });
};

const changeNextWebcam = async () => {
  const detectedWebcams = await getWebcams();
  changeWebcam(detectedWebcams);
};

export { hasGetUserMedia, changeWebcam, changeNextWebcam, getWebcams };
