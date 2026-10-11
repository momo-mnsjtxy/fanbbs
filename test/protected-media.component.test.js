import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
const {fetchMediaBlob,api}=vi.hoisted(()=>({fetchMediaBlob:vi.fn(),api:{ownPost:vi.fn(),ownPosts:vi.fn()}}))
vi.mock('../src/api.js',()=>({fetchMediaBlob,api}))
import ProtectedMedia from '../src/ProtectedMedia.vue'
import AuthorWorkspace from '../src/AuthorWorkspace.vue'
const NativeURL=globalThis.URL
let created,revoked,wrappers=[]
beforeEach(()=>{
  vi.resetAllMocks();let next=0;created=vi.fn(()=>`blob:private-${++next}`);revoked=vi.fn()
  class TestURL extends NativeURL {}
  TestURL.createObjectURL=created;TestURL.revokeObjectURL=revoked;vi.stubGlobal('URL',TestURL)
})
afterEach(()=>{for(const wrapper of wrappers)wrapper.unmount();wrappers=[];vi.unstubAllGlobals()})
function mountMedia(props){const wrapper=mount(ProtectedMedia,{props});wrappers.push(wrapper);return wrapper}
describe('authenticated author media',()=>{
  it('uses authenticated bytes and MIME-aware object URLs in the real author detail component',async()=>{
    const media=[{id:'image',url:'https://untrusted.test/image',alt_text:'私有图片'},{id:'video',url:'/api/v1/media/video',alt_text:'私有视频'}]
    api.ownPost.mockResolvedValue({data:{post:{id:'post',title:'附件稿件',status:'pending',content:'正文',media}}})
    fetchMediaBlob.mockImplementation(id=>Promise.resolve(new Blob([id],{type:id==='video'?'video/mp4':'image/png'})))
    const wrapper=mount(AuthorWorkspace,{props:{postId:'post'}});wrappers.push(wrapper);await flushPromises()
    expect(fetchMediaBlob.mock.calls.map(([id])=>id)).toEqual(['image','video']);expect(fetchMediaBlob.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    expect(wrapper.find('img').attributes('src')).toBe('blob:private-1');expect(wrapper.find('img').attributes('alt')).toBe('私有图片')
    expect(wrapper.find('video').attributes('src')).toBe('blob:private-2');expect(wrapper.find('video').attributes('controls')).toBeDefined();expect(wrapper.find('video').attributes('aria-label')).toBe('私有视频')
    expect(wrapper.html()).not.toContain('untrusted.test');expect(wrapper.html()).not.toContain('/api/v1/media/video')
    wrapper.unmount();expect(revoked.mock.calls.map(([url])=>url)).toEqual(['blob:private-1','blob:private-2'])
  })
  it('revokes prior URLs on a changed detail and ignores late bytes after unmount',async()=>{
    fetchMediaBlob.mockResolvedValueOnce(new Blob(['a'],{type:'image/png'}))
    const wrapper=mountMedia({media:[{id:'first'}]});await flushPromises();const firstSignal=fetchMediaBlob.mock.calls[0][1].signal
    let finish;fetchMediaBlob.mockReturnValueOnce(new Promise(r=>{finish=r}));await wrapper.setProps({media:[{id:'second'}]});await flushPromises()
    expect(firstSignal.aborted).toBe(true);expect(revoked).toHaveBeenCalledWith('blob:private-1');expect(wrapper.find('img').exists()).toBe(false)
    const pendingSignal=fetchMediaBlob.mock.calls[1][1].signal;wrapper.unmount();expect(pendingSignal.aborted).toBe(true)
    finish(new Blob(['late'],{type:'image/png'}));await flushPromises();expect(created).toHaveBeenCalledTimes(1)
  })
  it('reports a masked fetch error and retries without ever binding the protected URL',async()=>{
    fetchMediaBlob.mockRejectedValueOnce(new Error('媒体不存在')).mockResolvedValueOnce(new Blob(['image'],{type:'image/png'}))
    const wrapper=mountMedia({media:[{id:'private',url:'/api/v1/media/private',alt_text:'待审附件'}]});await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('媒体不存在');expect(wrapper.find('img').exists()).toBe(false)
    await wrapper.find('button').trigger('click');await flushPromises();expect(wrapper.find('[role="alert"]').exists()).toBe(false);expect(wrapper.find('img').attributes('src')).toBe('blob:private-1')
  })
  it('discards old pending bytes when a new attachment list supersedes them',async()=>{
    let finish;fetchMediaBlob.mockReturnValueOnce(new Promise(r=>{finish=r})).mockResolvedValueOnce(new Blob(['current'],{type:'video/mp4'}))
    const wrapper=mountMedia({media:[{id:'old'}]});await wrapper.setProps({media:[{id:'new'}]});await flushPromises()
    finish(new Blob(['stale'],{type:'image/png'}));await flushPromises();expect(created).toHaveBeenCalledTimes(1);expect(wrapper.find('img').exists()).toBe(false);expect(wrapper.find('video').exists()).toBe(true)
  })
})
