/**
 * Allow credentials.
 */
export const allowCredentials = (headers: Headers): void => {
  headers.set('Access-Control-Allow-Credentials', 'true');
};

/**
 * Allow this origin.
 */
export const allowOrigin = (headers: Headers, origin: string): void => {
  headers.set('access-control-allow-origin', origin);
};

/**
 * @param header Headers to expose, can be a single header or headers separated by comma.
 */
export const exposeHeaders = (headers: Headers, header: string): void => {
  headers.append('access-control-expose-headers', header);
};

/**
 * Set how long the CORS options of the **preflight** request can be cached.
 *
 * Use in **preflight** requests.
 */
export const maxAge = (headers: Headers, age: number): void => {
  headers.set('access-control-max-age', '' + age);
};

/**
 * Use in **preflight** requests.
 *
 * @param header Headers to allow, can be a single header or headers separated by comma.
 */
export const allowHeaders = (headers: Headers, header: string): void => {
  headers.append('access-control-allow-headers', header);
};

/**
 * Use in **preflight** requests.
 *
 * @param method Methods to allow, can be a single method or methods separated by comma.
 */
export const allowMethods = (headers: Headers, method: string): void => {
  headers.append('access-control-allow-methods', method);
};

/**
 * Allow all headers listed in `Access-Control-Request-Headers`.
 *
 * Use in **preflight** requests.
 */
export const allowRequestedHeaders = (headers: Headers, req: Request): void => {
  const requestedHeaders = req.headers.get('access-control-request-headers');
  requestedHeaders !== null && allowHeaders(headers, requestedHeaders);
};
