import { expect, test } from '@playwright/test'

test('Hugeicons stay readable and controls fit narrow and intermediate screens', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.locator('article.post').first()).toBeVisible()
  for (const width of [320, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    await expect(page.locator('.menu')).toBeVisible({ visible: width <= 800 })
    const icon = page.locator('.post footer .ui-icon').first()
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(await icon.locator('path').first().evaluate(el => getComputedStyle(el).vectorEffect)).toBe('non-scaling-stroke')
    const bounds = await page.locator('.post footer button').first().boundingBox()
    expect(bounds.width).toBeGreaterThanOrEqual(44)
    expect(bounds.height).toBeGreaterThanOrEqual(44)
    if (testInfo.project.name === 'desktop' && [320, 1024].includes(width)) {
      await page.screenshot({ path: `artifacts/screenshots/fanbbs-width-${width}.png`, animations: 'disabled' })
    }
  }
})
