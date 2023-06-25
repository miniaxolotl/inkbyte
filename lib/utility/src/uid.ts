import { uid } from "uid/secure";
import { v4 } from "uuid";

export const gen_id = (length = 24) =>
  uid(length)
    .split("")
    .map((value) =>
      value.match(/[A-Za-z]/) && Math.floor(Math.random() * 2) == 0
        ? value.toLocaleUpperCase()
        : value,
    )
    .join("");

export const uuid = () => v4();

/**
 * Create a random number
 * @param length - length of the number
 * @returns random number
 */
export const rand = (length = 6) =>
  gen_id(length || 6)
    .split("")
    .map((x, index) =>
      index > 0 ? x.charCodeAt(0) % 10 : (x.charCodeAt(0) % 10) + 1,
    )
    .join("");
