import { expect, test } from "@playwright/test";

test("installed app caches its assets and resumes a saved game offline", async ({ page, context }) => {
  await page.goto("/");
  const manifestPath = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = await (await page.request.get(manifestPath!)).json();
  expect(manifest).toMatchObject({
    id: "/",
    short_name: "Капелюх",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "uk",
  });
  expect(manifest.icons).toContainEqual({
    src: "/icons/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await page.getByRole("button", { name: "Почати гру", exact: true }).click();
  await page.getByRole("textbox", { name: "Назва команди 1", exact: true }).fill("Офлайн-команда");
  await page.getByRole("button", { name: "Додати гравця в команду 1", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^Віка, аватар/ }).click();
  await expect(page.getByRole("textbox", { name: "Ім’я гравця 1, команда 1", exact: true })).toHaveValue("Віка");
  const savedGame = await page.evaluate(() => localStorage.getItem("hat.game.v1"));
  expect(savedGame).not.toBeNull();

  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Продовжити гру", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Назва команди 1", exact: true })).toHaveValue("Офлайн-команда");
  await expect(page.getByRole("textbox", { name: "Ім’я гравця 1, команда 1", exact: true })).toHaveValue("Віка");
  expect(await page.evaluate(() => localStorage.getItem("hat.game.v1"))).toBe(savedGame);

  await page.getByRole("button", { name: "Додати гравця в команду 2", exact: true }).click();
  await expect.poll(() => page.getByRole("dialog").locator("img").evaluateAll(
    (images) => images.length > 0 && images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
  )).toBe(true);
  const offlineAssets = await page.evaluate(async () => {
    const paths = [
      "/art/hat.webp", "/art/victory.webp",
      "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png",
      "/icons/apple-touch-icon.png", "/icons/favicon-32.png",
      "/fonts/comfortaa-bold.ttf", "/fonts/nunito-regular.ttf", "/fonts/nunito-bold.ttf",
      "/manifest.webmanifest",
    ];
    return Promise.all(paths.map(async (path) => (await fetch(path)).ok));
  });
  expect(offlineAssets.every(Boolean)).toBe(true);
});
