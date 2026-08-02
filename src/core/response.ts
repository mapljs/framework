export interface JsonResponse<T extends {}> extends Response {
  readonly json: <R extends T = T>() => Promise<R>;
}
export interface RawResponse<T extends BodyInit | null> extends Response {
  readonly text: () => Promise<T extends string ? T : T extends null ? '' : string>;
}
export interface RedirectedResponse extends Response {
  readonly redirected: true;
}

export interface AppendHeadersMap {
  vary:
    | 'Origin'
    | 'Accept'
    | 'Accept-Encoding'
    | 'Accept-Language'
    | 'Accept-Charset'
    | 'Access-Control-Request-Method'
    | 'Access-Control-Request-Headers'
    | 'TE'
    | 'Accept-CH'
    | 'Sec-CH-UA'
    | 'Sec-CH-UA-Mobile'
    | 'Sec-CH-UA-Platform'
    | 'Sec-CH-UA-Arch'
    | 'Sec-CH-UA-Bitness'
    | 'Sec-CH-UA-Model'
    | 'Sec-CH-UA-Full-Version'
    | 'Sec-CH-UA-Full-Version-List'
    | 'Sec-CH-Prefers-Color-Scheme'
    | 'Sec-CH-Prefers-Reduced-Motion'
    | 'Sec-CH-Viewport-Width'
    | 'Viewport-Width'
    | 'Width'
    | 'DPR'
    | 'Device-Memory'
    | 'Sec-Fetch-Site'
    | 'Sec-Fetch-Mode'
    | 'Sec-Fetch-Dest'
    | 'Authorization';
}
export interface SetHeadersMap extends Omit<AppendHeadersMap, 'vary'> {
  vary: '*' | AppendHeadersMap['vary'];
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

export class ResponseSender {
  status: number;
  headers: Headers;
  statusText?: string;

  constructor() {
    this.status = 200;
    this.headers = new Headers();
  }

  /**
   * Sets a new value for an existing header in `this.headers`, or adds the header if it does not already exist.
   * @param key
   * @param value
   */
  setHeader<K extends keyof SetHeadersMap>(key: K, value: SetHeadersMap[K] | (string & {})): void;

  /**
   * Sets a new value for an existing header in `this.headers`, or adds the header if it does not already exist.
   * @param key
   * @param value
   */
  setHeader(key: string, value: string): void;
  setHeader(key: string, value: string): void {
    this.headers.set(key, value);
  }

  /**
   * Append a new header pair to `this.headers`.
   * @param key
   * @param value
   */
  appendHeader<K extends keyof AppendHeadersMap>(
    key: K,
    value: AppendHeadersMap[K] | (string & {}),
  ): void;

  /**
   * Append a new header pair to `this.headers`.
   * @param key
   * @param value
   */
  appendHeader(key: string, value: string): void;
  appendHeader(key: string, value: string): void {
    this.headers.append(key, value);
  }

  /**
   * Send the body as is with attached `status`, `headers` and `statusText`.
   */
  body<const T extends BodyInit | null>(body: T): RawResponse<T> {
    return new Response(body, this) as RawResponse<T>;
  }

  /**
   * Send the body as HTML with attached `status`, `headers` and `statusText`.
   */
  html<const T extends BodyInit | null>(body: T): RawResponse<T> {
    this.headers.set('content-type', 'text/html');
    return new Response(body, this) as RawResponse<T>;
  }

  /**
   * Send the body as JSON with attached `status`, `headers` and `statusText`.
   */
  json<const T extends {}>(obj: T): JsonResponse<T> {
    return Response.json(obj, this);
  }

  /**
   * Send server events with attached `status`, `headers` and `statusText`.
   */
  events(body: ReadableStream): Response {
    this.headers.set('content-type', 'text/event-stream');
    this.headers.set('cache-control', 'no-cache');
    this.headers.set('connection', 'keep-alive');
    return new Response(body, this);
  }
}
