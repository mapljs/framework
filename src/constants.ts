export * from '@mapl/router/constants';

export const MAPL = 'm';

// Required dependencies
export const IS_ERR: string = MAPL + 'e';

/**
 * Request headers
 */
export const HEADERS: string = MAPL + 'h';

/**
 * Start async scope
 */
export const ASYNC_START = 'return (async()=>{';

/**
 * End async scope
 */
export const ASYNC_END = '})()';
