const express = require("express");
const ytdl = require("@distube/ytdl-core");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");
const fs = require("fs")
const app = express();
const PORT = 7860;

app.use(cors());
const agent = ytdl.createAgent(JSON.parse(fs.readFileSync("cookie.json")));

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const date = new Date(dateString);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function catbox(media, filename) {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", media, filename);

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

async function getVideoInfo(url) {
  const info = await ytdl.getInfo(url, { agent });
  const details = info.videoDetails;
  return {
    title: details.title,
    description: details.description || "Tidak ada deskripsi",
    thumbnail: details.thumbnails.pop().url,
    duration: `${Math.floor(details.lengthSeconds / 60)}:${details.lengthSeconds % 60} menit`,
    uploader: details.author.name,
    uploadDate: formatDate(details.uploadDate),
    views: formatNumber(details.viewCount),
    likes: formatNumber(details.likes || 0),
  };
}

app.get("/video", async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: "URL tidak valid" });
  }
  try {
    const infoFull = await ytdl.getInfo(url, { agent });
    let formats = infoFull.formats;
    if (!Array.isArray(formats)) {
      formats = Object.values(formats);
    }
    const videoFormat = ytdl.chooseFormat(formats, { filter: "videoandaudio", quality: "highest" });
    const info = await getVideoInfo(url);
    const videoStream = ytdl(url, { format: videoFormat, agent });

    const videoUrl = await catbox(videoStream, "video.mp4");
    res.json({
      info,
      result: {
        quality: videoFormat.qualityLabel || "Tidak diketahui",
        size: videoFormat.contentLength ? formatBytes(parseInt(videoFormat.contentLength)) : "Ukuran tidak tersedia",
        url: videoUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal memproses video", details: error.message });
  }
});

app.get("/audio", async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: "URL tidak valid" });
  }
  try {
    const infoFull = await ytdl.getInfo(url, { agent });
    let formats = infoFull.formats;
    if (!Array.isArray(formats)) {
      formats = Object.values(formats);
    }
    const audioFormat = ytdl.chooseFormat(formats, { filter: "audioonly" });
    const info = await getVideoInfo(url);
    const audioStream = ytdl(url, { format: audioFormat, agent });

    const audioUrl = await catbox(audioStream, "audio.mp3");
    res.json({
      info,
      result: {
        quality: `${audioFormat.audioBitrate} kbps`,
        size: audioFormat.contentLength ? formatBytes(parseInt(audioFormat.contentLength)) : "Ukuran tidak tersedia",
        url: audioUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal memproses audio", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
