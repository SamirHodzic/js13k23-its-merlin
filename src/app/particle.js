export default class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.alpha = 1;
    this.radius = 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.045;
  }

  isExpired() {
    return this.alpha <= 0;
  }
}
