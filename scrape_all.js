// Imports
const puppeteer = require("puppeteer");
const fs = require("fs");

// Main Function
async function scrapeData() {
  try {
    // URL as argument
    const url =
      process.argv[2] ||
      "https://cornellbigred.com/sports/mens-basketball/schedule";

    // Launch browser + open page
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scroll down for the lazyload
    const autoScroll = async (page) => {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 200; // Unit: PX
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= document.body.scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 200); // Unit: MS
        });
      });
    };
    await autoScroll(page);
    const title = await page.title(); // <-- Getting the title here

    // Data scraping
    const scrapedData = await page.evaluate(() => {
      let data = [];

      // Row
      document.querySelectorAll(".sidearm-schedule-game-row").forEach((row) => {
        let entry = {};

        // Date + Opponent
        const spanElements = row.querySelectorAll("span");
        const dateElement = spanElements[0];
        if (dateElement) {
          entry["date"] = dateElement.textContent;
        }
        const timeElement = spanElements[1];
        if (timeElement) {
          entry["time"] = timeElement.textContent;
        }

        // Location + City
        const locationElement = row.querySelector(
          ".sidearm-schedule-game-location"
        );
        if (locationElement) {
          let locationText = locationElement.textContent;
          let trimmedLocation = locationText
            .split("\n")
            .map((line) => line.trim()) // Trim each line
            .filter((line) => line.length > 0) // Remove empty lines
            .join(", "); // Join the remaining lines
          entry["location"] = trimmedLocation;
        }

        const cityElement = row.querySelector(".sidearm-schedule-game-city");
        const city = cityElement ? cityElement.textContent : null;
        if (cityElement) {
          entry["city"] = city.trim();
        }

        // Game type
        const gameTypeElement = row.querySelector(
          ".sidearm-schedule-game-promotion-name"
        );
        if (gameTypeElement) {
          let gameText = gameTypeElement.textContent;
          let trimmedGameText = gameText
            .split("\n")
            .map((line) => line.trim()) // Trim each line
            .filter((line) => line.length > 0) // Remove empty lines
            .join(", "); // Join the remaining lines
          entry["gameType"] = trimmedGameText;
        }

        // Logo
        const logoElement = row.querySelector(
          ".sidearm-schedule-game-opponent-logo img"
        );

        if (logoElement) {
          const src =
            logoElement.getAttribute("data-src") ||
            logoElement.getAttribute("src");
          const alt = logoElement.getAttribute("alt");
          entry["alt"] = alt;
          entry["src"] = src;
        }

        // Append data
        data.push(entry);
      });
      return data;
    });

    // Info for title and date
    let today = new Date();
    let formattedDate = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;

    // Write
    fs.writeFileSync(
      `${title} - ${formattedDate}.json`,
      JSON.stringify(scrapedData, null, 2),
      "utf-8"
    );

    // Close the browser
    await browser.close();
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

//// https://dxbhsrqyrr690.cloudfront.net/sidearm.nextgen.sites/cornellbigred.com/
scrapeData();
