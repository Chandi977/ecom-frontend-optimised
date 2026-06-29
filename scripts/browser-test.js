const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Capturing console logs...');
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });

  console.log('Capturing network requests...');
  page.on('request', request => {
    if (request.url().includes('api')) {
      console.log(`API REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('api')) {
      console.log(`API RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto('http://localhost:3000/corrugated-boxes', { waitUntil: 'networkidle' });
    console.log('Page loaded.');

    const title = await page.title();
    console.log('Page title:', title);

    const showingText = await page.locator('.showresulttext').innerText().catch(() => 'No result text found');
    console.log('Locator .showresulttext:', showingText);

    const noProductsText = await page.locator('.noProducts').innerText().catch(() => 'No noProducts text found');
    console.log('Locator .noProducts:', noProductsText);

  } catch (err) {
    console.error('Browser Test Error:', err.message);
  } finally {
    await browser.close();
  }
})();
