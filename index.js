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
        // Mendapatkan stream audio
        let stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
        
        // Mengupload stream ke Catbox
        let upload = await catbox(stream)
        
        res.json({ success: true, fileUrl: upload })
    } catch (error) {
        console.error('Error:', error.message)
        res.status(500).json({ success: false, message: error.message })
    }
})

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`)
})

async function catbox(media) {
    try {
        // Membuat FormData untuk upload
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        
        // Mengirimkan stream sebagai file
        form.append('fileToUpload', media, 'file.mp3')

        // Mengunggah ke Catbox
        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
        })

        // Mengembalikan hasil upload
        return response.data
    } catch (error) {
        // Menangani error saat upload
        throw new Error(`Upload gagal: ${error.message}`)
    }
}
