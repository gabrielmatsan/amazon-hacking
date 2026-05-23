import { test, expect } from "@playwright/test";

const HOME_TITLES = {
  "pt-br": /Onde a Amazônia/i,
  en: /Where the Amazon/i,
  es: /Donde la Amazonía/i,
} as const;

const HOME_PATHS = {
  "pt-br": "/",
  en: "/en",
  es: "/es",
} as const;

for (const [locale, path] of Object.entries(HOME_PATHS) as Array<[
  keyof typeof HOME_PATHS,
  string,
]>) {
  test(`home loads in ${locale}`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: HOME_TITLES[locale], level: 1 }),
    ).toBeVisible();
  });
}

test("home renders all main sections", async ({ page }) => {
  await page.goto("/");
  for (const id of ["sobre", "moju", "eixos", "edicoes", "vencedores", "premios", "parceiros"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("home lists winners across multiple editions", async ({ page }) => {
  await page.goto("/#vencedores");
  await expect(page.getByRole("heading", { name: "2024" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2023" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2022" })).toBeVisible();
});

test("solutions stub page renders", async ({ page }) => {
  await page.goto("/solucoes");
  await expect(
    page.getByRole("heading", { level: 1, name: /Soluções/i }),
  ).toBeVisible();
});
