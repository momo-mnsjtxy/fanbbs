import { expect, test } from '@playwright/test'

test('approved responsive shell and login gate are usable', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('后端暂不可用')).toHaveCount(0)
  await expect(page.getByText('动态加载失败')).toHaveCount(0)
  await expect(page.locator('.post-copy').filter({ hasText: '清晨五点半，路灯还没有熄灭。' }).first()).toBeVisible()
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

test('keyboard focus and responsive landmarks remain accessible', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip')).toBeFocused()
  await expect(page.locator('main#feed')).toHaveCount(1)
  await expect(page.getByRole('navigation')).toHaveCount(1)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  const unlabeledButtons = await page.locator('button').evaluateAll(buttons => buttons.filter(button => !((button.getAttribute('aria-label') || button.textContent || '').trim())).length)
  expect(unlabeledButtons).toBe(0)
})

test('a failed destination can retry and remains browser-history safe', async ({ page }) => {
  let interrupted = false
  await page.route('**/api/v1/categories', async route => {
    if (!interrupted) {
      interrupted = true
      await route.abort('failed')
      return
    }
    await route.continue()
  })

  await page.goto('/')
  await page.getByRole('button', { name: '发现' }).click()
  await expect(page.getByRole('alert')).toContainText('无法连接社区服务')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.locator('.category-card-main').first()).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/#home$/)
  await expect(page.locator('article.post').first()).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(/#discover$/)
  await expect(page.locator('.category-card-main').first()).toBeVisible()
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
  if (testInfo.project.name === 'desktop') {
    await page.goto('/')
    await page.getByRole('button', { name: '商城' }).click()
  } else {
    // The approved mobile shell intentionally keeps exactly four primary tabs;
    // secondary destinations remain deep-linkable.
    await page.goto('/#shop')
  }
  await expect(page.getByText('这里只创建不含付款的本地履约订单；支付、现金钱包、VIP 和外部物流均未启用。')).toBeVisible()
})

test('registered member publishes media and replies through the real API', async ({ page }, testInfo) => {
  const handle = `flow_${testInfo.project.name}_${Date.now()}`
  const postBody = `真实链路媒体帖 ${handle}`
  const replyBody = `真实链路回复 ${handle}`

  await page.goto('/')
  await page.getByRole('button', { name: '发布新帖' }).click()
  await expect(page.getByRole('dialog', { name: '欢迎回来' })).toBeVisible()
  await page.getByRole('button', { name: '还没有账号？注册' }).click()
  await page.getByLabel('用户名').fill(handle)
  await page.getByLabel('邮箱').fill(`${handle}@example.test`)
  await page.getByLabel('显示名称').fill(`Flow ${handle}`)
  await page.getByLabel('密码').fill('e2e-secure-pass-1')
  await page.getByRole('button', { name: '注册' }).last().click()
  await page.getByRole('button', { name: '我已安全保存' }).click()

  await expect(page.getByRole('dialog', { name: '发布新帖' })).toBeVisible()
  await page.getByLabel('正文').fill(postBody)
  await page.locator('input[type="file"]').setInputFiles({
    name: 'e2e-pixel.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAUAAAAC0CAIAAABqhmJGAAADnUlEQVR42u3TZ3KVBRgG0HcpgUBwJTaUJJCQRuAmNze9QVwKiBSRIlJEighuQKwoVhQrihXFiv722wXzzJyZs4VT/736FBCq/r26BoSq+1fXgFB1/8oaEKr+ubIGhGoC7wFC1d+v7AFCCQzJgf+6vAcIJTAkB/7z8m4gVP3x8m4glMCQHPj3S7uBUE3gVSBU3bu0CoSqexdXgVD128VVIJTAkBz41wsrQKi6e2EFCFV3z68AoeqX8ytAqCbwMhCqfn5pGQglMCQH/uncMhBKYEgO/OO5JSBU/fDiEhBKYEgO/P3ZJSBUE3gRCFV3zi4CoerOmUUgVH13ZhEIJTAkB/729AIQqm6fXgBC1e1TC0Co+ubUAhCqCTwPhKqvX5gHQgkMyYG/OjkPhBIYkgN/eXIOCFVfPD8HhBIYkgN/fmIOCNUEngVC1a0Ts0CounV8FghVnx2fBUIJDMmBPz02A4Sqm8dmgFB18+gMEKo+OToDhGoCTwOh6uPnpoFQAkNy4I+OTAOhBIbkwB8e6QCh6oNnO0AogSE58PuHO0CoJvAUEKpuHJ4CQtWNQ1NAqHrv0BQQSmBIDvzuwTYQqq4fbAOh6vqBNhCq3jnQBkI1gSeBUPX2M5NAKIEhOfBb+yeBUAJDcuA3908AoeqNpyeAUAJDcuDX900AoZrALSBUXdvXAkLVtb0tIFS9trcFhKqHVmeAULVpZRoIJTBEB16eBkI1gTtAqNq01AFCCQzRgRc7QKgm8BQQqjYtTAGhBIbowPNtIFT1zLeBUNUz1wZCCQzZgSeBUPUzOwmEEhiiA89MAqGawBNAqOqZngBCCQzRgTstIFRt7LSAULVxqgWEEhiiA7d3AaEEhujAk7uAUE3gnUAogSE68MROIJTAEB24NQ6Eqg2tcSBUbdg1DoQSGKID79wBhBIYogOP7wBCNYHHgFC1YccYEEpgiA48NgaEagKPAqEEhuTA3aOjQKgm8AgQqrpHRoBQAkN04OERIFQTeBgIVd1Dw0AogSE68PZhIFQTeAgIVd2DQ0CoWj84BISq9QPbgVACg8DAgwm8bTsQqgk8CISq9VsHgVACQ3Tg/gEglMAQHbhvAAhV6/oGgFC1rncbEEpgiA68ZRsQSmCIDvzkViCUwCAw8GACP9EPhBIYogNv7gdCVdfmfiBUdT3eB4QSGKIDP9YHhGoC9wKhquvRXiCUwBAd+JFeIFQTeAsQqroe3gKEEhiC/Q+Sf0v6czi0LQAAAABJRU5ErkJggg==', 'base64')
  })
  let createRequests = 0
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/posts') createRequests += 1
  })
  await page.locator('.composer-form').evaluate(form => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  const published = page.locator('article.post').filter({ hasText: postBody }).first()
  await expect(published).toBeVisible()
  expect(createRequests).toBe(1)
  await expect(published.getByRole('img', { name: 'e2e-pixel.png' })).toBeVisible()

  await published.locator('.post-content').click()
  await expect(page.locator('.detail-title')).toBeVisible()
  await expect(page.locator('.detail-post').getByRole('img', { name: 'e2e-pixel.png' })).toBeVisible()
  const commentBox = page.getByLabel('加入对话')
  await commentBox.fill(replyBody)
  await commentBox.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByText(replyBody)).toBeVisible()
  await expect(page.locator('.toast')).not.toContainText('Cannot read properties')

  await page.goBack()
  await expect(page).toHaveURL(/#home$/)
  await expect(page.locator('.detail-title')).toHaveCount(0)
  await expect(published).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(/#post-/)
  await expect(page.locator('.detail-copy')).toContainText(postBody)
  await page.screenshot({ path: testInfo.outputPath(`fanbbs-workflow-${testInfo.project.name}.png`), fullPage: true })
})
