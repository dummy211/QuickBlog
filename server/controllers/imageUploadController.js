import { randomUUID } from 'node:crypto'
import { getImageKitClient, ImageKitConfigurationError } from '../configs/imagekit.js'

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

export async function uploadBlogImage(request, response) {
  if (!request.file || !request.imageType) {
    return response.status(400).json({
      success: false,
      message: 'A valid image file is required.',
    })
  }

  let imageKit

  try {
    imageKit = getImageKitClient()
  } catch (error) {
    if (!(error instanceof ImageKitConfigurationError)) throw error

    console.error(error.message)
    return response.status(500).json({
      success: false,
      message: 'Image uploads are temporarily unavailable.',
    })
  }

  try {
    const uploadedFile = await imageKit.upload({
      file: request.file.buffer,
      fileName: `blog-thumbnail-${randomUUID()}.${request.imageType.extension}`,
    })

    if (typeof uploadedFile?.filePath !== 'string' || !uploadedFile.filePath) {
      throw new Error('ImageKit returned an invalid upload response')
    }

    const imageUrl = imageKit.url({
      path: uploadedFile.filePath,
      transformation: [{ quality: 'auto', format: 'webp', width: '1280' }],
    })

    if (!isHttpUrl(imageUrl)) {
      throw new Error('ImageKit returned an invalid image URL')
    }

    return response.status(200).json({ success: true, imageUrl })
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    console.error(`ImageKit upload failed (${errorName})`)
    return response.status(502).json({
      success: false,
      message: 'The image could not be uploaded. Please try again.',
    })
  }
}
