import { mkdir, rename, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

/* ============================================================
   Google Drive import (server only)
   ColorIdea gives us Drive FOLDER links. A folder can't be shown on our
   site, so while syncing we open every public folder and keep:
     - images  -> downloaded to /public/uploads/drive/<fileId>.<ext>
     - videos  -> only the link of the file on Drive (never downloaded)
   The folder link itself is not stored.

   Failure rules (per item, never for the whole sync):
     - folder closed / Drive error  -> the old data of that item is kept,
                                       or nothing is stored when there is none
     - a single image failed        -> that image is skipped (or its old copy kept)
   Needs GOOGLE_DRIVE_API_KEY in .env. Without it nothing here runs.
   ============================================================ */

export interface DriveItemLike {
  id: string;
  name: string;
  link: string | null;
  photo: string | null;
  date: string | null;
  /** the original Drive link this item was created from (folder link) */
  source?: string;
  kind?: 'image' | 'video' | 'link';
}

/** Shared by one sync run: time budget + how many images were left for the next run */
export interface DriveContext {
  deadline: number | null;
  pending: number;
}

const API = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_IMAGES_PER_FOLDER = 20;
const MAX_VIDEOS_PER_FOLDER = 20;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const LIST_TIMEOUT_MS = 20000;
const DOWNLOAD_TIMEOUT_MS = 60000;
const MAX_LIST_PAGES = 5;
const DOWNLOAD_CONCURRENCY = 4;
const ID_REGEX = /^[A-Za-z0-9_-]{10,100}$/;

const UPLOAD_URL_PREFIX = '/uploads/drive';
const uploadDir = () => join(process.cwd(), 'public', 'uploads', 'drive');

export function isDriveImportEnabled(): boolean {
  return Boolean(process.env.GOOGLE_DRIVE_API_KEY);
}

export function createDriveContext(budgetMs?: number): DriveContext {
  return { deadline: budgetMs ? Date.now() + budgetMs : null, pending: 0 };
}

/* ---------- link parsing ---------- */

type ParsedLink = { type: 'folder' | 'file' | 'unknown'; id: string };

export function parseDriveLink(link: string): ParsedLink | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.hostname !== 'drive.google.com' && url.hostname !== 'docs.google.com') return null;

  const folder = url.pathname.match(/\/folders\/([^/?#]+)/);
  if (folder && ID_REGEX.test(folder[1])) return { type: 'folder', id: folder[1] };

  const file = url.pathname.match(/\/file\/d\/([^/?#]+)/);
  if (file && ID_REGEX.test(file[1])) return { type: 'file', id: file[1] };

  const queryId = url.searchParams.get('id');
  if (queryId && ID_REGEX.test(queryId)) return { type: 'unknown', id: queryId };

  return null;
}

/* ---------- Drive API ---------- */

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

class DriveError extends Error {}

async function driveGet(path: string, params: Record<string, string>): Promise<Response> {
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  if (!key) throw new DriveError('GOOGLE_DRIVE_API_KEY غير موجود');

  const qs = new URLSearchParams({ ...params, key, supportsAllDrives: 'true' });
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    params.alt === 'media' ? DOWNLOAD_TIMEOUT_MS : LIST_TIMEOUT_MS,
  );
  try {
    // the URL (it holds the key) is never put in an error message
    return await fetch(`${API}${path}?${qs.toString()}`, {
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    });
  } catch {
    throw new DriveError('تعذر الاتصال بـ Google Drive');
  } finally {
    clearTimeout(timer);
  }
}

async function driveJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await driveGet(path, params);
  if (!res.ok) {
    throw new DriveError(
      res.status === 404 || res.status === 403
        ? `الفولدر/الملف مقفول أو غير موجود (${res.status})`
        : `Drive رجّع خطأ (${res.status})`,
    );
  }
  const json = (await res.json().catch(() => null)) as T | null;
  if (!json) throw new DriveError('رد Drive غير متوقع');
  return json;
}

async function getFile(id: string): Promise<DriveFile> {
  return driveJson<DriveFile>(`/files/${id}`, { fields: 'id,name,mimeType,size' });
}

async function listFolder(folderId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_LIST_PAGES; page++) {
    const params: Record<string, string> = {
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken,files(id,name,mimeType,size)',
      pageSize: '200',
      orderBy: 'name_natural',
      includeItemsFromAllDrives: 'true',
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await driveJson<{ files?: DriveFile[]; nextPageToken?: string }>('/files', params);
    files.push(...(data.files ?? []));

    const imgs = files.filter(isUsableImage).length;
    const vids = files.filter(isVideo).length;
    if (!data.nextPageToken || (imgs >= MAX_IMAGES_PER_FOLDER && vids >= MAX_VIDEOS_PER_FOLDER)) break;
    pageToken = data.nextPageToken;
  }
  return files;
}

const isVideo = (f: DriveFile) => f.mimeType.startsWith('video/');
const isUsableImage = (f: DriveFile) =>
  f.mimeType in IMAGE_EXT && (!f.size || Number(f.size) <= MAX_IMAGE_BYTES);

/* ---------- image download ---------- */

function looksLike(buf: Buffer, ext: string): boolean {
  switch (ext) {
    case 'jpg':
      return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
    case 'png':
      return buf.length > 8 && buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    case 'gif':
      return buf.length > 6 && buf.subarray(0, 3).toString('latin1') === 'GIF';
    case 'webp':
      return (
        buf.length > 12 &&
        buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
        buf.subarray(8, 12).toString('latin1') === 'WEBP'
      );
    default:
      return false;
  }
}

/** Returns the public path of the image, or null if it could not be stored (never throws) */
async function downloadImage(file: DriveFile, ctx: DriveContext): Promise<string | null> {
  const ext = IMAGE_EXT[file.mimeType];
  if (!ext || !ID_REGEX.test(file.id)) return null;

  const filename = `${file.id}.${ext}`;
  const fullPath = join(uploadDir(), filename);
  const publicPath = `${UPLOAD_URL_PREFIX}/${filename}`;

  // already downloaded by an earlier sync: nothing to do
  try {
    const s = await stat(fullPath);
    if (s.size > 0) return publicPath;
  } catch {
    /* not downloaded yet */
  }

  // time budget over: this image waits for the next sync
  if (ctx.deadline !== null && Date.now() > ctx.deadline) {
    ctx.pending++;
    return null;
  }

  try {
    const res = await driveGet(`/files/${file.id}`, { alt: 'media' });
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES || !looksLike(buf, ext)) return null;

    await mkdir(uploadDir(), { recursive: true });
    const tmp = `${fullPath}.${randomUUID()}.part`;
    await writeFile(tmp, buf);
    await rename(tmp, fullPath);
    return publicPath;
  } catch {
    return null;
  }
}

/* ---------- helpers ---------- */

async function pool<T, R>(list: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, list.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= list.length) return;
        out[i] = await fn(list[i]);
      }
    }),
  );
  return out;
}

