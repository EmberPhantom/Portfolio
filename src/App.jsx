import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import BlogPostPage from './pages/BlogPostPage'
import Dashboard from './pages/Dashboard'

function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
        </Route>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
