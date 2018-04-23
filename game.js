'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(item) {
    if (!(item instanceof Vector)) {
      throw new Error("Можно прибавлять к вектору только вектор типа Vector");
    }
    const x = item.x + this.x;
    const y = item.y + this.y;
    return new Vector(x, y);
  }

  times(num) {
    const x = this.x * num;
    const y = this.y * num;
    return new Vector(x, y);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector & size instanceof Vector & speed instanceof Vector)) {
      throw new Error("Можно передать только вектор типа Vector");
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  get type() {
    return 'actor';
  }

  get left() {
    return this.pos.x;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get top() {
    return this.pos.y;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  isIntersect(item) {
    if (!(item  instanceof Actor)) {
      throw new Error("Можно передать только объект типа Actor");
    }
    if (item === this) {
      return false;
    }

    // здесь можно обратить условие и написать просто return ...
    // чтобы обратить условие нужно || заменить на &&
    // а операторы на противоположные <= на >, >= на <
    if (this.top >= item.bottom || this.bottom <= item.top || this.left >= item.right || this.right <= item.left) {
      return false;
    } else {
      return true;
    }
  }

  act() {}
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.status = null;
    this.finishDelay = 1;
    this.height = this.grid.length;
    this.width = Math.max(0, ...grid.map(el => el.length));
    // стрелочная функция короче
    this.player = this.actors.find(function (el) {
      return el.type === 'player';
    });
  }

  isFinished() {
    // скобки можно убрать
    return (this.status !== null && this.finishDelay < 0);
  }

  actorAt(item) {
    if (!(item  instanceof Actor)) {
      throw new Error("Можно передать только объект типа Actor");
    }
    return this.actors.find(el => el.isIntersect(item));
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector && size instanceof Vector)) {
      throw new Error("Можно передать только вектор типа Vector");
    }
    const item = new Actor(position, size);
    if (item.top < 0 || item.left < 0 || item.right > this.width) {
      return 'wall';
    }
    if (item.bottom > this.height) {
      return 'lava';
    }
    // границы лучше вынести в переменные, чтобы не округлять каждый раз
    for (let i = Math.floor(item.top); i < Math.ceil(item.bottom); i++) {
      for (let j = Math.floor(item.left); j < Math.ceil(item.right); j++) {
        if (this.grid[i][j]) {
          return this.grid[i][j];
        }
      }
    }
  }

  removeActor(item) {
    // поиск по массиву идёт 2 раза, может быть лучше просто проверить полученный индекс?
    if (this.actors.includes(item)) {
      const index = this.actors.indexOf(item);
      this.actors.splice(index, 1);
    }
  }

  noMoreActors(item) {
    // стрелочная фукнция короче
    return !(this.actors.some(function(actor) {
      return actor.type === item;
    }));
  }

  playerTouched(obstacle, userActor = {}) {
    if (obstacle === 'lava' || obstacle === 'fireball') {
      this.status = 'lost';
    } else if (obstacle === 'coin' && userActor.type === 'coin') {
      this.removeActor(userActor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(actorsDict = {}) {
    // тут можно использовать оператор spread
    this.actorsDict = Object.assign({}, actorsDict);
  }

  actorFromSymbol(key) {
    return this.actorsDict[key];
  }

  obstacleFromSymbol(obstacle) {
    if (obstacle === 'x') {
      return 'wall';
    } 
    if (obstacle === '!') {
      return 'lava';
    }
  }

  createGrid(plan = []) {
    // в стрелочных функциях можно опустить фигурные скобки и return
    return plan.map(  (item) => {
      return item.split('').map(  (i) => {
        return this.obstacleFromSymbol(i);
      });
    });
  }

  createActors(plan = []) {
    const resultPlan = [];
    for (let i = 0; i < plan.length; i++) {
      for (let j = 0; j < plan[i].length; j++) {
        const item = this.actorsDict[plan[i][j]];
        if (typeof(item) !== 'function') {
          continue;
        }
        const newObj = new item(new Vector(j, i));
        if (newObj instanceof Actor) {
          resultPlan.push(newObj);
        }
      }
    }
    return resultPlan;
  }

  parse(plan) {
    const actors = this.createActors(plan);
    const grid = this.createGrid(plan);
    return(new Level(grid, actors));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0), size = new Vector(1, 1)) {
    super(pos, size, speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    const newPosition = new Vector(this.pos.x, this.pos.y);
    return newPosition.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time = 1, plan = new Level()) {
    const newPosition = this.getNextPosition(time);
    if (!(plan.obstacleAt(newPosition, this.size))) {
      this.pos = newPosition;
    } else {
      this.handleObstacle();
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    const size = new Vector(1, 1);
    const speed = new Vector(2, 0);
    super(pos, speed, size);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    const size = new Vector(1, 1);
    const speed = new Vector(0, 2);
    super(pos, speed, size);
  }
}

class FireRain extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    const size = new Vector(1, 1);
    const speed = new Vector(0, 3);
    super(pos, speed, size);
    this.startPos = pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    super(new Vector(pos.x + 0.2, pos.y + 0.1), new Vector(0.6, 0.6));
    this.startPos = new Vector(pos.x + 0.2, pos.y + 0.1);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    let newPosition = new Vector(this.startPos.x, this.startPos.y);
    this.updateSpring(time);
    return newPosition.plus(this.getSpringVector());
  }

  act(time = 1) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
  }

  get type() {
    return 'player';
  }
}

const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
};

const parser = new LevelParser(actorDict);

loadLevels()
  .then(schemas => {
    return runGame(JSON.parse(schemas), parser, DOMDisplay);
  })
  .then(() => alert('Вы выиграли приз!'));