const videoLink = (fileId: string) => `https://drive.google.com/file/d/${fileId}/view`;

/* ---------- one item ---------- */

async function expandFolder<T extends DriveItemLike>(
  item: T,
  folderId: string,
  previous: T[],
  ctx: DriveContext,
): Promise<T[]> {
  const files = await listFolder(folderId); // throws -> the caller applies the failure rule

  // keep Drive's order, with a cap for each kind
  const picked: { file: DriveFile; kind: 'image' | 'video' }[] = [];
  let images = 0;
  let videos = 0;
  for (const file of files) {
    if (isUsableImage(file) && images < MAX_IMAGES_PER_FOLDER) {
      picked.push({ file, kind: 'image' });
      images++;
    } else if (isVideo(file) && videos < MAX_VIDEOS_PER_FOLDER) {
      picked.push({ file, kind: 'video' });
      videos++;
    }
  }

  const imageFiles = picked.filter((p) => p.kind === 'image').map((p) => p.file);
  const paths = new Map<string, string | null>();
  const results = await pool(imageFiles, DOWNLOAD_CONCURRENCY, (f) => downloadImage(f, ctx));
  imageFiles.forEach((f, i) => paths.set(f.id, results[i]));

  const out: T[] = [];
  for (const { file, kind } of picked) {
    const id = `${item.id}:${file.id}`;
    if (kind === 'video') {
      out.push({ ...item, id, name: file.name, link: videoLink(file.id), source: item.link ?? undefined, kind: 'video' });
      continue;
    }
    const path = paths.get(file.id);
    if (path) {
      out.push({ ...item, id, name: file.name, link: path, photo: path, source: item.link ?? undefined, kind: 'image' });
    } else {
      // this image failed / is waiting: keep its old copy if we have one
      const old = previous.find((p) => p.id === id);
      if (old) out.push(old);
    }
  }
  return out;
}

async function expandFile<T extends DriveItemLike>(
  item: T,
  fileId: string,
  previous: T[],
  ctx: DriveContext,
): Promise<T[]> {
  const file = await getFile(fileId);
  if (file.mimeType === FOLDER_MIME) return expandFolder(item, fileId, previous, ctx);

  const source = item.link ?? undefined;
  if (isVideo(file)) {
    return [{ ...item, link: videoLink(file.id), source, kind: 'video' }];
  }
  if (isUsableImage(file)) {
    const path = await downloadImage(file, ctx);
    if (path) return [{ ...item, link: path, photo: path, source, kind: 'image' }];
    const old = previous.filter((p) => p.source === item.link);
    return old.length ? old : [item];
  }
  // anything else (pdf, doc ...): it stays a plain link
  return [{ ...item, kind: 'link' }];
}

/**
 * Replaces Drive links of one outputs section with the real images / video links.
 * Items that are not Drive links are returned untouched.
 * `previous` = what the same section held after the last sync (used when Drive fails).
 */
export async function resolveDriveItems<T extends DriveItemLike>(
  items: T[],
  previous: T[],
  ctx: DriveContext,
): Promise<T[]> {
  if (!isDriveImportEnabled()) return items;

  const out: T[] = [];
  for (const item of items) {
    const parsed = item.link ? parseDriveLink(item.link) : null;
    if (!parsed) {
      out.push(item);
      continue;
    }

    try {
      if (parsed.type === 'folder') out.push(...(await expandFolder(item, parsed.id, previous, ctx)));
      else out.push(...(await expandFile(item, parsed.id, previous, ctx)));
    } catch (err) {
      const kept = previous.filter((p) => p.source === item.link);
      const reason = err instanceof Error ? err.message : 'error';
      console.warn(
        `[drive-import] "${item.name}": ${reason} - ${kept.length ? 'kept the old data' : 'nothing stored'}`,
      );
      if (kept.length > 0) out.push(...kept);
      else if (parsed.type === 'file') out.push(item); // a single-file link is still a usable link
    }
  }
  return out;
}