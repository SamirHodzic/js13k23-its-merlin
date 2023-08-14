export default class Tileset {
  constructor(i, w, h, ctx) {
    this.i = new Image();
    this.i.src = i;
    this.w = w;
    this.h = h;

    this.i.onload = function () {
      ctx.imageSmoothingEnabled = false;
    }
  }
}