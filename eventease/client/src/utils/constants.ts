export const EVENT_TYPES = [
  'Wedding', 'Birthday', 'Corporate Event', 'College Event', 'Conference',
  'Concert', 'Party', 'Sports Event', 'Cultural Event',
  'Festival', 'Engagement', 'Housewarming', 'Anniversary',
  'Other',
] as const;

export const FESTIVALS = [
  { name: 'Diwali', emoji: '🪔', desc: 'Festival of lights', color: 'from-amber-500 to-orange-600' },
  { name: 'Holi', emoji: '🎨', desc: 'Festival of colors', color: 'from-pink-500 to-purple-600' },
  { name: 'Pongal', emoji: '🌾', desc: 'Harvest festival', color: 'from-yellow-500 to-green-600' },
  { name: 'Ganesh Chaturthi', emoji: '🐘', desc: 'Lord Ganesha celebration', color: 'from-red-500 to-orange-600' },
  { name: 'Navratri', emoji: '💃', desc: 'Nine nights of dance', color: 'from-purple-500 to-pink-600' },
  { name: 'Onam', emoji: '🌸', desc: 'Kerala harvest festival', color: 'from-green-500 to-emerald-600' },
  { name: 'Eid', emoji: '🌙', desc: 'Festival of breaking fast', color: 'from-emerald-500 to-teal-600' },
  { name: 'Christmas', emoji: '🎄', desc: 'Festival of joy', color: 'from-red-500 to-green-600' },
];

export const INDIAN_WEDDING_EVENTS = [
  'Mehendi', 'Sangeet', 'Haldi', 'Baraat', 'Wedding Ceremony',
  'Reception', 'Engagement', 'Kanyadaan', 'Vidhi', 'Post-Wedding',
] as const;

export const VENDOR_CATEGORIES = [
  'Catering', 'Photography', 'Videography', 'Decoration', 'DJ', 'Music',
  'Makeup Artist', 'Florist', 'Wedding Planner', 'Security', 'Transportation',
  'Invitation Designer', 'Event Equipment', 'Mehendi Artist', 'Pandit/Purohit',
  'Mandap Decorator', 'Catering - South Indian', 'Catering - North Indian',
  'Catering - Mughlai', 'Catering - Bengali', 'Catering - Rajasthani',
  'Other',
] as const;

export const EXPENSE_CATEGORIES = [
  'Venue', 'Catering', 'Decoration', 'Photography', 'Music',
  'Transportation', 'Invitation', 'Security', 'Mehendi', 'Jewellery',
  'Attire', 'Gifts', 'Miscellaneous',
] as const;

export const VENUE_FACILITIES = [
  'Parking', 'AC', 'WiFi', 'Catering Allowed', 'In-house Catering',
  'Stage', 'Sound System', 'Projector', 'Green Rooms', 'Valet Parking',
  'Garden Area', 'Swimming Pool', 'Power Backup', 'Lift', 'Bar',
  'Mandap', 'Pandal', 'Outdoor Lawn', 'Banquet Hall', 'Rooftop',
  'Temple Nearby', 'Vedic Priest Available',
] as const;

export const INDIAN_CITIES = [
  'Bangalore', 'Delhi', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Ghaziabad',
  'Kolkata', 'Jaipur', 'Lucknow', 'Ahmedabad', 'Chandigarh', 'Kochi', 'Goa',
  'Indore', 'Bhopal', 'Nagpur', 'Surat', 'Thiruvananthapuram',
] as const;

export const EVENT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const INDIAN_LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Rajasthani', 'Odia',
] as const;
