export class PsstError extends Error {
  code: Number;
  constructor(message: string) {
    super(message);
    this.code = -32000;
    Object.setPrototypeOf(this, PsstError.prototype);
  }
}

export class InvalidSignature extends PsstError {
  constructor() {
    super("Invalid signature");
    this.code = -32001;
    Object.setPrototypeOf(this, InvalidSignature.prototype);
  }
}

export class InviteExpired extends PsstError {
  constructor() {
    super("Invite expired");
    this.code = -32002;
    Object.setPrototypeOf(this, InviteExpired.prototype);
  }
}

export class InvalidInviteSignature extends PsstError {
  constructor() {
    super("Invite is not signed by an admin");
    this.code = -32003;
    Object.setPrototypeOf(this, InvalidInviteSignature.prototype);
  }
}

export class Unauthorized extends PsstError {
  constructor() {
    super("I'm sorry Dave, I'm afraid I can't do that");
    this.code = -32403;
    Object.setPrototypeOf(this, Unauthorized.prototype);
  }
}
