import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

// Live API tests. The runner creates its own SQLite database and synthetic identities.
const password='e2e-inbox-pass-1'
async function register(request, prefix) {
  const handle=`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
  const response=await request.post('/api/v1/auth/register',{data:{handle,email:`${handle}@example.test`,display_name:prefix==='author'?'稿件作者':'会话成员',password}})
  expect(response.status()).toBe(201)
  return (await response.json()).data
}
const headers=user=>({Authorization:`Bearer ${user.access_token}`})
async function enter(page, user, hash='#messages') {
  await page.addInitScript(data=>{
    sessionStorage.setItem('fanbbs_access_token',data.access_token)
    sessionStorage.setItem('fanbbs_refresh_token',data.refresh_token)
    sessionStorage.setItem('fanbbs_user',JSON.stringify(data.user))
  },user)
  await page.goto(`/${hash}`)
}
async function screenshot(page,testInfo,name) {
  await page.evaluate(()=>document.fonts.ready)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  const output=path.resolve('artifacts/screenshots');await mkdir(output,{recursive:true})
  await page.screenshot({path:path.join(output,`${name}-${testInfo.project.name}.png`),fullPage:true,animations:'disabled'})
}

test('inbox preferences preserve history and silent messages keep chat unread state',async({page,request},testInfo)=>{
  test.setTimeout(60_000)
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  const owner=await register(request,'inbox'),sender=await register(request,'sender')
  const created=await request.post('/api/v1/conversations',{headers:headers(sender),data:{member_ids:[owner.user.id]}})
  expect(created.status()).toBe(201);const conversation=(await created.json()).data
  async function send(body) {
    const response=await request.post(`/api/v1/conversations/${conversation.id}/messages`,{headers:headers(sender),data:{body,client_message_id:crypto.randomUUID()}})
    expect(response.status()).toBe(201)
  }
  await send('偏好修改前的消息')
  await enter(page,owner)
  await expect(page.locator('.message-tabs button').first()).toContainText('1')
  await page.getByRole('button',{name:'通知偏好',exact:true}).click()
  await page.getByRole('checkbox',{name:'私信提醒',exact:true}).uncheck()
  let saveCount=0;page.on('request',r=>{if(r.method()==='PATCH'&&r.url().endsWith('/me/notification-preferences'))saveCount++})
  await page.getByRole('button',{name:'保存通知偏好'}).click()
  await expect(page.getByText('通知偏好已保存')).toBeVisible()
  expect(saveCount).toBe(1)
  await expect(page.getByText('审核通知始终开启。')).toBeVisible()
  await screenshot(page,testInfo,'fanbbs-notification-preferences')
  await send('这条静默消息仍应显示在会话中')
  await page.reload()
  await expect(page.locator('.notification-action')).toHaveCount(1)
  await expect(page.locator('.message-tabs button').first()).toHaveText('通知1')
  await expect(page.locator('.message-tabs button').nth(1)).toHaveText('私信2')
  await page.getByRole('button',{name:'全部已读',exact:true}).click()
  await expect(page.locator('.message-tabs button').first()).toHaveText('通知')
  await expect(page.locator('.message-tabs button').nth(1)).toHaveText('私信2')
  await page.locator('.message-tabs button').nth(1).click()
  await expect(page.locator('.conversation-row .unread-badge')).toHaveText('2')
  await screenshot(page,testInfo,'fanbbs-chat-unread')
  await page.locator('.conversation-row').click()
  await expect(page.getByText('这条静默消息仍应显示在会话中',{exact:true})).toBeVisible()
  await expect(page.locator('.message-tabs button').nth(1)).toHaveText('私信')
  const counts=await request.get('/api/v1/conversations/counts',{headers:headers(owner)})
  expect((await counts.json()).data).toEqual({conversations:0,messages:0})
  await send('打开会话期间收到的静默消息')
  await expect(page.getByText('打开会话期间收到的静默消息',{exact:true})).toBeVisible({timeout:25_000})
  await expect(page.locator('.message-tabs button').nth(1)).toHaveText('私信')
  await page.getByRole('button',{name:'返回会话',exact:false}).click()
  await expect(page.locator('.conversation-row .unread-badge')).toHaveCount(0)
  await page.locator('.message-tabs button').first().click()
  await page.getByRole('button',{name:'通知偏好',exact:true}).click()
  await expect(page.getByRole('checkbox',{name:'私信提醒',exact:true})).not.toBeChecked()
  await page.getByRole('checkbox',{name:'私信提醒',exact:true}).check()
  await page.getByRole('button',{name:'收起偏好',exact:true}).click()
  await page.getByRole('button',{name:'通知偏好',exact:true}).click()
  await expect(page.getByRole('checkbox',{name:'私信提醒',exact:true})).not.toBeChecked()
  if(testInfo.project.name==='mobile'){
    await page.setViewportSize({width:320,height:760});await screenshot(page,testInfo,'fanbbs-inbox-width-320')
  }
  expect(errors).toEqual([])
})

test('submission for review stays private, exposes its reason and survives Back/Forward',async({page,request},testInfo)=>{
  test.skip(process.env.FANBBS_E2E_REVIEW_FIXTURE!=='1','Requires the disposable local runner with its synthetic moderator fixture')
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  const owner=await register(request,'author'),outsider=await register(request,'visitor')
  await enter(page,owner,'#home')
  await page.getByRole('button',{name:'发布新帖',exact:true}).click()
  await page.getByLabel('标题（可选）').fill('一次待审核的社区记录')
  await page.getByLabel('正文',{exact:true}).fill('这份稿件只应出现在作者自己的工作区。')
  await page.getByLabel('发布方式').selectOption('pending')
  await page.getByRole('button',{name:'提交审核',exact:true}).click()
  await expect(page).toHaveURL(/#submission-/)
  const id=new URL(page.url()).hash.slice('#submission-'.length)
  await expect(page.getByRole('heading',{name:'审核进度：待审核'})).toBeVisible()
  await expect(page.getByText('这份稿件只应出现在作者自己的工作区。',{exact:true})).toBeVisible()
  expect((await request.get(`/api/v1/posts/${id}`)).status()).toBe(404)
  expect((await request.get(`/api/v1/me/posts/${id}`,{headers:headers(outsider)})).status()).toBe(404)
  await screenshot(page,testInfo,'fanbbs-submission-pending')
  const login=await request.post('/api/v1/auth/login',{data:{identity:'demo',password:'demo1234'}})
  expect(login.status()).toBe(200);const moderator=(await login.json()).data
  const decision=await request.post(`/api/v1/admin/posts/${id}/moderation`,{headers:headers(moderator),data:{decision:'rejected',reason:'请补充照片来源后再与社区管理员沟通。'}})
  expect(decision.status()).toBe(200)
  await page.getByRole('button',{name:'通知',exact:true}).click()
  await expect(page.locator('.notification-action').filter({hasText:'审核结果'})).toBeVisible()
  await page.locator('.notification-action').filter({hasText:'审核结果'}).click()
  await expect(page).toHaveURL(new RegExp(`#submission-${id}$`))
  await expect(page.getByText('请补充照片来源后再与社区管理员沟通。',{exact:true})).toBeVisible()
  await screenshot(page,testInfo,'fanbbs-submission-rejected')
  await page.getByRole('button',{name:'返回我的稿件',exact:true}).click()
  await expect(page).toHaveURL(/#submissions$/)
  await page.getByLabel('稿件状态').selectOption('rejected')
  await expect(page.locator('.submission-row')).toHaveCount(1)
  await page.locator('.submission-row').click()
  await page.goBack();await expect(page).toHaveURL(/#submissions$/);await expect(page.locator('.submission-row')).toHaveCount(1)
  await page.goForward();await expect(page).toHaveURL(new RegExp(`#submission-${id}$`));await expect(page.getByText('请补充照片来源后再与社区管理员沟通。',{exact:true})).toBeVisible()
  await page.reload();await expect(page.getByText('请补充照片来源后再与社区管理员沟通。',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'返回我的稿件',exact:true}).click();await page.getByLabel('稿件状态').selectOption('published')
  await expect(page.getByText('这个状态下还没有稿件。')).toBeVisible()
  expect(errors).toEqual([])
})

test('preference read/save failures are retryable without dropping the selected value',async({page,request})=>{
  const owner=await register(request,'retry')
  await enter(page,owner)
  let getFailed=false,patchFailed=false
  await page.route('**/api/v1/me/notification-preferences',async route=>{
    if(route.request().method()==='GET'&&!getFailed){getFailed=true;await route.abort('failed');return}
    if(route.request().method()==='PATCH'&&!patchFailed){patchFailed=true;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'unavailable',message:'请稍后重试保存'}})});return}
    await route.continue()
  })
  await page.getByRole('button',{name:'通知偏好',exact:true}).click()
  await expect(page.getByRole('alert')).toContainText('无法连接社区服务')
  await page.getByRole('button',{name:'重试加载偏好'}).click()
  await page.getByRole('checkbox',{name:'点赞',exact:true}).uncheck()
  await page.getByRole('button',{name:'保存通知偏好'}).click()
  await expect(page.getByRole('alert')).toContainText('请稍后重试保存')
  await expect(page.getByRole('checkbox',{name:'点赞',exact:true})).not.toBeChecked()
  await page.getByRole('button',{name:'保存通知偏好'}).click()
  await expect(page.getByText('通知偏好已保存')).toBeVisible()
})
