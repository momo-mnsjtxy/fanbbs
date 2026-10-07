<script setup>
defineProps({ name: { type: String, default: 'spark' } })
const paths = {
 home:'m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
 discover:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M16 8l-3 5-5 3 3-5Z',
 shop:'M3 8h18l-2-5H5L3 8Zm1 0v12h16V8M9 20v-7h6v7',
 users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8m6 9v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 message:'M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-9.5A8.5 8.5 0 0 1 10.5 4h2a8.5 8.5 0 0 1 8.5 7.5ZM7 10h9M7 14h6',
 bookmark:'M6 3h12v18l-6-4-6 4Z',
 user:'M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 search:'M18 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 6 5 5',
 bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
 plus:'M12 5v14M5 12h14',
 menu:'M4 6h16M4 12h16M4 18h16',
 close:'m6 6 12 12M6 18 18 6',
 spark:'m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z',
 clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
 globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
 heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
 reply:'M21 11a8 8 0 0 1-8 8H8l-5 3v-8a8 8 0 0 1 8-11h2a8 8 0 0 1 8 8Z',
 repost:'m16 3 4 4-4 4M4 11V7h16M8 21l-4-4 4-4m12 0v4H4',
 eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 arrow:'M5 12h14m-5-5 5 5-5 5',
 back:'M19 12H5m5-5-5 5 5 5',
 edit:'m16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5',
 hash:'M10 3 8 21M17 3l-2 18M4 9h17M3 15h17'
}
</script>
<template><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path :d="paths[name] || paths.spark" /></svg></template>
