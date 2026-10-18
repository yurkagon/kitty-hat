import { expect, test, type Page } from "@playwright/test";

const addPlayer = async (
  page: Page,
  team: number,
  avatar: number,
  name?: string,
) => {
  await page
    .getByRole("button", {
      name: `Додати гравця в команду ${team}`,
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", {
      name: avatar === 1 ? "Хлопець" : avatar === 2 ? "Дівчина" : `Аватар ${avatar}`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  if (name !== undefined)
    await page
      .locator(".team-editor")
      .nth(team - 1)
      .locator(".player-input input")
      .last()
      .fill(name);
};

const configure = async (
  page: Page,
  timeout: "strict" | "confirm" = "confirm",
  captureSettings?: () => Promise<void>,
) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Почати гру", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Назва команди 1", exact: true })
    .fill("Лісові");
  await page
    .getByRole("textbox", { name: "Назва команди 2", exact: true })
    .fill("Медові");
  for (let team = 1; team <= 2; team++)
    for (let player = 1; player <= 2; player++) {
      await addPlayer(page, team, player);
      await page
        .getByRole("textbox", {
          name: `Ім’я гравця ${player}, команда ${team}`,
          exact: true,
        })
        .fill(["Оля", "Юра", "Іра", "Марко"][(team - 1) * 2 + player - 1]);
    }
  await page.getByRole("button", { name: "Далі — правила" }).click();
  for (let index = 0; index < 4; index++)
    await page
      .getByRole("button", { name: "Зменшити: Слів від гравця", exact: true })
      .click();
  for (let index = 0; index < 3; index++)
    await page
      .getByRole("button", { name: "Зменшити: Час на хід", exact: true })
      .click();
  if (timeout === "strict")
    await page.getByRole("radio", { name: /Сигнал — і крапка/ }).check();
  await captureSettings?.();
  await page.getByRole("button", { name: "Далі — загадуємо слова" }).click();
};

const enterWords = async (page: Page) => {
  for (const word of ["Лис", "Чайник", "Парасолька", "Місяць"]) {
    await page.getByRole("button", { name: "Це я, почнімо" }).click();
    await page
      .getByRole("textbox", { name: "Записка 1", exact: true })
      .fill(word);
    await page.getByRole("button", { name: "Сховати в капелюх" }).click();
    await expect(page.getByRole("textbox")).toHaveCount(0);
  }
};

const start = async (page: Page) => {
  await page.getByRole("button", { name: "Усе зрозуміло" }).click();
  await page.getByRole("button", { name: "Почати хід" }).click();
};

test("complete party, three rounds, results and replay", async ({ page }) => {
  await configure(page);
  await enterWords(page);
  for (let round = 0; round < 3; round++) {
    await start(page);
    await expect(page.locator(".word-slip > span")).toHaveText(
      [
        "Пояснюй своїй команді",
        "Показуй без слів і звуків",
        "Підкажи лише одним словом",
      ][round],
    );
    for (let word = 0; word < 4; word++)
      await page.getByRole("button", { name: /Вгадано/ }).click();
    await expect(
      page.getByRole("heading", { name: "Капелюх порожній!" }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: round === 2 ? "До результатів" : "До наступного раунду",
      })
      .click();
  }
  await expect(page.locator(".winner-row")).toContainText("Лісові");
  await expect(page.locator(".winner-row > b")).toHaveText("8");
  await page.getByRole("button", { name: "Зіграти ще" }).click();
  await expect(
    page.getByRole("textbox", { name: "Назва команди 1", exact: true }),
  ).toHaveValue("Лісові");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hat.game.v1")!),
  );
  expect(saved.words).toEqual([]);
  expect(
    saved.teams.every((team: { scores: number[] }) =>
      team.scores.every((score) => score === 0),
    ),
  ).toBe(true);
});

test("draft reload stays private and saved rules cannot change after start", async ({
  page,
}) => {
  await configure(page);
  await page.getByRole("button", { name: "Це я, почнімо" }).click();
  await page
    .getByRole("textbox", { name: "Записка 1", exact: true })
    .fill("Секретне слово");
  await page.reload();
  await page.getByRole("button", { name: "Продовжити гру" }).click();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Телефон у мене" }).click();
  await expect(
    page.getByRole("textbox", { name: "Записка 1", exact: true }),
  ).toHaveValue("Секретне слово");
  await page.getByRole("button", { name: "Сховати в капелюх" }).click();
  await expect(page.locator("main")).not.toContainText("Секретне слово");
  await expect(
    page.getByRole("heading", { name: "Юра", exact: true }),
  ).toBeVisible();
});

