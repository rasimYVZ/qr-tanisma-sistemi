let stream;
let mode = null;

let video = document.getElementById("video");
let canvas = document.getElementById("canvas");
let preview = document.getElementById("preview");

let mediaRecorder;
let recordedChunks = [];
let lastVideoBlob = null;
let lastImage = null;

/*
====================================
CLOUDINARY AYARLARI
====================================
*/

const CLOUD_NAME = "dm3isnd9l";
const UPLOAD_PRESET = "qr_upload";

/*
====================================
MOD SEÇİMİ
====================================
*/

function setMode(selected) {
  mode = selected;

  document.getElementById("modeText").innerText =
    "Seçilen mod: " +
    (mode === "photo" ? "Foto + Mesaj" : "Video Mesaj");
}

/*
====================================
KAMERA AÇ
====================================
*/

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: true
    });

    video.srcObject = stream;

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      lastVideoBlob = new Blob(recordedChunks, {
        type: "video/webm"
      });

      recordedChunks = [];
      console.log("Video hazır");
      alert("Video kaydı hazır");
    };

  } catch (error) {
    console.log(error);
    alert("Kamera açılamadı");
  }
}

/*
====================================
FOTO ÇEK
====================================
*/

function takePhoto() {
  if (!stream) {
    alert("Önce kamerayı aç");
    return;
  }

  let ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

  let imgData = canvas.toDataURL("image/png");

  preview.src = imgData;
  preview.style.display = "block";

  lastImage = imgData;

  alert("Foto çekildi");
}

/*
====================================
VİDEO BAŞLAT
====================================
*/

function startRecording() {
  if (!mediaRecorder) {
    alert("Önce kamerayı aç");
    return;
  }

  if (mode !== "video") {
    alert("Video modu seç");
    return;
  }

  recordedChunks = [];
  mediaRecorder.start();

  alert("Video kaydı başladı");
}

/*
====================================
VİDEO DURDUR
====================================
*/

function stopRecording() {
  if (!mediaRecorder) {
    alert("Önce kamerayı aç");
    return;
  }

  mediaRecorder.stop();
}

/*
====================================
SIFIRLAMA
====================================
*/

function resetMedia() {
  preview.src = "";
  preview.style.display = "none";

  lastImage = null;
  lastVideoBlob = null;

  alert("Medya silindi");
}

/*
====================================
BASE64 → BLOB
====================================
*/

function dataURLtoBlob(dataurl) {
  let arr = dataurl.split(",");
  let mime = arr[0].match(/:(.*?);/)[1];
  let bstr = atob(arr[1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], {
    type: mime
  });
}

/*
====================================
CLOUDINARY UPLOAD
====================================
*/

async function uploadToCloudinary(fileBlob, fileType) {
  const formData = new FormData();

  formData.append("file", fileBlob);
  formData.append("upload_preset", UPLOAD_PRESET);

  let resourceType = "image";

  if (fileType === "video") {
    resourceType = "video";
  }

  const url =
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  console.log(data);

  if (!data.secure_url) {
    throw new Error("Upload başarısız");
  }

  return data.secure_url;
}

/*
====================================
GÖNDER
====================================
*/

async function sendData() {
  const msg = document.getElementById("message").value.trim();

  if (!mode) {
    alert("Önce mod seç");
    return;
  }

  if (!msg) {
    alert("Mesaj boş olamaz");
    return;
  }

  try {
    let fileBlob;
    let fileType;

    if (mode === "photo") {
      if (!lastImage) {
        alert("Önce foto çek");
        return;
      }

      fileBlob = dataURLtoBlob(lastImage);
      fileType = "image";
    }

    if (mode === "video") {
      if (!lastVideoBlob) {
        alert("Önce video kaydı yap");
        return;
      }

      fileBlob = lastVideoBlob;
      fileType = "video";
    }

    alert("Yükleniyor...");

    const uploadedFileUrl = await uploadToCloudinary(
      fileBlob,
      fileType
    );

    console.log("Dosya linki:", uploadedFileUrl);

    alert(
      "Başarıyla gönderildi!\n\nDosya Linki:\n" +
      uploadedFileUrl
    );

    document.getElementById("message").value = "";
    resetMedia();

  } catch (error) {
    console.log(error);
    alert("Gönderme sırasında hata oluştu");
  }
}