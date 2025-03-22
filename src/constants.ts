export const MAPL = 'm';

// Required dependencies
export const CTX_FN: string = MAPL + 'ci';
export const IS_ERR: string = MAPL + 'ie';

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
 * Context initialization statements
 */
export const CREATE_CTX: string = 'let ' + HEADERS + '=[],' + CTX + '=' + CTX_FN + '(' + HEADERS + ');';

/**
 * Start async scope
 */
export const ASYNC_START = 'return (async()=>{';

/**
 * End async scope
 */
export const ASYNC_END = '});';
