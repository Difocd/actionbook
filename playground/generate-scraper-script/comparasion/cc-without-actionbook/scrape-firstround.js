const { chromium } = require("playwright");
const fs = require("fs");

async function scrapeFirstRoundCompanies() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const allCompanies = new Map(); // Use Map to deduplicate by name

  // First scrape the main page
  console.log("Navigating to FirstRound companies page...");
  await page.goto("https://firstround.com/companies", {
    waitUntil: "networkidle",
  });

  // Scroll to load all content
  console.log("Scrolling to load all content...");
  let prevHeight = 0;
  for (let i = 0; i < 15; i++) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currentHeight === prevHeight) break;
    prevHeight = currentHeight;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  }

  // Extract companies from the main page
  console.log("Extracting company data from main page...");
  let companies = await extractCompanies(page);
  companies.forEach((company) => {
    if (!allCompanies.has(company.name)) {
      allCompanies.set(company.name, company);
    }
  });
  console.log(`Found ${companies.length} companies on main page`);

  // Also get list of all company links to visit individual pages
  const companyLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href^="/companies/"]');
    return [...new Set(Array.from(links).map((a) => a.getAttribute("href")))]
      .filter((href) => href !== "/companies" && href !== "/companies/")
      .map((href) => "https://firstround.com" + href);
  });

  console.log(`Found ${companyLinks.length} company detail page links`);

  // Visit each company detail page to get full data
  for (let i = 0; i < companyLinks.length; i++) {
    const url = companyLinks[i];
    const companySlug = url.split("/companies/")[1];

    // Skip if we already have this company with complete data
    const existingCompany = Array.from(allCompanies.values()).find(
      (c) => c.name.toLowerCase().replace(/\s+/g, "-") === companySlug
    );
    if (existingCompany && existingCompany.founders) {
      continue;
    }

    console.log(`Scraping company detail page (${i + 1}/${companyLinks.length}): ${companySlug}`);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const companyData = await page.evaluate(() => {
        // Try to extract data from company detail page
        const name =
          document.querySelector("h1")?.textContent?.trim() ||
          document.querySelector(".company-hero__name")?.textContent?.trim() ||
          "";

        const description =
          document.querySelector(".company-hero__statement")?.textContent?.trim() ||
          document.querySelector('[class*="statement"]')?.textContent?.trim() ||
          "";

        // Get info from the detail page
        const infoData = {};
        const infoItems = document.querySelectorAll(
          ".company-info__item, .company-list-company-info__item, [class*='info__item']"
        );
        infoItems.forEach((item) => {
          const label = item.querySelector("[class*='label']")?.textContent?.trim();
          const value = item.querySelector("[class*='value']")?.textContent?.trim();
          if (label && value) {
            infoData[label.replace(":", "")] = value;
          }
        });

        return {
          name,
          description,
          categories: infoData["Categories"] || infoData["Category"] || "",
          founders: infoData["Founders"] || infoData["Founder"] || "",
          initialPartnership: infoData["Initial Partnership"] || "",
          partner: infoData["Partner"] || infoData["Partners"] || "",
          location: infoData["Location"] || "",
        };
      });

      if (companyData.name && !allCompanies.has(companyData.name)) {
        allCompanies.set(companyData.name, companyData);
      }
    } catch (e) {
      console.log(`  Error scraping ${companySlug}: ${e.message.substring(0, 50)}`);
    }
  }

  await browser.close();

  const companiesArray = Array.from(allCompanies.values());

  if (companiesArray.length > 0) {
    console.log(`\nTotal unique companies found: ${companiesArray.length}`);

    // Process the data to convert string fields to arrays where appropriate
    const processedCompanies = companiesArray.map((company) => ({
      name: company.name,
      description: company.description,
      categories: company.categories
        ? company.categories.split("/").map((c) => c.trim())
        : [],
      founders: company.founders
        ? company.founders.split(",").map((f) => f.trim())
        : [],
      initialPartnership: company.initialPartnership,
      partner: company.partner
        ? company.partner.split(",").map((p) => p.trim())
        : [],
      location: company.location,
    }));

    // Save to JSON file
    const outputPath = "./firstround-companies.json";
    fs.writeFileSync(outputPath, JSON.stringify(processedCompanies, null, 2));
    console.log(`Data saved to ${outputPath}`);

    return processedCompanies;
  } else {
    console.log("No companies found");
    return [];
  }
}

async function extractCompanies(page) {
  return await page.evaluate(() => {
    const results = [];
    const seenNames = new Set();
    const cards = document.querySelectorAll(".company-list-card-medium-large");

    cards.forEach((card) => {
      const nameEl = card.querySelector(".company-list-card-medium-large__name");
      const statementEl = card.querySelector(".company-list-card-medium-large__statement");

      if (!nameEl) return;

      const name = nameEl.textContent?.trim() || "";
      if (!name || seenNames.has(name)) return;
      seenNames.add(name);

      const infoItems = card.querySelectorAll(".company-list-company-info__item");
      const infoData = {};
      infoItems.forEach((item) => {
        const label = item.querySelector(".company-list-company-info__label")?.textContent?.trim();
        const value = item.querySelector(".company-list-company-info__value")?.textContent?.trim();
        if (label && value) {
          infoData[label.replace(":", "")] = value;
        }
      });

      results.push({
        name,
        description: statementEl?.textContent?.trim() || "",
        categories: infoData["Categories"] || infoData["Category"] || "",
        founders: infoData["Founders"] || infoData["Founder"] || "",
        initialPartnership: infoData["Initial Partnership"] || "",
        partner: infoData["Partner"] || infoData["Partners"] || "",
        location: infoData["Location"] || "",
      });
    });

    return results;
  });
}

// Run the scraper
scrapeFirstRoundCompanies()
  .then((companies) => {
    console.log("\nSample company data:");
    if (companies.length > 0) {
      console.log(JSON.stringify(companies[0], null, 2));
    }
    console.log(`\nTotal companies scraped: ${companies.length}`);
  })
  .catch((error) => {
    console.error("Scraping failed:", error);
    process.exit(1);
  });
