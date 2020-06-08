const puppeteer = require('puppeteer');
const main = async () => {
  const wsChromeEndpoint = 'ws://127.0.0.1:9222/devtools/browser/17394a1d-27bf-4613-b77d-4806e3f0b1e1';
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsChromeEndpoint,
  });
  const page = await browser.newPage();
  const URL = 'https://www.easports.com/fifa/ultimate-team/web-app';
  await page.goto(URL, {waitUntil: "networkidle0"});

  // Get the current coins and store them.
  const getCoins = async () => {
    return await page.evaluate(() => {
      return services.User.getUser().coins.amount;
    });
  };

  const goToMarketAndSearch = async () => {
    // Open the transfer tab.
    await page.waitFor(8000);
    await page.waitForSelector('.icon-transfer');
    await page.click('.icon-transfer');

    // Open the search market.
    await page.waitForSelector('.ut-tile-transfer-market');
    await page.waitFor(1000);
    await page.click('.ut-tile-transfer-market');

    // Select consumables.
    await page.waitForSelector('div.ut-navigation-container-view--content > div > div.tab-menu > div > a:nth-child(4)');
    await page.waitFor(1000);
    await page.click('div.ut-navigation-container-view--content > div > div.tab-menu > div > a:nth-child(4)');

    // Set price filters.
    await page.waitFor(1000);
    await page.focus('div.search-prices > div:nth-child(5) > div.ut-numeric-input-spinner-control > input');
    await page.keyboard.press('Backspace');
    await page.type('div.search-prices > div:nth-child(5) > div.ut-numeric-input-spinner-control > input', '1000');
    await page.waitFor(500);
    await page.focus('div.search-prices > div:nth-child(6) > div.ut-numeric-input-spinner-control > input');
    await page.keyboard.press('Backspace');
    await page.type('div.search-prices > div:nth-child(6) > div.ut-numeric-input-spinner-control > input', '1500');
    await page.waitFor(500);

    // Select consume type.
    await page.click('.ut-search-filter-control:nth-child(2)');
    await page.waitForSelector('.inline-list-select> div > ul > li:nth-child(7)');
    await page.waitFor(500);
    await page.click('.inline-list-select> div > ul > li:nth-child(7)');
    await page.waitFor(500);

    // Select quality.
    await page.click('.ut-search-filter-control:nth-child(3)');
    await page.waitForSelector('.inline-list-select> div > ul > li:nth-child(4)');
    await page.waitFor(500);
    await page.click('.inline-list-select> div > ul > li:nth-child(4)');
    await page.waitFor(500);

    // Click search button.
    await page.click('.call-to-action');
  };

  const tryToBuy = async() => {
    if (itemsBought > 4) {
      await storeBought();
      return;
    }

    // Search for Squad Fitness elements.
    await page.waitFor(1000);
    const items = await page.evaluate(() => {
      let array = [];
      const nodes = document.querySelectorAll('.listFUTItem');
      for (let i = 0; i < nodes.length; i++) {

        if (nodes[i].innerText.includes('Squad Fitness')) {
          array.push(i);
        }
      }
      return array;
    });

    // Try to buy all squad elements.
    for (const elIndex of items) {
      await page.click(`.SearchResults.ui-layout-left > div > ul > li:nth-child(${elIndex + 1})`);
      await page.waitFor(500);
      await page.waitForSelector('.buyButton');
      await page.click('.buyButton');
      await page.waitFor(500);
      await page.waitForSelector('.form-modal > section > div > div > button:nth-child(1) > span.btn-text');
      await page.click('.form-modal > section > div > div > button:nth-child(1) > span.btn-text');
      await page.waitFor(1000);
      let newCoins = await getCoins();
      if (coins > newCoins) {
        coins = newCoins;
        itemsBought++;
        if (itemsBought > 4) {
          await storeBought();
          return;
        }
      }
    }

    // Click next if exists.
    try {
      await page.waitForSelector('.pagination.next', {timeout: 2000});
      await page.click('.pagination.next');
    } catch (e) {
      await page.waitFor(3000);
      await goToMarketAndSearch();
      await tryToBuy();
      return;
    }
    await page.waitFor(3000);
    await tryToBuy();
  };

  const storeBought = async () => {
    await page.waitFor(2000);
    await page.click('.icon-home');
    await page.waitFor(4000);
    await page.click('.ut-unassigned-tile-view');
    await page.waitFor(2000);
    await page.click('.mini');
    main().then();
    return false;
  };

  await page.waitForSelector('.icon-transfer');
  var itemsBought = 0;
  var coins = await getCoins();
  await goToMarketAndSearch();
  await tryToBuy();

};

main().then();
