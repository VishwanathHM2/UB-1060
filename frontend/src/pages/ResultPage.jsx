import jsPDF from "jspdf";
import StatsCard from "../components/StatsCard";

function ResultPage({ patientData, resultData }) {

  if (!resultData) {
    return <p className="text-center text-gray-400">No result available.</p>;
  }

  /* ================= FORMAT DIAGNOSIS ================= */

  const formattedTumor =
    resultData.tumor_type.toLowerCase() === "notumor"
      ? "No Tumor Detected"
      : resultData.tumor_type.charAt(0).toUpperCase() +
        resultData.tumor_type.slice(1);

  /* ================= PDF GENERATION ================= */

  const generatePDF = () => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const reportId = "RPT-" + Date.now();
    const generatedOn = new Date().toLocaleString();

    /* ===== HEADER ===== */

    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Brain Tumor Detection Report", pageWidth / 2, 20, {
      align: "center",
    });

    doc.setLineWidth(0.5);
    doc.line(20, 25, pageWidth - 20, 25);

    /* ===== META ===== */

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    doc.text(`Report ID: ${reportId}`, 20, 35);
    doc.text(`Generated On: ${generatedOn}`, pageWidth - 20, 35, {
      align: "right",
    });

    /* ===== PATIENT INFO ===== */

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Patient Information", 20, 50);

    doc.setFontSize(12);
    doc.setFont(undefined, "normal");

    doc.text(`Patient Name: ${patientData?.name || "N/A"}`, 25, 60);
    doc.text(`Age: ${patientData?.age || "N/A"}`, 25, 70);

    /* ===== DIAGNOSTIC SUMMARY ===== */

    doc.setFontSize(15);
    doc.setFont(undefined, "bold");
    doc.text("Diagnostic Summary", 20, 90);

    doc.setLineWidth(0.3);
    doc.line(20, 95, pageWidth - 20, 95);

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text("Primary Finding:", 25, 110);

    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(formattedTumor, pageWidth / 2, 125, { align: "center" });

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text(
      `Model Confidence Score: ${resultData.confidence}%`,
      pageWidth / 2,
      140,
      { align: "center" }
    );

    /* ===== HEATMAP ===== */

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Grad-CAM Visualization", 20, 160);

    const imageWidth = 140;
    const imageHeight = 100;
    const imageX = (pageWidth - imageWidth) / 2;

    doc.addImage(
      resultData.heatmap,
      "JPEG",
      imageX,
      170,
      imageWidth,
      imageHeight
    );

    /* ===== DISCLAIMER ===== */

    doc.setFontSize(9);
    doc.setFont(undefined, "italic");

    doc.text(
      "Disclaimer: This AI system assists medical professionals and is not a substitute for clinical diagnosis. Final interpretation should be performed by a qualified medical practitioner.",
      20,
      pageHeight - 20,
      { maxWidth: pageWidth - 40 }
    );

    doc.save(`MRI_Report_${reportId}.pdf`);
  };

  /* ================= UI ================= */

  return (
    <div className="flex flex-col items-center space-y-8">

      <h2 className="text-2xl font-semibold text-blue-400 text-center">
        Analysis Result
      </h2>

      <img
        src={resultData.heatmap}
        alt="GradCAM"
        className="w-[350px] rounded-xl shadow-lg"
      />

      <div className="bg-gray-800 border border-gray-700 rounded-2xl px-10 py-6 text-center">
        <p className="text-sm text-gray-400 uppercase tracking-wide">
          Primary Finding
        </p>
        <h3 className="text-2xl font-bold text-blue-400 mt-2">
          {formattedTumor}
        </h3>
      </div>

      <p className="text-lg text-gray-300">
        Confidence Score:{" "}
        <span className="font-semibold text-white">
          {resultData.confidence}%
        </span>
      </p>

      <button
        onClick={generatePDF}
        className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl font-medium tracking-wide"
      >
        Download Diagnostic Report (PDF)
      </button>

    </div>
  );
}

export default ResultPage;