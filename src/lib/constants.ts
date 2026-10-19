export interface Option {
  value: string;
  label: string;
}

export const CONTACT_TYPES: Option[] = [
  { value: "first timer", label: "First Timer" },
  { value: "new convert", label: "New Convert" },
];

// `value` is what is stored in contacts.serviceType. "apostolic inversion" is
// the spelling already in the data, so it stays as the value.
export const SERVICE_TYPES: Option[] = [
  { value: "apostolic inversion", label: "Apostolic Invasion" },
  { value: "crusade", label: "Crusade" },
  { value: "sunday service", label: "Sunday Service" },
  { value: "evangelism", label: "Evangelism" },
  { value: "wednesday service", label: "Wednesday Service" },
  {
    value: "tuesday healing and deliverance service",
    label: "Tuesday Healing & Deliverance",
  },
  { value: "www night", label: "WWW Night" },
];

// Older values that may still be on existing contacts.
const LEGACY_SERVICE_LABELS: Record<string, string> = {
  "mid week service": "Mid Week Service",
  others: "Others",
};

// Options for the add/edit contact forms.
export const SERVICE_TYPE_FORM_OPTIONS: Option[] = [
  ...SERVICE_TYPES,
  { value: "others", label: "Others" },
];

export function serviceTypeLabel(value?: string | null): string {
  if (!value) return "Not set";
  const key = value.toLowerCase();
  return (
    SERVICE_TYPES.find((s) => s.value === key)?.label ??
    LEGACY_SERVICE_LABELS[key] ??
    value
  );
}

export function contactTypeLabel(value?: string | null): string {
  if (!value) return "Not set";
  return CONTACT_TYPES.find((c) => c.value === value.toLowerCase())?.label ?? value;
}

// Follow-up rounds are counted from the number of feedback entries on a
// contact. Three or more means the third round has been done.
export type FeedbackRound = "none" | "first" | "second" | "third";

export const FEEDBACK_ROUNDS: { value: FeedbackRound; label: string; short: string }[] = [
  { value: "none", label: "No feedback yet", short: "No feedback" },
  { value: "first", label: "First round", short: "1st round" },
  { value: "second", label: "Second round", short: "2nd round" },
  { value: "third", label: "Third round", short: "3rd round" },
];

export function feedbackRound(count: number): FeedbackRound {
  if (count <= 0) return "none";
  if (count === 1) return "first";
  if (count === 2) return "second";
  return "third";
}

// Foundation class progress, from first visit to being planted in the church.
export type FoundationStage =
  | "not_started"
  | "class_1"
  | "class_2"
  | "class_3"
  | "completed"
  | "graduated"
  | "not_applicable";

export const FOUNDATION_STAGES: {
  value: FoundationStage;
  label: string;
  hint: string;
  color: string;
}[] = [
  { value: "not_started", label: "Not started", hint: "Has not begun foundation class", color: "#94a3b8" },
  { value: "class_1", label: "Class 1", hint: "Currently in class one", color: "#f59e0b" },
  { value: "class_2", label: "Class 2", hint: "Currently in class two", color: "#0ea5e9" },
  { value: "class_3", label: "Class 3", hint: "Currently in class three", color: "#6366f1" },
  { value: "completed", label: "Completed", hint: "Finished all three classes", color: "#10b981" },
  { value: "graduated", label: "Graduated", hint: "Graduated and planted", color: "#d946ef" },
  { value: "not_applicable", label: "Not applicable", hint: "Visitor from another church", color: "#64748b" },
];

export function foundationStageLabel(value?: string | null): string {
  if (!value) return "Not recorded";
  return FOUNDATION_STAGES.find((s) => s.value === value)?.label ?? value;
}

export function isFoundationStage(value: unknown): value is FoundationStage {
  return FOUNDATION_STAGES.some((s) => s.value === value);
}
