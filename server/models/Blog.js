import mongoose from 'mongoose'

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Technology', 'Startup', 'Lifestyle', 'Finance'],
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isHttpUrl,
        message: 'Image must be a valid HTTP or HTTPS URL',
      },
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
)

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema)

export default Blog
