/* ============================================================
   Turns a stored media link into something the public page can show.
   Pure code (no server / browser APIs), so the server and the page can both use it.

   Only these can be shown inside our page - anything else returns null and is skipped:
     - our own uploads (/uploads/...)       image or video file
     - https link ending with an image      <img>
     - https link ending with a video       <video>
     - YouTube / Vimeo                      <iframe> (official embed URL)
     - ONE file on Google Drive             <iframe> (/preview)
     - Tikee private share (timelapse)      <iframe>
   A Drive FOLDER, an unknown website, a relative ColorIdea path ... -> null.
   ============================================================ */

export type MediaViewKind = 'image' | 'video' | 'embed';

export interface MediaView {
  kind: MediaViewKind;
  src: string;
}

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|avi)$/i;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);
const YT_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;
const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,100}$/;
const TIKEE_PATH_RE = /^\/projects\/\d+\/timelapse\/private_share\/[0-9a-f-]{20,64}\/?$/i;

/** iframe permissions: enough to play a video, nothing that lets the other site control our page */
export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-presentation allow-popups';
export const EMBED_ALLOW = 'autoplay; fullscreen; picture-in-picture; encrypted-media';

function youtubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
    id = m ? m[1] : url.pathname === '/watch' ? url.searchParams.get('v') : null;
  }
  return id && YT_ID_RE.test(id) ? id : null;
}

export function toMediaView(link: string | null | undefined): MediaView | null {
  if (typeof link !== 'string') return null;
  const s = link.trim();
  if (!s) return null;

  // our own uploads
  if (s.startsWith('/uploads/')) {
    if (s.includes('..')) return null;
    const path = s.split(/[?#]/)[0];
    if (IMAGE_EXT_RE.test(path)) return { kind: 'image', src: s };
    if (VIDEO_EXT_RE.test(path)) return { kind: 'video', src: s };
    return null;
  }

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();

  if (IMAGE_EXT_RE.test(url.pathname)) return { kind: 'image', src: s };
  if (VIDEO_EXT_RE.test(url.pathname)) return { kind: 'video', src: s };

  const yt = youtubeId(url);
  if (yt) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${yt}` };

  if (VIMEO_HOSTS.has(host)) {
    const m = url.pathname.match(/^\/(?:video\/)?(\d{5,15})(?:\/|$)/);
    if (m) return { kind: 'embed', src: `https://player.vimeo.com/video/${m[1]}` };
    return null;
  }

  if (host === 'drive.google.com') {
    const m = url.pathname.match(/^\/file\/d\/([^/]+)/);
    if (m && DRIVE_ID_RE.test(m[1])) return { kind: 'embed', src: `https://drive.google.com/file/d/${m[1]}/preview` };
    return null;
  }

  if (host === 'my.tikee.io' && TIKEE_PATH_RE.test(url.pathname)) {
    return { kind: 'embed', src: `https://my.tikee.io${url.pathname}` };
  }

  return null;
}