export * from '@mapl/router/constants';

export const MAPL = 'm';

// Required dependencies
export const IS_ERR: string = MAPL + 'ie';

/**
 * Store errors
 */
export const ERR: string = MAPL + 'e';

/**
 * Request headers
 */
export const HEADERS: string = MAPL + 'h';

/**
 * Dependency prefix
 */
export const DEP: string = MAPL + 'p';

/**
 * Current context
 */
export const CTX: string = MAPL + 'c';

/**
 * Start async scope
 */
export const ASYNC_START = 'return (async()=>{';

/**
 * End async scope
 */
export const ASYNC_END = '});';
