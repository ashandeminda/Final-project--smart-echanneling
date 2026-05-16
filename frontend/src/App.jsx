import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Hospitals from './pages/Hospital'
import Symptomchecker from './pages/Symptomchecker'
import TelemedicineFull from './pages/TelemedicineFull'
import Charity from './pages/Charity'
import Myappoinment from './pages/Myappoinment'
import DonationSuccess from './pages/Donatesuccess'
import Donate from './pages/Donate'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Doctors from './pages/Viewdoctor'
import Booking from './pages/Booking'
import AppointmentPayment from './pages/AppointmentPayment'
import ChatConsultation from './pages/ChatConsultation'
import VideoConsultation from './pages/VideoConsultation'
import DoctorAppointments from './pages/DoctorAppointments'
import MyProfile from './pages/Myprofile'
import DoctorLogin from './pages/DoctorLogin'
import HealthRecords from './pages/HealthRecords'
import AdminDashboard from './pages/AdminDashboard'
import DoctorProfile from './pages/DoctorProfile'


function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/appointment-payment" element={<AppointmentPayment />} />
        <Route path="/chat-consultation" element={<ChatConsultation />} />
        <Route path="/video-consultation" element={<VideoConsultation />} />
        <Route path="/doctor-appointments" element={<DoctorAppointments />} />
        <Route path="/doctor-profile" element={<DoctorProfile />} />
        <Route path='/login' element={<Login />} />
        <Route path='/doctor-login' element={<DoctorLogin />} />
        <Route path='/admin-dashboard' element={<AdminDashboard />} />
        <Route path='/register' element={<Register />} />
        <Route path='/hospitals' element={<Hospitals />} />
        <Route path='/symptomchecker' element={<Symptomchecker />} />
        <Route path='/telemedicine' element={<TelemedicineFull />} />
        <Route path='/charity' element={<Charity />} />
        <Route path='/donate' element={<Donate />} />
        <Route path='/donation-success' element={<DonationSuccess />} />
        <Route path='/myappoinment' element={<Myappoinment />} />
        <Route path="/profile" element={<MyProfile />} />
        <Route path="/health-records" element={<HealthRecords />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
