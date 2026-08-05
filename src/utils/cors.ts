/**
 * Allow credentials.
 */
export const allowCredentials = (res: { headers: Headers }): void => {
  res.headers.set('Access-Control-Allow-Credentials', 'true');
};

/**
 * Allow this origin.
 */
export const allowOrigin = (res: { headers: Headers }, origin: string): void => {
  res.headers.set('access-control-allow-origin', origin);
};

/**
 * @param header Headers to expose, can be a single header or headers separated by comma.
 */
export const exposeHeaders = (res: { headers: Headers }, header: string): void => {
  res.headers.append('access-control-expose-headers', header);
};

/**
 * Set how long the CORS options of the **preflight** request can be cached.
 *
 * Use in **preflight** requests.
 */
export const maxAge = (res: { headers: Headers }, age: number): void => {
  res.headers.set('access-control-max-age', '' + age);
};

/**
 * Use in **preflight** requests.
 *
 * @param header Headers to allow, can be a single header or headers separated by comma.
 */
export const allowHeaders = (res: { headers: Headers }, header: string): void => {
  res.headers.append('access-control-allow-headers', header);
};

/**
 * Use in **preflight** requests.
 *
 * @param method Methods to allow, can be a single method or methods separated by comma.
 */
export const allowMethods = (res: { headers: Headers }, method: string): void => {
  res.headers.append('access-control-allow-methods', method);
};

/**
 * Allow all headers listed in `Access-Control-Request-Headers`.
 *
 * Use in **preflight** requests.
 */
export const allowRequestedHeaders = (res: { headers: Headers }, req: Request): void => {
  const requestedHeaders = req.headers.get('access-control-request-headers');
  requestedHeaders !== null && res.headers.append('access-control-allow-headers', requestedHeaders);
};
