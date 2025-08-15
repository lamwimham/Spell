module.exports = {
  '*.{js,jsx,ts,tsx}': ['npm run lint:fix', 'npm run format'],
  '*.{json,md}': ['npm run format'],
};
