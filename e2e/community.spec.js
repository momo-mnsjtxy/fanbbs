import { expect, test } from '@playwright/test'

test('approved responsive shell and login gate are usable', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'FanBBS' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '推荐' })).toBeVisible()
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('.bottom-nav button')).toHaveCount(4)
    await expect(page.getByRole('button', { name: '发布新帖' })).toBeVisible()
  } else {
    await expect(page.locator('.rail')).toBeVisible()
  }
  await page.getByRole('button', { name: '发布新帖' }).click()
  await expect(page.getByRole('dialog', { name: '欢迎回来' })).toBeVisible()
  await page.getByRole('button', { name: '关闭' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
