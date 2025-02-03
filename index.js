const express = require('express')
const ytdl = require('@distube/ytdl-core')
const axios = require('axios')
const FormData = require('form-data')

const app = express()
const PORT = 3000


app.get('/audio', async (req, res) => {
const url = req.query.url

if (!url || !ytdl.validateURL(url)) {
return res.status(400).send('URL YouTube tidak valid atau tidak diberikan.')
}

try {
let stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
let upload = await catbox(stream)

res.json({ success: true, fileUrl: upload })
} catch (error) {
console.error('Error:', error.response?.data || error.message)
res.status(500).json({ success: false, message: error.message })
}
})

app.listen(PORT, () => {
console.log(`Server berjalan di http://localhost:${PORT}`)
})


async function catbox(media) {
try {
const form = new FormData()
form.append('reqtype', 'fileupload')
form.append('fileToUpload', media, `file.mp3`)

const response = await axios.post('https://catbox.moe/user/api.php', form, {
headers: {
...form.getHeaders(),
},
})

return response.data
} catch (error) {
throw error
}
}
