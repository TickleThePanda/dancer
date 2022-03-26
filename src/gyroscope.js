export class History {
  constructor(time, change) {
    this.time = time;
    this.change = change;
  }
};

export class GyroscopeAxisState {
  constructor(axis) {
    this.axis = axis;
    this.change = undefined;
    this.current = 0;
    this.history = [];
  }

  add(time, value) {
    this.change = value;
    this.history.push(new History(time, value));
    this.current += value;
  }

  decay(value) {
    this.current *= value;
  }

  averageChange(now, time) {
    let sum = 0;
    let count = 0;
    let i = this.history.length - 1;

    while (i >= 0 && this.history[i].time > now) {
      i--;
    }

    while (i >= 0 && this.history[i].time > now - time) {
      sum += this.history[i].change;
      count++;
      i--;
    }
    return sum / count;
  }

  printToHtml(element) {
    element.innerHTML = `
      <div>${this.axis} current: ${this.change}</div>
      <div>${this.axis}: ${this.current}</div>
    `;
  }

};