test("strict deadline, final ten-second sounds and reload do not add time", async ({
  page,
}) => {
  await configure(page, "strict");
  await enterWords(page);
  await page.clock.install();
  await page.evaluate(() => {
    const target = window as typeof window & { audioNotes: number };
    target.audioNotes = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      target.audioNotes++;
      return original.call(this);
    };
  });
  await start(page);
  await page.clock.fastForward(6000);
  await expect(page.getByRole("timer")).toHaveAttribute(
    "aria-label",
    "Залишилось 9 секунд",
  );
  expect(
    await page.evaluate(
      () => (window as typeof window & { audioNotes: number }).audioNotes,
    ),
  ).toBeGreaterThan(0);
  await page.clock.fastForward(10000);
  await expect(
    page.getByRole("heading", { name: "Гарний хід!" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Вгадано/ })).toHaveCount(0);
  const before = await page.evaluate(() => localStorage.getItem("hat.game.v1"));
  await page.reload();
  await page.getByRole("button", { name: "Продовжити гру" }).click();
  expect(await page.evaluate(() => localStorage.getItem("hat.game.v1"))).toBe(
    before,
  );
});

test("pause, privacy on return, one-time final word confirmation", async ({
  page,
}) => {
  await configure(page);
  await enterWords(page);
  await page.clock.install();
  await start(page);
  const word = await page.locator(".word-slip h1").innerText();
  await page.clock.fastForward(3000);
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await expect(page.locator(".word-slip")).toHaveCount(0);
  await page.clock.fastForward(60000);
  await page.getByRole("button", { name: "Продовжити хід" }).click();
  await expect(page.locator(".word-slip h1")).toHaveText(word);
  await expect(page.getByRole("timer")).toHaveAttribute(
    "aria-label",
    "Залишилось 12 секунд",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".word-slip")).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.getByRole("button", { name: "Телефон у мене" }).click();
  await page.clock.fastForward(13000);
  await page.getByRole("button", { name: "Так, встигли!" }).click();
  await expect(page.locator(".earned-score")).toContainText("+1");
  await expect(page.getByRole("button", { name: "Так, встигли!" })).toHaveCount(
    0,
  );
});

test("blocked storage still permits a complete setup", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  });
  await configure(page);
  await expect(page.getByRole("status")).toContainText(
    "Браузер не дозволяє зберегти гру",
  );
  await expect(
    page.getByRole("button", { name: "Це я, почнімо" }),
  ).toBeVisible();
});

test("phone access over local HTTP works without secure-context UUID support", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", { value: undefined });
  });
  await configure(page);
  await enterWords(page);
  await start(page);
  await expect(page.locator(".word-slip")).toBeVisible();
});

