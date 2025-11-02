export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  placeholder = "Select an option",
  children,
}) => {
  const handleChange = (e) => {
    console.log(`SELECT CHANGE - ${name}:`, {
      oldValue: value,
      newValue: e.target.value,
      eventValue: e.target.value,
    });

    // âœ… IMPORTANT: Call onChange with full event object
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value || ""} // âœ… Ensure value is string
        onChange={handleChange} // âœ… Proper event handler
        disabled={disabled}
        required={required}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer hover:border-blue-400"
      >
        <option value="">{placeholder}</option>

        {options && options.length > 0 && !children
          ? options.map((option) => {
              // âœ… Ensure option values are strings for comparison
              const optionValue = String(option.value);
              const isSelected = String(value || "") === optionValue;

              return (
                <option
                  key={option.value}
                  value={optionValue}
                  selected={isSelected}
                >
                  {option.label}
                </option>
              );
            })
          : children}
      </select>
    </div>
  );
};
