import { category } from 'measure-loop';
import run from './run.ts';
import overhead from './overhead.ts';

export default run(import.meta, category().it('overhead', overhead));
