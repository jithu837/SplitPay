import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <Navbar />
      <Outlet />
    </div>
  )
}
