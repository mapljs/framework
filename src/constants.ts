export * from '@mapl/router/constants';

export const MAPL = 'm';

// Required dependencies
export const IS_ERR: string = MAPL + 'ie';

/**
 * Request headers
 */
export const HEADERS: string = MAPL + 'h';

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
