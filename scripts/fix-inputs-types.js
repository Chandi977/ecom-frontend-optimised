const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../pages/checkoutpage/index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target1 = 'const [cart, setCart] = useState(null);';
const replacement1 = 'const [cart, setCart] = useState<any>(null);';

const target2 = 'const [address, setAddress] = useState(null);';
const replacement2 = 'const [address, setAddress] = useState<any>(null);';

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed cart/address state types in checkoutpage/index.tsx');
