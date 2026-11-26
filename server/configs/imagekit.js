import ImageKit from 'imagekit'

const requiredEnvironment = {
  publicKey: 'IMAGEKIT_PUBLIC_KEY',
  privateKey: 'IMAGEKIT_PRIVATE_KEY',
  urlEndpoint: 'IMAGEKIT_URL_ENDPOINT',
}

let imageKitClient

export class ImageKitConfigurationError extends Error {
  constructor(missingVariables) {
    super(`Missing ImageKit configuration: ${missingVariables.join(', ')}`)
    this.name = 'ImageKitConfigurationError'
    this.missingVariables = missingVariables
  }
}

export function getImageKitClient() {
  const missingVariables = Object.values(requiredEnvironment).filter(
    (name) => !process.env[name]?.trim()
  )

  if (missingVariables.length > 0) {
    throw new ImageKitConfigurationError(missingVariables)
  }

  if (!imageKitClient) {
    imageKitClient = new ImageKit({
      publicKey: process.env[requiredEnvironment.publicKey].trim(),
      privateKey: process.env[requiredEnvironment.privateKey].trim(),
      urlEndpoint: process.env[requiredEnvironment.urlEndpoint].trim(),
    })
  }

  return imageKitClient
}
