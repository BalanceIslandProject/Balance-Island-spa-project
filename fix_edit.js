const fs = require('fs');
const file = 'src/components/BookingManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `if (['treatment', 'duration', 'pax', 'therapists'].includes(field) && !isEditing) {`,
  `if (['treatment', 'duration', 'pax', 'therapists'].includes(field)) {`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Edit recalculation fixed');
