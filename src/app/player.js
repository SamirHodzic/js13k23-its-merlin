import { BOOK, PLAYER } from './constants';

export default class Player {
  constructor(x, y) {
    this.img = new Image();
    this.img.src = PLAYER;
    this.wp = new Image();
    this.wp.src = BOOK;
    this.x = x;
    this.y = y;
    this.s = 2;
    this.hp = 100;
    this.mhp = 100;
    this.a = 0;
    this.dm = 10;
    this.cd = 800;
    this.score = 0;
    this.bn = 1;
    this.hps = 0;
    this.hpk = 0;
    this.inc = 0;
  }

  res(x, y) {
    this.x = x;
    this.y = y;
    this.s = 2;
    this.hp = 100;
    this.mhp = 100;
    this.dm = 10;
    this.cd = 800;
    this.score = 0;
    this.bn = 1;
    this.hps = 0;
    this.hpk = 0;
    this.inc = 0;
  }

  pp(p) {
    if (p.k === 'hp') {
      const add = (p.v / 100) * this.mhp;
      this.hp = this.hp + add > this.mhp ? this.mhp : this.hp + add;
    } else if (p.k === 'mhp') {
      this.mhp += p.v;
      this.hp = this.hp + p.v > this.mhp ? this.mhp : this.hp + p.v;
    } else {
      this[p.k] += p.v;
    }
  }

  hpkill() {
    if (this.hpk > 0) {
      const add = this.hp + this.hpk;
      this.hp = add > this.mhp ? this.mhp : add;
    }
  }
}
