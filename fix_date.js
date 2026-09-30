const fs = require('fs');
const file = 'src/components/BookingManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add helper function
const helper = `const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return \`\${y}-\${m}-\${d}\`;
};

export default function BookingManagement`;
content = content.replace('export default function BookingManagement', helper);

// Fix initial state
content = content.replace(
  `const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);`,
  `const [selectedDate, setSelectedDate] = useState<string>(toLocalDateString(new Date()));`
);

// Fix fetch boundaries
content = content.replace(
  `const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];`,
  `const startOfMonth = toLocalDateString(new Date(year, month, 1));`
);
content = content.replace(
  `const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];`,
  `const endOfMonth = toLocalDateString(new Date(year, month + 1, 0));`
);

// Fix calendar render
content = content.replace(
  `const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];`,
  `const isoString = toLocalDateString(new Date(year, month, day));`
);
// There are two occurrences of this in the file, we should replace globally.
content = content.replace(
  /const isoString = new Date\(d\.getTime\(\) - \(d\.getTimezoneOffset\(\) \* 60000\)\)\.toISOString\(\)\.split\('T'\)\[0\];/g,
  `const isoString = toLocalDateString(d);`
);

// Ah wait, the first one was in selectDate:
//   const selectDate = (day: number) => {
//     const d = new Date(year, month, day);
//     // YYYY-MM-DD
//     const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

// The second was in calendar render:
//                 const day = i + 1;
//                 const d = new Date(year, month, day);
//                 const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
//                 const isSelected = isoString === selectedDate;
//                 const isToday = isoString === new Date().toISOString().split('T')[0];

content = content.replace(
  `const isToday = isoString === new Date().toISOString().split('T')[0];`,
  `const isToday = isoString === toLocalDateString(new Date());`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Date issues fixed');
