/**
 * Client conversation recordings.
 *
 * Hosted on Google Drive (all six are shared "anyone with the link").
 * Playback uses Drive's /preview iframe, mounted only after a click so we
 * don't pull six players into the page on load.
 *
 * NOTE: Drive is not a real video CDN — it applies a per-file daily view
 * quota and will serve an error page if a video gets hammered. If these
 * start pulling traffic, move them to YouTube (unlisted) or a video host
 * and just swap `driveId` for an embed URL here.
 */

export interface ClientVideo {
  driveId: string
  title: string
  who: string
  /** shown as a small meta line under the title */
  meta: string
}

export const CLIENT_VIDEOS: ClientVideo[] = [
  {
    driveId: '1TqcemZI2weIOj4ZW79HKvwTvNygEmOR2',
    title: 'ZippyScale × Naresh',
    who: 'Client conversation',
    meta: 'Jan 2026',
  },
  {
    driveId: '1yIY4ENGvq39ldXA-CHxb6MeZt942sHkY',
    title: 'ZippyScale × Vasista',
    who: 'Client conversation',
    meta: 'Jan 2026',
  },
  {
    driveId: '1LeaCU7ynylezwMRlv_oKLwDfa1MfY3ci',
    title: 'Walk Again',
    who: 'Client conversation',
    meta: 'Dec 2025',
  },
  {
    driveId: '1MYFtyFUkm1wja5TVbiqi-dRJJNxReC43',
    title: 'Client session',
    who: 'Working session',
    meta: '18 March 2026',
  },
  {
    driveId: '14MyZ91O52R1AXXliVC0yndnV-rt-85oB',
    title: 'Client session',
    who: 'Working session',
    meta: '20 March 2026',
  },
  {
    driveId: '1-COpixuG9mphzZZnk3GgCm45xEW1TxQ0',
    title: 'Client session',
    who: 'Working session',
    meta: '26 March 2026',
  },
]

export const drivePoster = (id: string) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w1200`

export const driveEmbed = (id: string) =>
  `https://drive.google.com/file/d/${id}/preview`
