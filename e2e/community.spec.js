import { expect, test } from '@playwright/test'

test('approved responsive shell and login gate are usable', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('后端暂不可用')).toHaveCount(0)
  await expect(page.getByText('动态加载失败')).toHaveCount(0)
  await expect(page.getByText('清晨五点半，路灯还没有熄灭。')).toBeVisible()
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

test('synthetic registration displays one-time recovery codes', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: '注册' }).first().click()
  const suffix = testInfo.project.name.replace(/[^a-z0-9]/g, '')
  await page.getByLabel('用户名').fill(`e2e_${suffix}`)
  await page.getByLabel('邮箱').fill(`e2e_${suffix}@example.test`)
  await page.getByLabel('显示名称').fill(`E2E ${suffix}`)
  await page.getByLabel('密码').fill('e2e-secure-pass-1')
  await page.getByRole('button', { name: '注册' }).last().click()
  await expect(page.getByText('恢复码只显示这一次，请离线安全保存')).toBeVisible()
  await expect(page.locator('.recovery-codes code')).toHaveCount(8)
})

test('local shop clearly excludes payment', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop rail destination')
  await page.goto('/')
  await page.getByRole('button', { name: '商城' }).click()
  await expect(page.getByText('这里只创建不含付款的本地履约订单；支付、现金钱包、VIP 和外部物流均未启用。')).toBeVisible()
})
