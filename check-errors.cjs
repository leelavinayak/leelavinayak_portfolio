const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('Page loaded successfully');

    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach(e => console.log(' - ' + e));
    } else {
      console.log('No console errors detected');
    }
  } catch (e) {
    console.log('Error loading page:', e.message);
  }

  await browser.close();
})();