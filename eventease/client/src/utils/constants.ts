export const EVENT_TYPES = [
  'Wedding', 'Birthday', 'Corporate Event', 'College Event', 'Conference',
  'Concert', 'Party', 'Sports Event', 'Cultural Event', 'Other',
] as const;

export const VENDOR_CATEGORIES = [
  'Catering', 'Photography', 'Videography', 'Decoration', 'DJ', 'Music',
  'Makeup Artist', 'Florist', 'Wedding Planner', 'Security', 'Transportation',
  'Invitation Designer', 'Event Equipment', 'Other',
] as const;

export const EXPENSE_CATEGORIES = [
  'Venue', 'Catering', 'Decoration', 'Photography', 'Music',
  'Transportation', 'Invitation', 'Security', 'Miscellaneous',
] as const;

export const VENUE_FACILITIES = [
  'Parking', 'AC', 'WiFi', 'Catering Allowed', 'In-house Catering',
  'Stage', 'Sound System', 'Projector', 'Green Rooms', 'Valet Parking',
  'Garden Area', 'Swimming Pool', 'Power Backup', 'Lift', 'Bar',
] as const;

export const INDIAN_CITIES = [
  'Bangalore', 'Delhi', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Ghaziabad',
] as const;

export const EVENT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
