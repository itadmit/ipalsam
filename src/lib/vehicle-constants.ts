export const VEHICLE_TYPES = [
  { value: "חפק מגד", label: "חפק מגד" },
  { value: "חפק מפ", label: "חפק מפ" },
  { value: "אמבולנס", label: "אמבולנס" },
  { value: "משאית", label: "משאית" },
  { value: "שכור לבן", label: "שכור לבן" },
  { value: "אחר", label: "אחר" },
];

export const VEHICLE_TYPES_MAP: Record<string, string> = Object.fromEntries(
  VEHICLE_TYPES.map((t) => [t.value, t.label])
);

export const FITNESS_OPTIONS = [
  { value: "טיפולים לרכב", label: "טיפולים לרכב" },
  { value: "פלוגה א", label: "פלוגה א" },
  { value: "פלוגה ב", label: "פלוגה ב" },
  { value: "פלוגה ג", label: "פלוגה ג" },
  { value: "מפקדה", label: "מפקדה" },
  { value: "אחר", label: "אחר" },
];
