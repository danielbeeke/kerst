import {Hole} from 'uhtml'
import { icon } from '@fortawesome/fontawesome-svg-core'

class FaIcon extends Hole {
  constructor(icon) {
    super('svg', [icon], []);
  }
}

export function fa (iconInput) {
  return new FaIcon(icon(iconInput).html[0])
}
