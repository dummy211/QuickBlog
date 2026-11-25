import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import BlogDetail from './pages/BlogDetail.jsx'
import AddBlog from './pages/admin/AddBlog.jsx'
import Comments from './pages/admin/Comments.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import AdminLayout from './pages/admin/Layout.jsx'
import ListBlog from './pages/admin/ListBlog.jsx'
import Login from './components/admin/Login.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog/:id" element={<BlogDetail />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="addblog" element={<AddBlog />} />
        <Route path="listblog" element={<ListBlog />} />
        <Route path="comments" element={<Comments />} />
      </Route>
    </Routes>
  )
}

export default App