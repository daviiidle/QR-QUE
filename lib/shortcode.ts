import { customAlphabet } from "nanoid";

// URL-safe, no lookalikes (0/O, 1/l/I).
const alphabet = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
export const newShortCode = customAlphabet(alphabet, 10);
