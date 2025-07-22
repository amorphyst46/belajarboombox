import axios from 'axios'
import FormData from 'form-data'
import { load } from 'cheerio'

export async function uploadTop4Top(buffer, filename) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError('Invalid buffer: must be a non-empty Buffer')
  }
  if (buffer.length > 30 * 1024 * 1024) {
    throw new RangeError('File too large: maximum size is 30MB')
  }

  const form = new FormData()
  form.append('file_0_', buffer, {
    filename: filename
  })
  form.append('submitr', '[ رفع الملفات ]')

  const { data } = await axios.post('https://top4top.io/index.php', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': 'Mozilla/5.0',
      'Accept': '*/*',
      'Referer': 'https://top4top.io/',
      'Origin': 'https://top4top.io'
    },
    maxBodyLength: Infinity
  })

  const url = load(data)('input.all_boxes').attr('value')
  if (!url || !/^https:\/\/\w+\.top4top\.io\/.+$/.test(url)) {
    throw new Error('Upload failed: unable to retrieve download link from Top4Top')
  }

  return url
}