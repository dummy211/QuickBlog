import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import BlogDetail from './pages/BlogDetail.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog/:id" element={<BlogDetail />} />
    </Routes>
  )
}

export default App