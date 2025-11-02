import { useState, useRef, useEffect } from "react";

export const MultiSelect = ({
  label,
  name,
  value = [],
  onChange,
  options = [],
  required = false,
  disabled = false,
  placeholder = "Select options...",
  highlightConflict = false,
  conflictSlots = [],
  breakSlots = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // âœ… Fixed: Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];

  const handleToggle = (optionValue) => {
    console.log(`MULTISELECT TOGGLE - ${name}:`, {
      optionValue,
      currentValue: safeValue,
      isIncluded: safeValue.includes(optionValue),
    });

    let newValue;
    if (safeValue.includes(optionValue)) {
      newValue = safeValue.filter((v) => v !== optionValue);
    } else {
      newValue = [...safeValue, optionValue];
    }

    console.log(`MULTISELECT NEW VALUE - ${name}:`, newValue);

    // âœ… IMPORTANT: Call onChange with proper format
    if (onChange) {
      onChange({
        target: {
          name,
          value: newValue,
        },
      });
    }
  };

  const getSelectedLabels = () => {
    return safeValue
      .map((v) => options.find((opt) => opt.value === v)?.label)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-2 text-left rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
            highlightConflict
              ? "border-2 border-red-500 bg-red-50 focus:ring-red-500"
              : "border border-gray-300 bg-white focus:ring-blue-500 hover:border-blue-400"
          } disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer`}
        >
          <div className="flex justify-between items-center">
            <span
              className={
                getSelectedLabels()
                  ? "text-gray-900 font-medium"
                  : "text-gray-500"
              }
            >
              {getSelectedLabels() || placeholder}
            </span>
            <svg
              className={`h-5 w-5 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="p-2 max-h-60 overflow-y-auto">
              {options.length === 0 ? (
                <p className="text-gray-500 text-sm p-2">
                  No options available
                </p>
              ) : (
                options.map((option) => {
                  const isConflict = conflictSlots?.includes(option.value);
                  const isBreak = breakSlots?.includes(option.value);
                  const isChecked = safeValue.includes(option.value);

                  return (
                    <div
                      key={option.value}
                      onClick={() => !isConflict && handleToggle(option.value)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded transition-colors ${
                        isConflict
                          ? "bg-red-50 opacity-60 cursor-not-allowed"
                          : isBreak
                            ? "bg-yellow-50 hover:bg-yellow-100"
                            : isChecked
                              ? "bg-blue-50 hover:bg-blue-100"
                              : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          !isConflict && handleToggle(option.value)
                        }
                        disabled={isConflict}
                        className="w-4 h-4 rounded border-gray-300 focus:ring-2 cursor-pointer"
                      />
                      <span className="flex-1 text-gray-700">
                        {option.label}
                      </span>
                      {isConflict && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Occupied
                        </span>
                      )}
                      {isBreak && !isConflict && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          Break
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
