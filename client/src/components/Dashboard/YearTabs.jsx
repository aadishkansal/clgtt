export const YearTabs = ({ selectedYear, onYearChange }) => {
  const years = [1, 2, 3, 4];

  return (
    <div className="flex gap-4 mb-6">
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            selectedYear === year
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Year {year}
        </button>
      ))}
    </div>
  );
};
