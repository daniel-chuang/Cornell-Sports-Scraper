const puppeteer = require("puppeteer");

async function scrapeData() {
  try {
    // Launch the browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the page
    const url =
      "https://cornellbigred.com/sports/mens-ice-hockey/schedule/2024-25";
    await page.goto(url, { waitUntil: "networkidle2" });

    // Function to scroll down and wait for content to load
    const autoScroll = async (page) => {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 200; // Scroll by 100px increments
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= document.body.scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 200); // Scroll every 200ms
        });
      });
    };

    // Scroll down to load all the games
    await autoScroll(page);

    // Scrape the image sources and alt texts
    const scrapedData = await page.evaluate(() => {
      let data = [];
      document
        .querySelectorAll(".sidearm-schedule-game-opponent-logo.noprint img")
        .forEach((img) => {
          const src = img.getAttribute("src");
          const alt = img.getAttribute("alt");
          if (src && alt) {
            data.push({ src, alt });
          }
        });
      return data;
    });

    console.log(scrapedData); // Output the scraped data

    // Close the browser
    await browser.close();
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

scrapeData();
