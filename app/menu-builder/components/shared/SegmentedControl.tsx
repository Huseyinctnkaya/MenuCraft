export const renderSegmentedControl = (
  options: Array<{ label: string; value: string }>,
  value: string,
  onChange: (next: string) => void
) => (
  <ul className="Menu-SegmentedControl__SegmentedControlContainer flex w-full items-center gap-1 rounded-lg bg-gray-100 p-1">
    {options.map((option) => {
      const isSelected = option.value === value;
      return (
        <li
          key={option.value}
          className="Menu-SegmentedControl-Option__OptionWrapper list-none flex-1"
        >
          <button
            type="button"
            onClick={() => onChange(option.value)}
            className={`Menu-SegmentedControl-Option__SegmentedControlItem w-full rounded-md px-3 py-1 text-sm font-medium ${isSelected
              ? "Menu-SegmentedControl-Option--selected bg-white shadow-sm"
              : "bg-transparent"
              }`}
          >
            {option.label}
          </button>
        </li>
      );
    })}
  </ul>
);
