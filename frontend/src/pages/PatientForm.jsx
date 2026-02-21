import { useState } from "react";
import { useNavigate } from "react-router-dom";

function PatientForm({ setPatientData, setResultData }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  /* ================= FILE PREVIEW HANDLER ================= */

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  /* ================= FORM SUBMIT ================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const file = event.target.image.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const startTime = Date.now();
    const minDuration = 2500; // minimum 2.5 seconds loading

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Ensure minimum analyzing duration
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - elapsed)
        );
      }

      setPatientData({ name, age });

      setResultData({
        tumor_type: data.tumor_type,
        confidence: data.confidence,
        heatmap: `data:image/jpeg;base64,${data.heatmap}`,
      });

      navigate("/result");

    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* Header */}
      <div>
        <div className="w-full text-center mb-6">
          <h2 className="text-3xl font-semibold text-white tracking-wide">
            AudaX NeuroX
          </h2>
        </div>
        <p className="text-gray-400 mt-2 text-sm">
          Enter patient information and upload MRI scan for AI-based tumor analysis.
        </p>
      </div>

      {/* Patient Information Section */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-8 space-y-6">

        <h3 className="text-lg font-medium text-blue-400">
          Patient Information
        </h3>

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Patient Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

        </div>
      </div>

      {/* MRI Upload Section */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-8 space-y-6">

        <h3 className="text-lg font-medium text-blue-400 text-center">
          MRI Image Upload
        </h3>

        <label
          className={`relative w-full h-[320px] flex items-center justify-center
                      border rounded-xl cursor-pointer
                      bg-gray-800 transition overflow-hidden
                      ${loading ? "border-blue-500" : "border-gray-700 hover:border-blue-500"}`}
        >
          <input
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            required
          />

          {preview && !loading && (
            <img
              src={preview}
              alt="MRI Preview"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}

          {!preview && !loading && (
            <div className="text-center space-y-2">
              <p className="text-gray-300">
                Click to Upload MRI Scan
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: JPG, PNG
              </p>
            </div>
          )}

          {loading && (
            <>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

              <div
                className="absolute w-full h-[6px] 
                bg-gradient-to-r from-transparent via-blue-400 to-transparent 
                animate-scan"
              ></div>

              <p className="absolute bottom-6 text-blue-400 text-sm tracking-wide">
                Analyzing MRI with AI Model...
              </p>
            </>
          )}
        </label>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition font-medium tracking-wide"
        >
          {loading ? "Analyzing..." : "Run AI Analysis"}
        </button>
      </div>

    </form>
  );
}

export default PatientForm;