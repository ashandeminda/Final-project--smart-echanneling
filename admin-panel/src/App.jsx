import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import AllAppointments from "./pages/Allappointments";
import AllDoctors from "./pages/Alldoctor";
import AllUsers from "./pages/Allusers";
import Donations from "./pages/Donations";
import AddHospital from "./pages/AddHospital";
import Settings from "./pages/Setting";
import Login from "./pages/Login";

function App() {
  const token = localStorage.getItem("adminToken");

  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />

        <Route path="/" element={token ? <Home /> : <Navigate to="/login" />} />
        <Route
          path="/appointments"
          element={token ? <AllAppointments /> : <Navigate to="/login" />}
        />
        <Route
          path="/doctors"
          element={token ? <AllDoctors /> : <Navigate to="/login" />}
        />
        <Route path="/users" element={token ? <AllUsers /> : <Navigate to="/login" />} />
        <Route
          path="/donations"
          element={token ? <Donations /> : <Navigate to="/login" />}
        />
        <Route
          path="/add-hospital"
          element={token ? <AddHospital /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={token ? <Settings /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