test("empty teams, suggested and custom names, modal cancellation and removal persist", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Почати гру", exact: true }).click();
  await expect(page.locator(".player-input")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Далі — правила" }),
  ).toBeDisabled();
  const preset = page.getByRole("combobox", {
    name: "Готова назва команди 1",
    exact: true,
  });
  await expect(preset.locator("option")).toHaveText([
    "Власна назва",
    "Половина помідора",
    "Діти Новосельцевих",
    "Хата на Татача",
    "D.Seniors",
    "Це комісія",
  ]);
  await preset.selectOption("Половина помідора");
  await expect(
    page.getByRole("textbox", { name: "Назва команди 1", exact: true }),
  ).toHaveValue("Половина помідора");
  await page
    .getByRole("textbox", { name: "Назва команди 2", exact: true })
    .fill("Своя команда");
  await page.reload();
  await page.getByRole("button", { name: "Продовжити гру" }).click();
  await expect(preset).toHaveValue("Половина помідора");
  await expect(
    page.getByRole("textbox", { name: "Назва команди 2", exact: true }),
  ).toHaveValue("Своя команда");
  const addButton = page.getByRole("button", {
    name: "Додати гравця в команду 1",
    exact: true,
  });
  await addButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(addButton).toBeFocused();
  await expect(page.locator(".player-input")).toHaveCount(0);
  await addButton.press("Enter");
  await expect(
    page.getByRole("button", { name: "Закрити", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".person-options button span")).toHaveText([
    "Хлопець",
    "Дівчина",
  ]);
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Хлопець", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("textbox", {
      name: "Ім’я гравця 1, команда 1",
      exact: true,
    }),
  ).toHaveValue("");
  await page
    .getByRole("button", { name: "Видалити гравця 1, команда 1", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Продовжити гру" }).click();
  await expect(page.locator(".player-input")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Додати команду", exact: true })
    .click();
  await expect(
    page.locator(".team-editor").last().locator(".player-input"),
  ).toHaveCount(0);
});

for (const { name, avatar, choice } of [
  { name: "Андрій", avatar: "cat-andrii", choice: 5 },
  { name: "Назар", avatar: "cat-nazar", choice: 6 },
  { name: "Артур", avatar: "cat-artur", choice: 7 },
  { name: "Юра", avatar: "cat-yura", choice: 8 },
  { name: "Ілона", avatar: "cat-ilona", choice: 9 },
]) {
  test(`${name}: catalog selection, editable name, restore and playing portrait`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Почати гру", exact: true }).click();
    await expect(
      page.getByText("Талісман команди", { exact: true }),
    ).toHaveCount(0);
    await addPlayer(page, 1, choice);
    const firstName = page.getByRole("textbox", {
      name: "Ім’я гравця 1, команда 1",
      exact: true,
    });
    await expect(firstName).toHaveValue(name);
    await firstName.fill(`${name} у грі`);
    await expect(page.locator(".player-input img").first()).toHaveAttribute(
      "src",
      new RegExp(`${avatar}.*\\.webp`),
    );
    await page.reload();
    await page.getByRole("button", { name: "Продовжити гру" }).click();
    await expect(page.locator(".player-input img").first()).toHaveAttribute(
      "src",
      new RegExp(`${avatar}.*\\.webp`),
    );
    await expect(firstName).toHaveValue(`${name} у грі`);
    await addPlayer(page, 1, 1, "Гравець 2");
    await addPlayer(page, 2, 1, "Гравець 3");
    await addPlayer(page, 2, 2, "Гравець 4");
    await page
      .getByRole("button", {
        name: "Змінити аватар гравця 2, команда 2",
        exact: true,
      })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Хлопець", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", {
        name: "Ім’я гравця 2, команда 2",
        exact: true,
      }),
    ).toHaveValue("Гравець 4");
    await expect(firstName).toHaveValue(`${name} у грі`);
    await page.getByRole("button", { name: "Далі — правила" }).click();
    for (let index = 0; index < 4; index++)
      await page
        .getByRole("button", { name: "Зменшити: Слів від гравця", exact: true })
        .click();
    await page.getByRole("button", { name: "Далі — загадуємо слова" }).click();
    await expect(page.locator(".handoff-avatar")).toHaveAttribute(
      "src",
      new RegExp(`${avatar}.*\\.webp`),
    );
    await enterWords(page);
    await page.getByRole("button", { name: "Усе зрозуміло" }).click();
    await expect(page.locator(".handoff-avatar")).toHaveAttribute(
      "src",
      new RegExp(`${avatar}.*\\.webp`),
    );
    await page.getByRole("button", { name: "Почати хід" }).click();
    await expect(page.locator(".play-heading img")).toHaveAttribute(
      "src",
      new RegExp(`${avatar}.*\\.webp`),
    );
    await expect(page.locator(".play-heading")).toContainText(`${name} у грі`);
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator(".play-heading img")
      .evaluate((image) => (image as HTMLImageElement).decode());
    await page.screenshot({
      path: `.impeccable/review/${avatar}-playing-mobile.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Пауза", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: "Продовжити гру" }).click();
    await expect(page.locator(".handoff-avatar")).toHaveAttribute(
      "src",
      new RegExp(`${avatar}.*\\.webp`),
    );
  });
}

test("visual evidence across mobile and desktop screens", async ({ page }) => {
  const capture = async (name: string) => {
    await page.evaluate(() => document.fonts.ready);
    await page.locator("img").evaluateAll(async (images) => {
      await Promise.all(
        images.map((image) =>
          image instanceof HTMLImageElement
            ? image.decode().catch(() => undefined)
            : undefined,
        ),
      );
    });
    await page.screenshot({
      path: `.impeccable/review/${name}.png`,
      fullPage: (await page.getByRole("dialog").count()) === 0,
      animations: "disabled",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  };
  await page.goto("/");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture("desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("mobile");
  await configure(page, "confirm", () => capture("settings-mobile"));
  await enterWords(page);
  await capture("round-mobile");
  await page.clock.install();
  for (let round = 0; round < 3; round++) {
    await start(page);
    if (round === 0) {
      await capture("playing-mobile");
      await page.setViewportSize({ width: 1440, height: 1000 });
      await capture("playing-desktop");
      await page.setViewportSize({ width: 320, height: 740 });
      await capture("playing-320");
      await page.setViewportSize({ width: 430, height: 932 });
      await capture("playing-430");
      await page.setViewportSize({ width: 390, height: 844 });
    }
    if (round > 0) await capture(`playing-round${round + 1}-mobile`);
    for (let word = 0; word < 4; word++)
      await page.getByRole("button", { name: /Вгадано/ }).click();
    if (round === 0) await capture("summary-mobile");
    await page
      .getByRole("button", {
        name: round === 2 ? "До результатів" : "До наступного раунду",
      })
      .click();
  }
  await capture("finished-mobile");
  await page.getByRole("button", { name: "Зіграти ще" }).click();
  await capture("teams-mobile");
  await page.setViewportSize({ width: 320, height: 740 });
  await page
    .getByRole("button", {
      name: "Змінити аватар гравця 1, команда 1",
      exact: true,
    })
    .click();
  await capture("teams-320");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture("teams-desktop");
  await page.getByRole("button", { name: "Закрити", exact: true }).click();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Почати гру", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("empty-teams-mobile");
  await page.setViewportSize({ width: 320, height: 740 });
  await capture("empty-teams-320");
  await page
    .getByRole("button", { name: "Додати гравця в команду 1", exact: true })
    .click();
  await capture("persons-320");
  const lastChoice = page
    .getByRole("dialog")
    .getByRole("button", { name: "Аватар 9", exact: true });
  await lastChoice.scrollIntoViewIfNeeded();
  await expect(lastChoice).toBeInViewport();
  await capture("persons-bottom-320");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("dialog").evaluate((dialog) => {
    dialog.scrollTop = 0;
  });
  await expect(lastChoice).toBeInViewport();
  await capture("persons-desktop");
});
