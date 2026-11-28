import type { Id } from '../core/hook.mts';

interface HeadersMap {
  'set-cookie': never;
  vary:
    | 'origin'
    | 'authorization'
    | 'accept'
    | 'accept-encoding'
    | 'accept-language'
    | 'accept-charset'
    | 'access-control-request-method'
    | 'access-control-request-headers'
    | '*';
  'content-type':
    | 'text/plain'
    | 'text/html'
    | 'text/css'
    | 'text/javascript'
    | 'application/javascript'
    | 'text/csv'
    | 'application/json'
    | 'application/xml'
    | 'text/xml'
    | 'application/yaml'
    | 'application/x-yaml'
    | 'application/ld+json'
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'image/png'
    | 'image/jpeg'
    | 'image/gif'
    | 'image/webp'
    | 'image/avif'
    | 'image/svg+xml'
    | 'image/apng'
    | 'image/bmp'
    | 'image/x-icon'
    | 'image/tiff'
    | 'audio/mpeg'
    | 'audio/wav'
    | 'audio/ogg'
    | 'audio/webm'
    | 'audio/aac'
    | 'audio/flac'
    | 'video/mp4'
    | 'video/webm'
    | 'video/ogg'
    | 'video/x-msvideo'
    | 'video/quicktime'
    | 'video/x-matroska'
    | 'application/pdf'
    | 'application/rtf'
    | 'application/zip'
    | 'application/gzip'
    | 'font/woff'
    | 'font/woff2'
    | 'font/ttf'
    | 'font/otf'
    | 'application/octet-stream'
    | 'application/wasm'
    | 'text/event-stream'
    | 'multipart/mixed'
    | 'multipart/byteranges';
}
type HeadersKey = keyof HeadersMap;

export interface TypedHeaders extends Headers {
  set<K extends HeadersKey>(key: K, value: HeadersMap[K] | (string & {})): void;
  set(key: string, value: string): void;

  append<K extends HeadersKey>(
    key: K,
    value: HeadersMap[K] | (string & {}),
  ): void;
  append(key: string, value: string): void;

  get<K extends HeadersKey>(key: K): HeadersMap[K] | (string & {}) | null;
  get(key: string): string | null;

  has(key: HeadersKey | (string & {})): boolean;
  delete(key: HeadersKey | (string & {})): void;
}

export interface TypedContext extends Required<ResponseInit> {
  headers: TypedHeaders;
}

export { params } from '../core/compiler.mts';
export const request: Id<Request> = 'wintertc:request' as any,
  query: Id<string> = 'wintertc:query' as any,
  context: Id<TypedContext> = 'wintertc:context' as any;
