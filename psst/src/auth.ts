import {
  toHexString,
  sha256,
  uint32toUint8Array,
  uint8ArrayToUint32,
} from "./f";
import { Database } from "better-sqlite3";
import nacl from "tweetnacl";

import {
  InvalidSignature,
  InviteExpired,
  InvalidInviteSignature,
} from "./errors";

export enum USER_ROLE {
  ADMIN,
  MEMBER,
}

const SQL_USERS_CREATE = `
CREATE TABLE IF NOT EXISTS users(
  publicKey STRING PRIMARY KEY,
  role INTEGER NOT NULL,
  invite STRING NOT NULL,
  UNIQUE(invite)
)`;

const SQL_USERS_INSERT = `
INSERT INTO users (publicKey, role, invite)
VALUES ($publicKey, $role, $invite)
`;

const SQL_USERS_GET_BY_PUBLIC_KEY = `
SELECT *
FROM users
WHERE publicKey = $publicKey 
`;

const SQL_USERS_HAS_ROLE = `
SELECT COUNT(*) AS count
FROM users
WHERE publicKey = $publicKey
  AND role = $role
`;

export function create(db: Database) {
  db.prepare(SQL_USERS_CREATE).run();
}

export function verify(
  payload: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
) {
  return nacl.sign.detached.verify(payload, signature, publicKey);
}

// Generate an invite. An invite is 133-byte long and has the following form:
// nonce(32bytes) + role(1byte) + expiry(4bytes) + signature(64bytes) + publicKey(32bytes)
export function invite(secretKey: Uint8Array, role: USER_ROLE, expiry: Date) {
  const { publicKey } = nacl.sign.keyPair.fromSecretKey(secretKey);
  const nonce = nacl.randomBytes(32);
  const roleByte = Uint8Array.from([role]);
  const expiryBytes = uint32toUint8Array(Math.round(expiry.getTime() / 1000));

  const message = Buffer.concat([nonce, roleByte, expiryBytes]);
  const signature = nacl.sign.detached(message, secretKey);
  return Uint8Array.from(Buffer.concat([message, signature, publicKey]));
}

export function verifyInvite(db: Database, invite: Uint8Array) {
  const message = invite.slice(0, 37);
  const signature = invite.slice(37, 101);
  const signer = invite.slice(101, 133);

  const expiryBytes = invite.slice(33, 37);
  const expiry = new Date(uint8ArrayToUint32(expiryBytes) * 1000);

  if (!verify(message, signature, signer)) {
    throw new InvalidSignature();
  }
  if (expiry < new Date()) {
    throw new InviteExpired();
  }

  if (!hasRole(db, signer, USER_ROLE.ADMIN)) {
    throw new InvalidInviteSignature();
  }

  return signer;
}

export function join(
  db: Database,
  publicKey: Uint8Array,
  role: USER_ROLE,
  invite: Uint8Array
) {
  verifyInvite(db, invite);
  db.prepare(SQL_USERS_INSERT).run({
    publicKey: toHexString(publicKey),
    role,
    invite: sha256(invite),
  });
}

export function addGenesisAdmin(db: Database, publicKey: Uint8Array) {
  db.prepare(SQL_USERS_INSERT).run({
    publicKey: toHexString(publicKey),
    role: USER_ROLE.ADMIN,
    invite: "genesis",
  });
}

export function getUser(db: Database, publicKey: Uint8Array) {
  return db
    .prepare(SQL_USERS_GET_BY_PUBLIC_KEY)
    .get({ publicKey: toHexString(publicKey) });
}

export function hasRole(db: Database, publicKey: Uint8Array, role: USER_ROLE) {
  return (
    db
      .prepare(SQL_USERS_HAS_ROLE)
      .get({ publicKey: toHexString(publicKey), role }).count === 1
  );
}
