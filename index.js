import express from 'express'
import ytdl from 'ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import { uploadTop4Top } from './top4top.js'
import { v4 as uuidv4 } from 'uuid'
import { PassThrough } from 'stream'
import { Buffer } from 'buffer'

ffmpeg.setFfmpegPath(ffmpegPath)

const app = express()
const port = process.env.PORT || 3000
app.use(express.json())

app.get('/', (req, res) => {
  res.send('API is running. POST /ytmp3 { "url": "youtube_link" }')
})

app.post('/ytmp3', async (req, res) => {
  const { url } = req.body
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' })
  }

  try {
    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)
    const filename = `${title}_${uuidv4()}.mp3`

    const stream = ytdl(url, { quality: 'highestaudio' })
    const passthrough = new PassThrough()

    ffmpeg(stream)
      .audioBitrate(128)
      .format('mp3')
      .on('error', err => {
        console.error('FFmpeg error:', err)
        res.status(500).json({ error: 'Failed to convert audio' })
      })
      .pipe(passthrough)

    const chunks = []
    passthrough.on('data', chunk => chunks.push(chunk))
    passthrough.on('end', async () => {
      const buffer = Buffer.concat(chunks)
      const link = await uploadTop4Top(buffer, filename)
      res.json({ success: true, url: link })
    })

  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: 'Failed to process video' })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})