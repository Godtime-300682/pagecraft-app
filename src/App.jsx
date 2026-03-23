import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewSalesPageWizard from './pages/NewSalesPageWizard'
import VSLCreatorPage from './pages/VSLCreatorPage'
import CreativesPage from './pages/CreativesPage'
import ProjectsPage from './pages/ProjectsPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'

function RequireAuth({ children }) {
  const key = localStorage.getItem('geminiKey')
  if (!key) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Layout>
                <DashboardPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/new/page"
          element={
            <RequireAuth>
              <Layout>
                <NewSalesPageWizard />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/new/vsl"
          element={
            <RequireAuth>
              <Layout>
                <VSLCreatorPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/new/creative"
          element={
            <RequireAuth>
              <Layout>
                <CreativesPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth>
              <Layout>
                <ProjectsPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Layout>
                <SettingsPage />
              </Layout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
