/* Country, then state, then city. All three are dropdowns, because a typed address is
 * a field that arrives as "hyd", "Hyd.", "HYDERABAD" and "hyderbad" and can never be
 * counted. Picking from a list costs the visitor three taps and gives us data we can
 * group by.
 *
 * Each country also carries its dialling code and its currency, so choosing a country
 * sets the phone prefix and re-prices the whole page in one move. That is the point:
 * a dealer in Melbourne should see Australian dollars without hunting for a selector.
 *
 * The city lists are the places these businesses actually are, not every settlement.
 * Every list ends in "Other" so nobody is ever stuck, and India is the deepest because
 * it is the main market. Add to it freely: it is only data.
 */

export type Country = {
  name: string
  /** ISO 3166-1 alpha-2, also used to pick the flag and match a timezone guess */
  code: string
  dial: string
  ccy: string
  /** what this country calls the middle tier */
  tier: string
  states: Record<string, string[]>
}

const OTHER = 'Other'

export const COUNTRIES: Country[] = [
  {
    name: 'India', code: 'IN', dial: '+91', ccy: 'INR', tier: 'State',
    states: {
      'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', OTHER],
      'Arunachal Pradesh': ['Itanagar', OTHER],
      'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', OTHER],
      'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', OTHER],
      'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', OTHER],
      'Goa': ['Panaji', 'Margao', 'Vasco da Gama', OTHER],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', OTHER],
      'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Karnal', 'Hisar', OTHER],
      'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', OTHER],
      'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', OTHER],
      'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', OTHER],
      'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur', OTHER],
      'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', OTHER],
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Kolhapur', OTHER],
      'Manipur': ['Imphal', OTHER],
      'Meghalaya': ['Shillong', OTHER],
      'Mizoram': ['Aizawl', OTHER],
      'Nagaland': ['Kohima', 'Dimapur', OTHER],
      'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', OTHER],
      'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Mohali', 'Patiala', OTHER],
      'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', OTHER],
      'Sikkim': ['Gangtok', OTHER],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', OTHER],
      'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam', OTHER],
      'Tripura': ['Agartala', OTHER],
      'Uttar Pradesh': ['Noida', 'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', OTHER],
      'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', OTHER],
      'West Bengal': ['Kolkata', 'Siliguri', 'Durgapur', 'Asansol', OTHER],
      'Delhi NCR': ['New Delhi', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad', OTHER],
      'Chandigarh': ['Chandigarh', OTHER],
      'Jammu & Kashmir': ['Srinagar', 'Jammu', OTHER],
      'Ladakh': ['Leh', OTHER],
      'Puducherry': ['Puducherry', OTHER],
      'Andaman & Nicobar': ['Port Blair', OTHER],
      'Dadra & Nagar Haveli and Daman & Diu': ['Silvassa', 'Daman', OTHER],
      'Lakshadweep': ['Kavaratti', OTHER],
    },
  },
  {
    name: 'United Arab Emirates', code: 'AE', dial: '+971', ccy: 'AED', tier: 'Emirate',
    states: {
      'Dubai': ['Dubai', 'Jebel Ali', OTHER],
      'Abu Dhabi': ['Abu Dhabi', 'Al Ain', 'Ruwais', OTHER],
      'Sharjah': ['Sharjah', 'Khor Fakkan', OTHER],
      'Ajman': ['Ajman', OTHER],
      'Ras Al Khaimah': ['Ras Al Khaimah', OTHER],
      'Fujairah': ['Fujairah', OTHER],
      'Umm Al Quwain': ['Umm Al Quwain', OTHER],
    },
  },
  {
    name: 'Saudi Arabia', code: 'SA', dial: '+966', ccy: 'SAR', tier: 'Province',
    states: {
      'Riyadh': ['Riyadh', 'Al Kharj', OTHER],
      'Makkah': ['Jeddah', 'Makkah', 'Taif', OTHER],
      'Eastern Province': ['Dammam', 'Khobar', 'Dhahran', 'Jubail', OTHER],
      'Madinah': ['Madinah', 'Yanbu', OTHER],
      'Asir': ['Abha', 'Khamis Mushait', OTHER],
      'Qassim': ['Buraidah', 'Unaizah', OTHER],
      'Tabuk': ['Tabuk', OTHER],
    },
  },
  {
    name: 'Qatar', code: 'QA', dial: '+974', ccy: 'QAR', tier: 'Municipality',
    states: { 'Doha': ['Doha', OTHER], 'Al Rayyan': ['Al Rayyan', OTHER], 'Al Wakrah': ['Al Wakrah', OTHER], 'Al Khor': ['Al Khor', OTHER] },
  },
  {
    name: 'Kuwait', code: 'KW', dial: '+965', ccy: 'USD', tier: 'Governorate',
    states: { 'Al Asimah': ['Kuwait City', OTHER], 'Hawalli': ['Hawalli', OTHER], 'Farwaniya': ['Farwaniya', OTHER], 'Ahmadi': ['Ahmadi', OTHER] },
  },
  {
    name: 'Oman', code: 'OM', dial: '+968', ccy: 'USD', tier: 'Governorate',
    states: { 'Muscat': ['Muscat', 'Seeb', OTHER], 'Dhofar': ['Salalah', OTHER], 'Al Batinah': ['Sohar', OTHER] },
  },
  {
    name: 'Bahrain', code: 'BH', dial: '+973', ccy: 'USD', tier: 'Governorate',
    states: { 'Capital': ['Manama', OTHER], 'Muharraq': ['Muharraq', OTHER], 'Northern': ['Hamad Town', OTHER] },
  },
  {
    name: 'Singapore', code: 'SG', dial: '+65', ccy: 'SGD', tier: 'Region',
    states: { 'Central': ['Singapore', OTHER], 'East': ['Singapore', OTHER], 'West': ['Singapore', OTHER], 'North': ['Singapore', OTHER] },
  },
  {
    name: 'Malaysia', code: 'MY', dial: '+60', ccy: 'MYR', tier: 'State',
    states: {
      'Kuala Lumpur': ['Kuala Lumpur', OTHER],
      'Selangor': ['Shah Alam', 'Petaling Jaya', 'Subang Jaya', OTHER],
      'Penang': ['George Town', 'Butterworth', OTHER],
      'Johor': ['Johor Bahru', 'Batu Pahat', OTHER],
      'Sarawak': ['Kuching', 'Miri', OTHER],
      'Sabah': ['Kota Kinabalu', OTHER],
      'Perak': ['Ipoh', OTHER],
      'Melaka': ['Melaka', OTHER],
    },
  },
  {
    name: 'United Kingdom', code: 'GB', dial: '+44', ccy: 'GBP', tier: 'Nation or region',
    states: {
      'Greater London': ['London', OTHER],
      'South East England': ['Brighton', 'Reading', 'Oxford', 'Southampton', OTHER],
      'North West England': ['Manchester', 'Liverpool', 'Preston', OTHER],
      'West Midlands': ['Birmingham', 'Coventry', 'Wolverhampton', OTHER],
      'Yorkshire': ['Leeds', 'Sheffield', 'York', OTHER],
      'East of England': ['Cambridge', 'Norwich', 'Luton', OTHER],
      'South West England': ['Bristol', 'Exeter', 'Plymouth', OTHER],
      'Scotland': ['Glasgow', 'Edinburgh', 'Aberdeen', OTHER],
      'Wales': ['Cardiff', 'Swansea', 'Newport', OTHER],
      'Northern Ireland': ['Belfast', 'Derry', OTHER],
    },
  },
  {
    name: 'United States', code: 'US', dial: '+1', ccy: 'USD', tier: 'State',
    states: {
      'Alabama': ['Birmingham', 'Montgomery', OTHER], 'Alaska': ['Anchorage', OTHER],
      'Arizona': ['Phoenix', 'Tucson', 'Scottsdale', OTHER], 'Arkansas': ['Little Rock', OTHER],
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Irvine', OTHER],
      'Colorado': ['Denver', 'Colorado Springs', OTHER], 'Connecticut': ['Hartford', 'Stamford', OTHER],
      'Delaware': ['Wilmington', OTHER], 'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', OTHER],
      'Georgia': ['Atlanta', 'Savannah', OTHER], 'Hawaii': ['Honolulu', OTHER],
      'Idaho': ['Boise', OTHER], 'Illinois': ['Chicago', 'Naperville', OTHER],
      'Indiana': ['Indianapolis', 'Fort Wayne', OTHER], 'Iowa': ['Des Moines', OTHER],
      'Kansas': ['Wichita', 'Overland Park', OTHER], 'Kentucky': ['Louisville', 'Lexington', OTHER],
      'Louisiana': ['New Orleans', 'Baton Rouge', OTHER], 'Maine': ['Portland', OTHER],
      'Maryland': ['Baltimore', 'Bethesda', OTHER], 'Massachusetts': ['Boston', 'Cambridge', OTHER],
      'Michigan': ['Detroit', 'Grand Rapids', OTHER], 'Minnesota': ['Minneapolis', 'Saint Paul', OTHER],
      'Mississippi': ['Jackson', OTHER], 'Missouri': ['Kansas City', 'St. Louis', OTHER],
      'Montana': ['Billings', OTHER], 'Nebraska': ['Omaha', OTHER],
      'Nevada': ['Las Vegas', 'Reno', OTHER], 'New Hampshire': ['Manchester', OTHER],
      'New Jersey': ['Newark', 'Jersey City', 'Edison', OTHER], 'New Mexico': ['Albuquerque', OTHER],
      'New York': ['New York City', 'Brooklyn', 'Buffalo', 'Albany', OTHER],
      'North Carolina': ['Charlotte', 'Raleigh', 'Durham', OTHER], 'North Dakota': ['Fargo', OTHER],
      'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', OTHER], 'Oklahoma': ['Oklahoma City', 'Tulsa', OTHER],
      'Oregon': ['Portland', 'Eugene', OTHER], 'Pennsylvania': ['Philadelphia', 'Pittsburgh', OTHER],
      'Rhode Island': ['Providence', OTHER], 'South Carolina': ['Charleston', 'Columbia', OTHER],
      'South Dakota': ['Sioux Falls', OTHER], 'Tennessee': ['Nashville', 'Memphis', OTHER],
      'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', OTHER],
      'Utah': ['Salt Lake City', OTHER], 'Vermont': ['Burlington', OTHER],
      'Virginia': ['Virginia Beach', 'Richmond', 'Arlington', OTHER],
      'Washington': ['Seattle', 'Bellevue', 'Spokane', OTHER], 'Washington DC': ['Washington', OTHER],
      'West Virginia': ['Charleston', OTHER], 'Wisconsin': ['Milwaukee', 'Madison', OTHER],
      'Wyoming': ['Cheyenne', OTHER],
    },
  },
  {
    name: 'Canada', code: 'CA', dial: '+1', ccy: 'CAD', tier: 'Province',
    states: {
      'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', OTHER],
      'Quebec': ['Montreal', 'Quebec City', OTHER],
      'British Columbia': ['Vancouver', 'Surrey', 'Victoria', OTHER],
      'Alberta': ['Calgary', 'Edmonton', OTHER],
      'Manitoba': ['Winnipeg', OTHER], 'Saskatchewan': ['Saskatoon', 'Regina', OTHER],
      'Nova Scotia': ['Halifax', OTHER], 'New Brunswick': ['Moncton', OTHER],
    },
  },
  {
    name: 'Australia', code: 'AU', dial: '+61', ccy: 'AUD', tier: 'State',
    states: {
      'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', OTHER],
      'Victoria': ['Melbourne', 'Geelong', OTHER],
      'Queensland': ['Brisbane', 'Gold Coast', 'Cairns', OTHER],
      'Western Australia': ['Perth', OTHER], 'South Australia': ['Adelaide', OTHER],
      'Tasmania': ['Hobart', OTHER], 'Australian Capital Territory': ['Canberra', OTHER],
      'Northern Territory': ['Darwin', OTHER],
    },
  },
  {
    name: 'New Zealand', code: 'NZ', dial: '+64', ccy: 'AUD', tier: 'Region',
    states: { 'Auckland': ['Auckland', OTHER], 'Wellington': ['Wellington', OTHER], 'Canterbury': ['Christchurch', OTHER], 'Otago': ['Dunedin', 'Queenstown', OTHER] },
  },
  {
    name: 'South Africa', code: 'ZA', dial: '+27', ccy: 'ZAR', tier: 'Province',
    states: {
      'Gauteng': ['Johannesburg', 'Pretoria', 'Sandton', OTHER],
      'Western Cape': ['Cape Town', 'Stellenbosch', OTHER],
      'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', OTHER],
      'Eastern Cape': ['Gqeberha', 'East London', OTHER],
    },
  },
  {
    name: 'Germany', code: 'DE', dial: '+49', ccy: 'EUR', tier: 'State',
    states: { 'Bavaria': ['Munich', 'Nuremberg', OTHER], 'Berlin': ['Berlin', OTHER], 'Hesse': ['Frankfurt', OTHER], 'North Rhine-Westphalia': ['Cologne', 'Düsseldorf', OTHER], 'Hamburg': ['Hamburg', OTHER], 'Baden-Württemberg': ['Stuttgart', OTHER] },
  },
  {
    name: 'France', code: 'FR', dial: '+33', ccy: 'EUR', tier: 'Region',
    states: { 'Île-de-France': ['Paris', OTHER], "Provence-Alpes-Côte d'Azur": ['Marseille', 'Nice', OTHER], 'Auvergne-Rhône-Alpes': ['Lyon', OTHER], 'Occitanie': ['Toulouse', OTHER] },
  },
  {
    name: 'Netherlands', code: 'NL', dial: '+31', ccy: 'EUR', tier: 'Province',
    states: { 'North Holland': ['Amsterdam', OTHER], 'South Holland': ['Rotterdam', 'The Hague', OTHER], 'Utrecht': ['Utrecht', OTHER], 'North Brabant': ['Eindhoven', OTHER] },
  },
  {
    name: 'Spain', code: 'ES', dial: '+34', ccy: 'EUR', tier: 'Region',
    states: { 'Madrid': ['Madrid', OTHER], 'Catalonia': ['Barcelona', OTHER], 'Andalusia': ['Seville', 'Málaga', OTHER], 'Valencia': ['Valencia', OTHER] },
  },
  {
    name: 'Italy', code: 'IT', dial: '+39', ccy: 'EUR', tier: 'Region',
    states: { 'Lombardy': ['Milan', OTHER], 'Lazio': ['Rome', OTHER], 'Campania': ['Naples', OTHER], 'Veneto': ['Venice', 'Verona', OTHER] },
  },
  {
    name: 'Ireland', code: 'IE', dial: '+353', ccy: 'EUR', tier: 'County',
    states: { 'Dublin': ['Dublin', OTHER], 'Cork': ['Cork', OTHER], 'Galway': ['Galway', OTHER], 'Limerick': ['Limerick', OTHER] },
  },
  {
    name: 'Sri Lanka', code: 'LK', dial: '+94', ccy: 'USD', tier: 'Province',
    states: { 'Western': ['Colombo', 'Negombo', OTHER], 'Central': ['Kandy', OTHER], 'Southern': ['Galle', OTHER] },
  },
  {
    name: 'Nepal', code: 'NP', dial: '+977', ccy: 'USD', tier: 'Province',
    states: { 'Bagmati': ['Kathmandu', 'Lalitpur', OTHER], 'Gandaki': ['Pokhara', OTHER] },
  },
  {
    name: 'Bangladesh', code: 'BD', dial: '+880', ccy: 'USD', tier: 'Division',
    states: { 'Dhaka': ['Dhaka', OTHER], 'Chattogram': ['Chattogram', OTHER], 'Sylhet': ['Sylhet', OTHER] },
  },
  {
    name: 'Somewhere else', code: 'ZZ', dial: '+', ccy: 'USD', tier: 'Region',
    states: { 'Not listed': ['Not listed'] },
  },
]

export const byCode = (code: string) => COUNTRIES.find(c => c.code === code)

/** Every dialling code, deduplicated, for the phone prefix dropdown. */
export const DIAL_CODES = COUNTRIES
  .filter(c => c.dial !== '+')
  .map(c => ({ code: c.code, dial: c.dial, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

/* Display order only. The array above keeps its order (the timezone guess and the
 * cockpit's generated places.js depend on it); the dropdowns show the three main
 * markets first, every other country A to Z, and "Somewhere else" last. */
const PINNED_FIRST = ['IN', 'AE', 'US']
export const COUNTRIES_SHOWN: Country[] = [
  ...PINNED_FIRST.map(code => COUNTRIES.find(c => c.code === code)!).filter(Boolean),
  ...COUNTRIES.filter(c => !PINNED_FIRST.includes(c.code) && c.code !== 'ZZ')
    .sort((a, b) => a.name.localeCompare(b.name)),
  ...COUNTRIES.filter(c => c.code === 'ZZ'),
]

/** A country's states (emirates, provinces...) A to Z. */
export const statesOf = (c: Country) => Object.keys(c.states).sort((a, b) => a.localeCompare(b))
