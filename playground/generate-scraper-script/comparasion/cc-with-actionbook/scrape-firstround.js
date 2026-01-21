const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeFirstRoundCompanies() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Navigating to FirstRound companies page...');
  await page.goto('https://www.firstround.com/companies?category=all', {
    waitUntil: 'networkidle'
  });

  // Wait for company cards to load
  await page.waitForSelector('div.company-list-card-small', { timeout: 30000 });

  // Scroll to load all companies (lazy loading)
  console.log('Scrolling to load all companies...');
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);

  while (previousHeight !== currentHeight) {
    previousHeight = currentHeight;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    currentHeight = await page.evaluate(() => document.body.scrollHeight);
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Get all company cards
  const cards = await page.locator('div.company-list-card-small').all();
  console.log(`Found ${cards.length} companies`);

  const companies = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    try {
      // Get basic info (name and description) before expanding
      const name = await card.locator('div.company-list-card-small__button-name').textContent();
      const descriptionEl = await card.locator('div.company-list-card-small__button-statement').textContent();
      const description = descriptionEl?.replace(/Imagine if\s*/i, '').trim() || '';

      // Scroll card into view
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);

      // Click to expand the card
      const expandButton = card.locator('button.company-list-card-small__button');
      await expandButton.click();

      // Wait for expansion
      await page.waitForTimeout(300);

      // Extract details from expanded card
      const companyData = {
        name: name?.trim() || '',
        description: description,
        categories: '',
        founders: '',
        initialPartnership: '',
        partner: '',
        location: ''
      };

      // Get all info items from the expanded details
      const infoItems = await card.locator('div.company-list-company-info__item').all();

      for (const item of infoItems) {
        const label = await item.locator('dt').textContent();
        const value = await item.locator('dd').textContent();

        const labelLower = label?.toLowerCase().trim() || '';
        const valueText = value?.trim() || '';

        if (labelLower.includes('founder')) {
          companyData.founders = valueText;
        } else if (labelLower.includes('initial partnership')) {
          companyData.initialPartnership = valueText;
        } else if (labelLower.includes('categor')) {
          companyData.categories = valueText;
        } else if (labelLower.includes('partner') && !labelLower.includes('initial')) {
          companyData.partner = valueText;
        } else if (labelLower.includes('location')) {
          companyData.location = valueText;
        }
      }

      companies.push(companyData);

      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1}/${cards.length} companies`);
      }

      // Click again to collapse (optional, helps with performance)
      await expandButton.click();
      await page.waitForTimeout(100);

    } catch (error) {
      console.error(`Error processing company ${i + 1}:`, error.message);
    }
  }

  await browser.close();

  // Save to JSON file
  const outputPath = 'firstround-companies.json';
  fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2));
  console.log(`\nSaved ${companies.length} companies to ${outputPath}`);

  return companies;
}

scrapeFirstRoundCompanies()
  .then(() => console.log('Scraping complete!'))
  .catch(console.error);
