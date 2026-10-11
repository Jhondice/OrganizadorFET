import { PLANS } from '../domain/constants.js';
import * as plan from './plan.js';

/** Plan independiente para las actividades de la especialización. */
export function render() {
  return plan.render(PLANS.ESPECIALIZACION);
}

export function mount(root) {
  plan.mount(root, PLANS.ESPECIALIZACION);
}
