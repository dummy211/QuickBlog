import multer from 'multer'

const maxImageSize = 5 * 1024 * 1024
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function isJpeg(buffer) {
  if (
    buffer.length < 16 ||
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8 ||
    buffer[buffer.length - 2] !== 0xff ||
    buffer[buffer.length - 1] !== 0xd9
  ) {
    return false
  }

  let offset = 2
  let hasFrame = false

  while (offset < buffer.length - 2) {
    if (buffer[offset] !== 0xff) return false

    while (buffer[offset] === 0xff) offset += 1
    if (offset >= buffer.length) return false

    const marker = buffer[offset]
    offset += 1

    if (marker === 0xd9) return hasFrame && offset === buffer.length
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 2 > buffer.length) return false

    const segmentLength = buffer.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return false

    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
        marker
      )
    ) {
      if (segmentLength < 8) return false
      hasFrame =
        buffer.readUInt16BE(offset + 3) > 0 && buffer.readUInt16BE(offset + 5) > 0
    }

    if (marker === 0xda) return hasFrame

    offset += segmentLength
  }

  return false
}

function isPng(buffer) {
  if (buffer.length < pngSignature.length || !buffer.subarray(0, 8).equals(pngSignature)) {
    return false
  }

  let offset = 8
  let hasHeader = false
  let hasImageData = false
  let hasEnd = false

  while (offset + 12 <= buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset)
    const chunkEnd = offset + 12 + chunkLength
    if (chunkEnd > buffer.length) return false

    const chunkType = buffer.toString('ascii', offset + 4, offset + 8)

    if (!hasHeader) {
      if (chunkType !== 'IHDR' || chunkLength !== 13) return false
      const width = buffer.readUInt32BE(offset + 8)
      const height = buffer.readUInt32BE(offset + 12)
      if (width === 0 || height === 0) return false
      hasHeader = true
    } else if (chunkType === 'IHDR') {
      return false
    }

    if (chunkType === 'IDAT' && chunkLength > 0) hasImageData = true

    if (chunkType === 'IEND') {
      if (chunkLength !== 0) return false
      hasEnd = true
      offset = chunkEnd
      break
    }

    offset = chunkEnd
  }

  return hasHeader && hasImageData && hasEnd && offset === buffer.length
}

function isWebp(buffer) {
  if (
    buffer.length < 20 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP' ||
    buffer.readUInt32LE(4) !== buffer.length - 8
  ) {
    return false
  }

  let offset = 12
  let hasImageData = false

  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString('ascii', offset, offset + 4)
    const chunkLength = buffer.readUInt32LE(offset + 4)
    const chunkEnd = offset + 8 + chunkLength
    if (chunkEnd > buffer.length) return false

    if (['VP8 ', 'VP8L', 'VP8X'].includes(chunkType) && chunkLength > 0) {
      hasImageData = true
    }

    offset = chunkEnd + (chunkLength % 2)
  }

  return hasImageData && offset === buffer.length
}

export function detectImageType(buffer) {
  if (isJpeg(buffer)) return { mimeType: 'image/jpeg', extension: 'jpg' }
  if (isPng(buffer)) return { mimeType: 'image/png', extension: 'png' }
  if (isWebp(buffer)) return { mimeType: 'image/webp', extension: 'webp' }
  return null
}

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxImageSize,
    files: 1,
    fields: 0,
    parts: 1,
  },
})

export const receiveImage = imageUpload.single('image')

export function validateImageContent(request, response, next) {
  if (!request.file) {
    return response.status(400).json({
      success: false,
      message: 'An image file is required.',
    })
  }

  const imageType = detectImageType(request.file.buffer)

  if (!imageType || imageType.mimeType !== request.file.mimetype) {
    return response.status(400).json({
      success: false,
      message: 'Upload a valid JPEG, PNG, or WebP image.',
    })
  }

  request.imageType = imageType
  return next()
}

export function handleImageUploadError(error, _request, response, next) {
  if (!(error instanceof multer.MulterError)) return next(error)

  if (error.code === 'LIMIT_FILE_SIZE') {
    return response.status(413).json({
      success: false,
      message: 'The image must be 5 MiB or smaller.',
    })
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return response.status(400).json({
      success: false,
      message: 'Upload one image using the image field.',
    })
  }

  return response.status(400).json({
    success: false,
    message: 'The upload request is invalid.',
  })
}
