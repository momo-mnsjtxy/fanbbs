import { expect, test } from '@playwright/test'

test('approved responsive shell and login gate are usable', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('后端暂不可用')).toHaveCount(0)
  await expect(page.getByText('动态加载失败')).toHaveCount(0)
  await expect(page.getByText('在城市醒来之前，找到属于清晨的安静')).toBeVisible()
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
  await page.screenshot({ path: testInfo.outputPath(`fanbbs-${testInfo.project.name}.png`), fullPage: true })
})
