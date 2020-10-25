import {Hole} from "/web_modules/uhtml.js";
import {icon} from "/web_modules/@fortawesome/fontawesome-svg-core.js";
class FaIcon extends Hole {
  constructor(icon2) {
    super("svg", [icon2], []);
  }
}
export function fa(iconInput) {
  return new FaIcon(icon(iconInput).html[0]);
}
