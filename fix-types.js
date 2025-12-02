const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/ServiceDetailsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Update type to allow undefined
content = content.replace(
  'const [selectedMenuOptions, setSelectedMenuOptions] = useState<{ [key: string]: string | string[] }>({})',
  'const [selectedMenuOptions, setSelectedMenuOptions] = useState<{ [key: string]: string | string[] | undefined }>({})'
);

// Fix 2: Fix boolean handler - use regex to find and replace
const booleanRegex = /onChange=\{\(e\) => \s*setSelectedMenuOptions\(\{\s*\.\.\.selectedMenuOptions,\s*\[param\.name\]:\s*e\.target\.checked\s*\?\s*'true'\s*:\s*undefined\s*\}\)\s*\}/g;
const newBooleanHandler = `onChange={(e) => {
                              const updated = { ...selectedMenuOptions }
                              if (e.target.checked) {
                                updated[param.name] = 'true'
                              } else {
                                delete updated[param.name]
                              }
                              setSelectedMenuOptions(updated)
                            }}`;

content = content.replace(booleanRegex, newBooleanHandler);

// Fix 3: Cast array in multi_select - find and replace the specific line
content = content.replace(
  'const current = selectedMenuOptions[param.name] || []',
  'const current = (selectedMenuOptions[param.name] as string[]) || []'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed TypeScript errors');
