
import axios from 'axios'

const baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')

export const api = axios.create({ baseURL })

let unauthorizedHandler

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

export function setAdminToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

function normalizeBlog(blog) {
  if (!blog || typeof blog !== 'object') return blog
  return { ...blog, subTitle: blog.subtitle ?? blog.subTitle ?? '' }
}

function normalizeBlogResponse(data) {
  if (Array.isArray(data?.blogs)) {
    return { ...data, blogs: data.blogs.map(normalizeBlog) }
  }
  if (data?.blog) {
    return { ...data, blog: normalizeBlog(data.blog) }
  }
  if (Array.isArray(data?.recentBlogs)) {
    return { ...data, recentBlogs: data.recentBlogs.map(normalizeBlog) }
  }
  return data
}

function requestData(request) {
  return request.then(({ data }) => normalizeBlogResponse(data))
}

export function getPublicBlogs(config) {
  return requestData(api.get('/api/blog/all', config))
}

export function getPublicBlog(id, config) {
  return requestData(api.get(`/api/blog/${encodeURIComponent(id)}`, config))
}

export function submitPublicComment(id, payload) {
  return requestData(api.post(`/api/blog/${encodeURIComponent(id)}/comments`, payload))
}

export function getAdminSession(config) {
  return requestData(api.get('/api/admin/session', config))
}

export function loginAdmin(email, password) {
  return requestData(api.post('/api/admin/login', { email, password }))
}

export function getAdminStats(config) {
  return requestData(api.get('/api/admin/stats', config))
}

export function getAdminBlogs(config) {
  return requestData(api.get('/api/admin/blogs', config))
}

export function getAdminComments(status, config) {
  return requestData(api.get('/api/admin/comments', { ...config, params: { status } }))
}

export function createBlog(payload) {
  return requestData(api.post('/api/blog', payload))
}

export function updateBlog(id, payload) {
  return requestData(api.put(`/api/blog/${encodeURIComponent(id)}`, payload))
}

export function setBlogPublication(id, isPublished) {
  return requestData(
    api.patch(`/api/blog/${encodeURIComponent(id)}/publish`, { isPublished }),
  )
}

export function deleteBlog(id) {
  return requestData(api.delete(`/api/blog/${encodeURIComponent(id)}`))
}

export function setCommentApproval(id, isApproved) {
  return requestData(
    api.patch(`/api/admin/comments/${encodeURIComponent(id)}/approval`, { isApproved }),
  )
}

export function deleteComment(id) {
  return requestData(api.delete(`/api/admin/comments/${encodeURIComponent(id)}`))
}

export function uploadBlogImage(formData) {
  return requestData(api.post('/api/blog/upload', formData))
}

export function generateBlogContent(payload) {
  return requestData(api.post('/api/blog/generate', payload))
}
