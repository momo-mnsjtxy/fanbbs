import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

// Real Chromium screenshots of the Vue app against the disposable Go/SQLite API.
// No intercepted responses, static mockups, or generated screenshot images.
test('capture real responsive community screens', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const output = path.resolve('artifacts/screenshots')
  await mkdir(output, { recursive: true })
  await page.goto('/')
  await expect(page.locator('article.post').first()).toBeVisible()
  await expect(page.getByText('后端暂不可用', { exact: false })).toHaveCount(0)
  await expect(page.locator('#feed-results')).toHaveAttribute('aria-busy', 'false')
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: path.join(output, `fanbbs-home-${testInfo.project.name}.png`), fullPage: true, animations: 'disabled' })
  await page.screenshot({ path: path.join(output, `fanbbs-viewport-${testInfo.project.name}.png`), animations: 'disabled' })

  if (mobile) {
    await page.getByRole('button', { name: '打开菜单' }).click()
    await expect(page.locator('.rail.is-open')).toBeVisible()
    await page.screenshot({ path: path.join(output, 'fanbbs-mobile-menu.png'), animations: 'disabled' })
    await page.getByRole('button', { name: '关闭菜单' }).click()
    await expect(page.locator('.rail.is-open')).toHaveCount(0)
  }

  await page.locator('article.post .post-content').first().click()
  await expect(page.locator('.detail-title')).toBeVisible()
  await expect(page.locator('.route-loading')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '登录后回复' })).toBeVisible()
  await page.screenshot({ path: path.join(output, `fanbbs-detail-${testInfo.project.name}.png`), fullPage: true, animations: 'disabled' })
  expect(errors).toEqual([])
})
