// ============================================================
// BLENDIFY — Date Range Picker Component
// ============================================================
'use client';

interface DateRangePickerProps {
  from?: string;
  to?: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  label?: string;
  id?: string;
}

export function DateRangePicker({ from, to, onFromChange, onToChange, label, id = 'date-range' }: DateRangePickerProps) {
  return (
    <div>
      {label && <label className="admin-label" style={{ marginBottom: '6px', display: 'block' }}>{label}</label>}
      <div className="admin-daterange">
        <input
          type="date"
          className="admin-input"
          value={from ?? ''}
          onChange={(e) => onFromChange(e.target.value)}
          style={{ width: '150px' }}
          id={`${id}-from`}
          aria-label="From date"
        />
        <span className="admin-daterange-sep">to</span>
        <input
          type="date"
          className="admin-input"
          value={to ?? ''}
          min={from}
          onChange={(e) => onToChange(e.target.value)}
          style={{ width: '150px' }}
          id={`${id}-to`}
          aria-label="To date"
        />
      </div>
    </div>
  );
}
