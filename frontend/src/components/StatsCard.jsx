function StatsCard({ title, value }) {
  return (
    <div className="bg-gray-700 p-6 rounded-xl border border-gray-600 hover:border-blue-500 transition-all">
        <h3 className="text-sm text-gray-400 uppercase tracking-wide">{title}</h3>
        <p className="text-2xl font-bold mt-2 text-blue-400">{value}</p>
    </div>
  );
}

export default StatsCard;