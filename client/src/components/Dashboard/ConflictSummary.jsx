import { getConflictColor } from "../../utils/helpers";

export const ConflictSummary = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p className="text-green-800 font-medium">✓ No conflicts detected</p>
      </div>
    );
  }

  const criticalConflicts = conflicts.filter((c) => c.severity === "critical");
  const warningConflicts = conflicts.filter((c) => c.severity === "warning");

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Conflict Summary</h3>

      {criticalConflicts.length > 0 && (
        <div className="mb-4">
          <h4 className="text-red-700 font-semibold mb-2">
            Critical Conflicts ({criticalConflicts.length})
          </h4>
          <div className="space-y-2">
            {criticalConflicts.map((conflict, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-3 ${getConflictColor(conflict.severity)}`}
              >
                <p className="font-medium">{conflict.type.toUpperCase()}</p>
                <p className="text-sm">{conflict.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {warningConflicts.length > 0 && (
        <div>
          <h4 className="text-yellow-700 font-semibold mb-2">
            Warnings ({warningConflicts.length})
          </h4>
          <div className="space-y-2">
            {warningConflicts.map((conflict, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-3 ${getConflictColor(conflict.severity)}`}
              >
                <p className="font-medium">{conflict.type.toUpperCase()}</p>
                <p className="text-sm">{conflict.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
