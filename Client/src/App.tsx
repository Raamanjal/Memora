import { Signin } from "./pages/Signin"
import { Signup } from "./pages/Signup"
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom"
import { Dashboard } from "./pages/dashboard"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { SharedBrain } from "./pages/SharedBrain"
function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/share/:hash" element={<SharedBrain />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
}

export default App
