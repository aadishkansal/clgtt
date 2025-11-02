export const ConflictPreview = ({ conflicts, isValidating }) => {
  if (isValidating) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-700 font-medium">Validating entry...</p>
        </div>
      </div>
    );
  }

  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-green-700 font-medium">✓ No conflicts detected</p>
        </div>
      </div>
    );
  }

  const criticalConflicts = conflicts.filter((c) => c.severity === "critical");
  const warnings = conflicts.filter((c) => c.severity === "warning");

  return (
    <div className="space-y-3">
      {criticalConflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-bold mb-2">
                Critical Conflicts ({criticalConflicts.length})
              </p>
              <ul className="space-y-1">
                {criticalConflicts.map((conflict, idx) => (
                  <li key={idx} className="text-sm text-red-700">
                    <span className="font-semibold uppercase">
                      {conflict.type}:
                    </span>{" "}
                    {conflict.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-yellow-800 font-bold mb-2">
                Warnings ({warnings.length})
              </p>
              <ul className="space-y-1">
                {warnings.map((conflict, idx) => (
                  <li key={idx} className="text-sm text-yellow-700">
                    <span className="font-semibold uppercase">
                      {conflict.type}:
                    </span>{" "}
                    {conflict.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
