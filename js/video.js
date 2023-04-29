//const IMG_SIZE = 256;
const IMG_SIZE = 32;

var classNames = null;
var images = null;
var model_0 = null;

var divConsole = {
  log: function (msg) {
    let debugLog = document.getElementById('debugLog');
    for (let i = 0; i < arguments.length; i++) {
      let arg = arguments[i];
      if (arg) {
        debugLog.innerText += arg + "\r\n";
      }
    }
  },
  error: function (msg) {
    let debugLog = document.getElementById('debugLog');
    for (let i = 0; i < arguments.length; i++) {
      let arg = arguments[i];
      if (arg) {
        debugLog.innerText += arg + "\r\n";
      }
    }
  },
  warn: function (msg) {
    let debugLog = document.getElementById('debugLog');
    for (let i = 0; i < arguments.length; i++) {
      let arg = arguments[i];
      if (arg) {
        debugLog.innerText += arg + "\r\n";
      }
    }
  }
}

divConsole.log('script.js version 0.1');


var localStorage = window.localStorage;
var cameraSelect = document.querySelector('select#cameraSource');

function getKeyCameraId() {
  return "CAMERA_ID";
}

function getCameraStreamHandleError(error) {
  divConsole.error('Error: ', error);
}


function getCameraDevices() {
  // AFAICT in Safari this only gets default devices until gUM is called :/
  return navigator.mediaDevices.enumerateDevices();
}


function gotCameraDevices(deviceInfos) {
  //divConsole.log('gotCameraDevices', deviceInfos);
  { //add blank default
    const option = document.createElement('option');
    option.value = '';
    option.text = '[Select Camera]';
    option.selected = true;
    option.disabled = true;
    cameraSelect.appendChild(option);
  }
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `Camera ${cameraSelect.length + 1}`;
      cameraSelect.appendChild(option);
    }
  }
}


function gotCameraStream(stream) {
  //divConsole.log('gotCameraStream', stream);
  cameraSelect.selectedIndex = [...cameraSelect.options].
    findIndex(option => option.text === stream.getVideoTracks()[0].label);
  video.srcObject = stream;
  if (cameraSelect.selectedIndex != -1) {
    // -1 is default stream
    localStorage.setItem(getKeyCameraId(), cameraSelect.selectedIndex);
  }
}


function getCameraStream(evt) {
  if (evt && evt.type == 'change') {
    //divConsole.log('getCameraStream', evt, evt.type);
    localStorage.setItem(getKeyCameraId(), cameraSelect.selectedIndex);
    video.srcObject = undefined;
  }
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const cameraSource = cameraSelect.value;
  const constraints = {
    video: { deviceId: cameraSource ? { exact: cameraSource } : undefined }
  };
  return navigator.mediaDevices.getUserMedia(constraints).
    then(gotCameraStream).catch(getCameraStreamHandleError);
}

async function requestPermissions() {
  let permissionObj = await navigator.permissions.query({ name: 'camera' });
  divConsole.log('requestPermissions:', permissionObj.state);
  if (permissionObj.state === 'granted') {
    divConsole.log('Permission request complete!');
    return;
  }

  setTimeout(function () {
    requestPermissions();
  }, 3000);
}

function argmax(data) {
  function fnCompareAscending(a, b) {
    if (a < b)
      return 1;
    if (a > b)
      return -1;
    return 0;
  }
  let sorted = [...data].sort(fnCompareAscending).slice(0, 5);
  return [data.indexOf(sorted[0])];
}

function argclamp(data, clamp) {
  function fnCompareAscending(a, b) {
    if (a < b)
      return 1;
    if (a > b)
      return -1;
    return 0;
  }
  let sorted = [...data].sort(fnCompareAscending).slice(0, 5);
  let result = [];
  for (let i = 0; i < sorted.length; ++i) {
    let index = data.indexOf(sorted[i]);
    let val = data[index];
    if (val > clamp) {
      result.push(index);
    }
  }
  //console.log('result', result);
  //console.log('result', data[result[0]]);
  return result;
}

const canvas = document.getElementById("canvasRender");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const video = document.getElementById("video");
const divFrames = document.getElementById("divFrames");

const canvas2 = document.getElementById("canvasPredictions");
const ctx2 = canvas2.getContext("2d");

ctx.filter = "contrast(150) brightness(400)";

var framesPerSecond = 0;
setInterval(function () {
  divFrames.innerText = framesPerSecond;
  framesPerSecond = 0;
}, 1000);

video.addEventListener("play", () => {
  function render() {
    ++framesPerSecond;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (model_0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      var predictions = null;
      tf.tidy(() => {
        const pixels = tf.browser.fromPixels(imageData, 3).resizeBilinear([IMG_SIZE, IMG_SIZE]);
        const tensor = pixels.div(tf.scalar(255));
        const input = tensor.expandDims(0);
        const preds = model_0.predict(input).dataSync();
        //predictions = argmax(preds);
        predictions = argclamp(preds, 0);
      });
    }

    if (classNames) {
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
      ctx2.globalCompositeOperation = "screen";
      for (let i = 0; i < predictions.length; ++i) {
        const pred = predictions[i];
        const img = images[pred];
        ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height);
      }
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
});

async function pageLoad() {

  await requestPermissions();

  cameraSelect.onchange = getCameraStream;

  getCameraStream().then(getCameraDevices).then(gotCameraDevices).then(function () {
    let selectedCameraIndex = localStorage.getItem(getKeyCameraId());
    if (selectedCameraIndex != '') {
      cameraSelect.selectedIndex = parseInt(selectedCameraIndex, 10);
      //divConsole.log('Select camera', cameraSelect.selectedIndex);
      getCameraStream();
    }
  });

  let response = await fetch('models/classNames.json');
  classNames = await response.json();
  images = [];
  for (let i = 0; i < classNames.length; ++i) {
    let src = 'models/images/' + classNames[i];
    const img = new Image()
    img.src = src;
    images.push(img);
  }

  divConsole.log('Loading box model...');
  model_0 = await tf.loadLayersModel('models/trained_models/box_model/model.json');
  setTimeout(function () {
    divConsole.log('Loaded box model');
    //model_0.summary(); // prints to console log
    divConsole.log(JSON.stringify(model_0.getConfig(), null, 2));
  }, 0);
}

pageLoad();
