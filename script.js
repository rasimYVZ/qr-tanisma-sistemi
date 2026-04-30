let stream;
let mode = null;

let video = document.getElementById("video");
let canvas = document.getElementById("canvas");
let preview = document.getElementById("preview");

let mediaRecorder;
let recordedChunks = [];
let lastVideoBlob = null;
let lastImage = null;

let recordInterval;
let seconds = 0;

/* CLOUDINARY */
const CLOUD_NAME = "dm3isnd9l";
const UPLOAD_PRESET = "qr_upload";

/* WEB3FORMS */
const WEB3FORMS_ACCESS_KEY = "3966e0f9-74d2-44ab-818f-3641870a2c0e";

/* SAYFA AÇILDIĞINDA */
window.onload = () => {
  updateButtons();
};

/* MODE */
function setMode(selected) {
  mode = selected;

  document.getElementById("modeText").innerText =
    "Seçilen mod: " +
    (mode === "photo" ? "Foto + Mesaj" : "Video Mesaj");

  video.style.display = "block";

  updateButtons();
}

/* BUTTON CONTROL */
function updateButtons() {
  document.querySelectorAll(".buttons button").forEach(btn => {
    btn.style.display = "none";
  });

  if (mode === "photo") {
    showBtn("startCamera");
    showBtn("takePhoto");
    showBtn("resetMedia");
    showBtn("sendData");
  }

  if (mode === "video") {
    showBtn("startCamera");
    showBtn("startRecording");
    showBtn("stopRecording");
    showBtn("resetMedia");
    showBtn("sendData");
  }
}

function showBtn(fnName) {
  document.querySelectorAll(".buttons button").forEach(btn => {
    if (btn.getAttribute("onclick").includes(fnName)) {
      btn.style.display = "inline-block";
    }
  });
}

/* CAMERA */
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true
    });

    video.srcObject = stream;

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      lastVideoBlob = new Blob(recordedChunks, { type: "video/webm" });
      recordedChunks = [];

      clearInterval(recordInterval);
      alert("Video hazır (" + seconds + " sn)");
      seconds = 0;
    };

  } catch (e) {
    alert("Kamera açılamadı");
  }
}

/* PHOTO */
function takePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext("2d").drawImage(video, 0, 0);

  let imgData = canvas.toDataURL("image/png");

  preview.src = imgData;
  preview.style.display = "block";

  lastImage = imgData;
}

/* VIDEO START */
function startRecording() {
  if (!mediaRecorder) return alert("Önce kamerayı aç");

  recordedChunks = [];
  mediaRecorder.start();

  seconds = 0;
  recordInterval = setInterval(() => {
    seconds++;
    document.getElementById("modeText").innerText =
      "Kayıt: " + seconds + " sn";
  }, 1000);
}

/* VIDEO STOP */
function stopRecording() {
  if (!mediaRecorder) return;
  mediaRecorder.stop();
}

/* RESET */
function resetMedia() {
  preview.src = "";
  preview.style.display = "none";

  lastImage = null;
  lastVideoBlob = null;
}

/* CONVERT */
function dataURLtoBlob(dataurl) {
  let arr = dataurl.split(",");
  let mime = arr[0].match(/:(.*?);/)[1];
  let bstr = atob(arr[1]);
  let u8arr = new Uint8Array(bstr.length);

  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

/* UPLOAD */
async function uploadToCloudinary(fileBlob, fileType) {
  let formData = new FormData();
  formData.append("file", fileBlob);
  formData.append("upload_preset", UPLOAD_PRESET);

  let type = fileType === "video" ? "video" : "image";

  let res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`,
    { method: "POST", body: formData }
  );

  let data = await res.json();
  return data.secure_url;
}

/* MAIL */
async function sendMail(message, fileUrl, modeText) {
  let formData = new FormData();

  formData.append("access_key", WEB3FORMS_ACCESS_KEY);
  formData.append("email", "seninmailin@gmail.com"); // ← BURAYI DEĞİŞTİR
  formData.append("subject", "Yeni Tanışma Mesajı");

  formData.append(
    "message",
    `Tür: ${modeText}
Mesaj: ${message}
Link: ${fileUrl}
Saat: ${new Date().toLocaleString()}`
  );

  await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    body: formData
  });
}

/* SEND */
async function sendData() {
  let msg = document.getElementById("message").value.trim();

  if (!msg) return alert("Mesaj boş olamaz");

  let blob, type, text;

  if (mode === "photo") {
    if (!lastImage) return alert("Foto çek");
    blob = dataURLtoBlob(lastImage);
    type = "image";
    text = "Foto + Mesaj";
  }

  if (mode === "video") {
    if (!lastVideoBlob) return alert("Video çek");
    blob = lastVideoBlob;
    type = "video";
    text = "Video Mesaj";
  }

  alert("Yükleniyor...");
  let url = await uploadToCloudinary(blob, type);

  await sendMail(msg, url, text);

  alert("Gönderildi");

  resetMedia();
  document.getElementById("message").value = "";
}
