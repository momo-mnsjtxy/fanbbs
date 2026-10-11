import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
const api=vi.hoisted(()=>({notificationPreferences:vi.fn(),updateNotificationPreferences:vi.fn(),ownPosts:vi.fn(),ownPost:vi.fn()}))
vi.mock('../src/api.js',()=>({api,fetchMediaBlob:vi.fn()}))
import NotificationPreferences from '../src/NotificationPreferences.vue'
import AuthorWorkspace from '../src/AuthorWorkspace.vue'
const defaults={comment:true,like:true,repost:true,follow:true,message:true,moderation:true}
const post=(id,status='pending')=>({id,status,title:`稿件 ${id}`,content:`私有正文 ${id}`,created_at:'2026-10-11T10:00:00Z'})
beforeEach(()=>{vi.resetAllMocks();api.notificationPreferences.mockResolvedValue({data:{preferences:{...defaults}}});api.updateNotificationPreferences.mockResolvedValue({data:{preferences:{...defaults,like:false}}});api.ownPosts.mockResolvedValue({data:[]});api.ownPost.mockResolvedValue({data:{post:post('one'),moderation:{state:'pending'}}})})
describe('notification preferences',()=>{
  it('loads real preferences, keeps moderation immutable, and saves only changed fields once',async()=>{
    const wrapper=mount(NotificationPreferences);await flushPromises()
    expect(wrapper.findAll('input')).toHaveLength(5);expect(wrapper.text()).toContain('审核通知始终开启')
    await wrapper.find('[name="like"]').setValue(false)
    let finish;api.updateNotificationPreferences.mockReturnValue(new Promise(r=>{finish=r}))
    await wrapper.find('form').trigger('submit');await wrapper.find('form').trigger('submit')
    expect(api.updateNotificationPreferences).toHaveBeenCalledTimes(1);expect(api.updateNotificationPreferences).toHaveBeenCalledWith({like:false})
    expect(wrapper.find('fieldset').attributes('disabled')).toBeDefined()
    finish({data:{preferences:{...defaults,like:false}}});await flushPromises();expect(wrapper.text()).toContain('通知偏好已保存');expect(wrapper.find('.primary').attributes('disabled')).toBeDefined();wrapper.unmount()
  })
  it('has a retryable loading failure and preserves edits after a rejected save',async()=>{
    api.notificationPreferences.mockRejectedValueOnce(new Error('偏好加载失败'))
    const wrapper=mount(NotificationPreferences);await flushPromises();expect(wrapper.find('form').exists()).toBe(false)
    await wrapper.find('button').trigger('click');await flushPromises();await wrapper.find('[name="message"]').setValue(false)
    api.updateNotificationPreferences.mockRejectedValueOnce(new Error('保存失败'))
    await wrapper.find('form').trigger('submit');await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toBe('保存失败');expect(wrapper.find('[name="message"]').element.checked).toBe(false)
    expect(wrapper.find('.primary').attributes('disabled')).toBeUndefined();wrapper.unmount()
  })
  it('never saves an unsent edit on dismissal or mutates a closed panel after a late read',async()=>{
    const wrapper=mount(NotificationPreferences);await flushPromises();await wrapper.find('[name="like"]').setValue(false);wrapper.unmount();expect(api.updateNotificationPreferences).not.toHaveBeenCalled()
    let finish;api.notificationPreferences.mockReturnValue(new Promise(r=>{finish=r}));const closed=mount(NotificationPreferences);closed.unmount();finish({data:{preferences:defaults}});await flushPromises();expect(api.updateNotificationPreferences).not.toHaveBeenCalled()
  })
})
describe('private author workspace',()=>{
  it('filters server-side, scopes pages, deduplicates and guards duplicate load-more clicks',async()=>{
    api.ownPosts.mockResolvedValueOnce({data:[post('one')]})
    const wrapper=mount(AuthorWorkspace);await flushPromises()
    api.ownPosts.mockResolvedValueOnce({data:[post('two','rejected')],page:{next_cursor:'rejected-next'}})
    await wrapper.find('select').setValue('rejected');await flushPromises();expect(api.ownPosts).toHaveBeenLastCalledWith('rejected')
    let finish;api.ownPosts.mockReturnValueOnce(new Promise(r=>{finish=r}));await wrapper.find('.load-more').trigger('click');await wrapper.find('.load-more').trigger('click')
    expect(api.ownPosts).toHaveBeenCalledTimes(3);expect(api.ownPosts).toHaveBeenLastCalledWith('rejected','rejected-next')
    finish({data:[post('two','rejected'),post('three','rejected')]});await flushPromises();expect(wrapper.findAll('.submission-row')).toHaveLength(2);wrapper.unmount()
  })
  it('discards delayed pages after changing filter and clears the old cursor',async()=>{
    api.ownPosts.mockResolvedValueOnce({data:[post('one')],page:{next_cursor:'old-next'}})
    const wrapper=mount(AuthorWorkspace);await flushPromises();let finish
    api.ownPosts.mockReturnValueOnce(new Promise(r=>{finish=r}));await wrapper.find('.load-more').trigger('click')
    api.ownPosts.mockResolvedValueOnce({data:[post('new','published')]});await wrapper.find('select').setValue('published');await flushPromises()
    finish({data:[post('stale')],page:{next_cursor:'stale-cursor'}});await flushPromises();expect(wrapper.text()).toContain('稿件 new');expect(wrapper.text()).not.toContain('稿件 stale');expect(wrapper.find('.load-more').exists()).toBe(false);wrapper.unmount()
  })
  it('keeps pending and rejected content read-only and renders the exact private review reason safely',async()=>{
    api.ownPost.mockResolvedValueOnce({data:{post:post('one','rejected'),moderation:{state:'rejected',reason:'请补充 <script>证据</script>',decided_at:'2026-10-11T11:00:00Z'}}})
    const wrapper=mount(AuthorWorkspace,{props:{postId:'one'}});await flushPromises()
    expect(api.ownPost).toHaveBeenCalledWith('one');expect(wrapper.text()).toContain('请补充 <script>证据</script>');expect(wrapper.find('script').exists()).toBe(false);expect(wrapper.findAll('button').map(b=>b.text())).toEqual(['返回我的稿件'])
    await wrapper.find('button').trigger('click');expect(wrapper.emitted('back')).toHaveLength(1);wrapper.unmount()
  })
  it('does not show another detail after a newer selection and does not fall back on a masked 404',async()=>{
    let finish;api.ownPost.mockReturnValueOnce(new Promise(r=>{finish=r}))
    const wrapper=mount(AuthorWorkspace,{props:{postId:'old'}})
    api.ownPost.mockRejectedValueOnce(new Error('文章不存在'));await wrapper.setProps({postId:'foreign'});await flushPromises();finish({data:{post:post('old')}});await flushPromises()
    expect(wrapper.find('.submission-detail').exists()).toBe(false);expect(wrapper.text()).toContain('文章不存在');expect(wrapper.text()).not.toContain('私有正文 old');expect(wrapper.findAll('button').map(b=>b.text())).toContain('重试加载稿件');wrapper.unmount()
  })
  it('offers the public route only for a published post and exposes empty states',async()=>{
    const empty=mount(AuthorWorkspace);await flushPromises();expect(empty.text()).toContain('还没有稿件');empty.unmount()
    api.ownPost.mockResolvedValueOnce({data:{post:post('public','published')}})
    const wrapper=mount(AuthorWorkspace,{props:{postId:'public'}});await flushPromises();await wrapper.findAll('button').find(b=>b.text()==='查看已发布的帖子').trigger('click');expect(wrapper.emitted('published')[0][0].id).toBe('public');wrapper.unmount()
  })
  it('retries failed pagination without discarding already loaded submissions',async()=>{
    api.ownPosts.mockResolvedValueOnce({data:[post('one')],page:{next_cursor:'next'}}).mockRejectedValueOnce(new Error('稍后重试'))
    const wrapper=mount(AuthorWorkspace);await flushPromises();await wrapper.find('.load-more').trigger('click');await flushPromises();expect(wrapper.text()).toContain('稿件 one')
    api.ownPosts.mockResolvedValueOnce({data:[post('two')]});await wrapper.findAll('button').find(b=>b.text()==='重试加载稿件').trigger('click');await flushPromises();expect(api.ownPosts).toHaveBeenLastCalledWith('','next');expect(wrapper.findAll('.submission-row')).toHaveLength(2);wrapper.unmount()
  })
})
