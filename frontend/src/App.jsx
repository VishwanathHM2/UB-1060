import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PatientForm from "./pages/PatientForm";
import ResultPage from "./pages/ResultPage";

function App() {
  const [patientData, setPatientData] = useState(null);
  const [resultData, setResultData] = useState(null);

  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center px-6 overflow-hidden">

        {/* LEFT SIDE COLOR BAR */}
        <div className="absolute left-0 top-0 h-full w-[3px]
                        animate-sideColor pointer-events-none" />

        {/* RIGHT SIDE COLOR BAR */}
        <div className="absolute right-0 top-0 h-full w-[3px]
                        animate-sideColor pointer-events-none" />

        {/* MAIN PANEL */}
        <div className="relative w-full max-w-4xl bg-gray-800/70 backdrop-blur-lg 
                        rounded-3xl shadow-2xl border border-gray-700 
                        p-10 animate-panelGlow">

          <Routes>
            <Route
              path="/"
              element={
                <PatientForm
                  setPatientData={setPatientData}
                  setResultData={setResultData}
                />
              }
            />

            <Route
              path="/result"
              element={
                <ResultPage
                  patientData={patientData}
                  resultData={resultData}
                />
              }
            />
          </Routes>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;