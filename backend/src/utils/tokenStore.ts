import crypto from "crypto";
import fs from "fs";
import path from "path";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY ?? "";
  if (hex.length !== 64) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)",
    );
  }
  return Buffer.from(hex, "hex");
}

function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function decrypt(ciphertext: string): string {
  const key = getKey();
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

const STORE_DIR = process.env.UPLOAD_TMP_DIR ?? "/tmp/shorts-uploader";
const STORE_PATH = path.join(STORE_DIR, "tokens.json");

function loadStore(): Record<string, string> {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    if (!fs.existsSync(STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, string>): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store), { mode: 0o600 });
}

export function setToken(key: string, token: object): void {
  const store = loadStore();
  store[key] = encrypt(JSON.stringify(token));
  saveStore(store);
}

export function getToken<T>(key: string): T | null {
  const store = loadStore();
  const encrypted = store[key];
  if (!encrypted) return null;
  try {
    return JSON.parse(decrypt(encrypted)) as T;
  } catch {
    return null;
  }
}

export function deleteToken(key: string): void {
  const store = loadStore();
  delete store[key];
  saveStore(store);
}
