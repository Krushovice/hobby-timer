import fs from 'fs'
import path from 'path'

const HOSTS_PATH = 'C:\\Windows\\System32\\drivers\\etc\\hosts'
const BLOCK_MARKER = '# neuro-guard-block'
const YOUTUBE_DOMAINS = ['youtube.com', 'www.youtube.com', 'youtu.be']

function buildBlockEntries(): string {
  return YOUTUBE_DOMAINS
    .map(d => `127.0.0.1 ${d} ${BLOCK_MARKER}`)
    .join('\n')
}

export function blockYoutube(): void {
  const current = fs.readFileSync(HOSTS_PATH, 'utf-8')
  if (current.includes(BLOCK_MARKER)) return // already blocked

  const updated = current.trimEnd() + '\n\n' + buildBlockEntries() + '\n'
  fs.writeFileSync(HOSTS_PATH, updated, 'utf-8')
}

export function unblockYoutube(): void {
  const current = fs.readFileSync(HOSTS_PATH, 'utf-8')
  const filtered = current
    .split('\n')
    .filter(line => !line.includes(BLOCK_MARKER))
    .join('\n')
  fs.writeFileSync(HOSTS_PATH, filtered, 'utf-8')
}

export function scheduleUnblock(minutes: number): void {
  blockYoutube()
  setTimeout(() => unblockYoutube(), minutes * 60 * 1000)
}
