import puppeteer from "puppeteer-core";

const base = process.env.TARRA_BASE ?? "http://127.0.0.1:3456";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const shots = {
  desktop: "/tmp/tarra-desktop.png",
  mobile: "/tmp/tarra-mobile.png",
  imagery: "/tmp/tarra-imagery.png",
};

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const pageErrors = [];
const page = await browser.newPage();
page.on("pageerror", (error) => pageErrors.push(String(error)));

async function waitForScore() {
  await page.waitForSelector("[data-testid='risk-score']", { timeout: 20000 });
  await page.waitForFunction(() => {
    const el = document.querySelector("[data-testid='risk-score']");
    return el && el.textContent && el.textContent.trim() !== "—";
  }, { timeout: 20000 });
}

try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(base, { waitUntil: "networkidle2", timeout: 30000 });
  const disclaimer = await page.$eval("[data-testid='disclaimer']", (el) => el.textContent ?? "");
  if (!disclaimer.includes("should not be used as the sole basis")) {
    throw new Error("disclaimer missing");
  }
  await page.waitForSelector("[data-testid='map'] canvas", { timeout: 20000 });
  await waitForScore();
  const banner = await page.$eval("[data-testid='inference-banner']", (el) => el.textContent ?? "");
  if (!banner.includes("Simulated")) throw new Error(`expected simulated banner, got ${banner}`);
  const demoScore = await page.$eval("[data-testid='risk-score']", (el) => el.textContent?.trim());
  const demoLevel = await page.$eval("[data-testid='risk-level']", (el) => el.textContent?.trim());
  if (demoLevel !== "Critical") throw new Error(`demo level ${demoLevel}`);
  await page.screenshot({ path: shots.desktop, fullPage: false });

  await page.click("[data-testid='sample-bengaluru-reference']");
  await page.waitForFunction(() => {
    const level = document.querySelector("[data-testid='risk-level']")?.textContent ?? "";
    return level.includes("Low");
  }, { timeout: 20000 });

  await page.click("[data-testid='mode-live']");
  await page.waitForFunction(() => {
    const origin = document.querySelector("[data-testid='rainfall-origin']")?.textContent ?? "";
    const rain = document.querySelector("[data-testid='rainfall-value']")?.textContent ?? "";
    return origin.includes("Live data") && rain.includes("mm") && !rain.includes("578");
  }, { timeout: 25000 });
  const liveRain = await page.$eval("[data-testid='rainfall-value']", (el) => el.textContent ?? "");
  if (liveRain.includes("8.0 mm") && liveRain.includes("22.0 mm")) {
    throw new Error(`live view still shows the Bengaluru demo totals: ${liveRain}`);
  }
  const liveBanner = await page.$eval("[data-testid='inference-banner']", (el) => el.textContent ?? "");
  if (liveBanner.includes("578")) throw new Error("banner leaked a rainfall figure");

  await page.click("[data-testid='mode-demo']");
  await page.click("[data-testid='sample-wayanad-2024']");
  await page.waitForFunction(() => (document.querySelector("[data-testid='risk-level']")?.textContent ?? "").includes("Critical"), { timeout: 20000 });

  const box = await page.$eval("[data-testid='map']", (el) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x + rect.width * 0.72, y: rect.y + 80 };
  });
  const before = await page.$eval("[data-testid='coord-readout']", (el) => el.textContent);
  await page.mouse.click(box.x, box.y);
  await page.waitForFunction((previous) => {
    const now = document.querySelector("[data-testid='coord-readout']")?.textContent ?? "";
    return now && now !== previous;
  }, { timeout: 15000 }, before);

  await page.type("[data-testid='map-search']", "Jure");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const items = [...document.querySelectorAll("li button")];
    return items.some((item) => (item.textContent ?? "").includes("Jure"));
  }, { timeout: 20000 });

  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/sources`, { waitUntil: "networkidle2", timeout: 30000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) throw new Error(`mobile overflow ${overflow}px on sources`);
  await page.goto(`${base}/pipeline`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.goto(`${base}/alerts`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.goto(`${base}/imagery`, { waitUntil: "networkidle2", timeout: 30000 });
  const imageryOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (imageryOverflow > 2) throw new Error(`mobile overflow ${imageryOverflow}px on imagery`);
  await page.screenshot({ path: shots.imagery, fullPage: true });
  await page.goto(base, { waitUntil: "networkidle2", timeout: 30000 });
  await page.screenshot({ path: shots.mobile, fullPage: true });
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (homeOverflow > 2) throw new Error(`mobile overflow ${homeOverflow}px on home`);

  if (pageErrors.length) throw new Error(pageErrors.join("\n"));
  console.log(JSON.stringify({ ok: true, demoScore, demoLevel, liveRain, shots }, null, 2));
} finally {
  await browser.close();
}
