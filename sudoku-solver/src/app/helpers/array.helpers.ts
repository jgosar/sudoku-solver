import { isDefined } from "./common.helpers";

/** Returns a range of numbers from 0 to n-1 */
export function range(n: number): number[] {
    if (!isDefined(n) || n <= 0) {
        return [];
    }
    return [...Array(n).keys()];
}