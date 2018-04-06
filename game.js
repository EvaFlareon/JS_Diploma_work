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
		} else if (this.top >= item.bottom || this.bottom <= item.top || this.left >= item.right || this.right <= item.left) {
			return false;
		} else {
			return true;
		}
	}

	act() {}
}

class Level {
	constructor(grid = [], actors = []) {
		this.grid = grid;
		this.actors = actors;
		this.status = null;
		this.finishDelay = 1;
	}

	get height() {
		if (this.grid === []) {
			return 0;
		} else {
			return this.grid.length;
		}
	}

	get width() {
		if (this.grid === []) {
			return 0;
		} else {
			let max = 0;
			for (let i = 0; i < this.grid.length; i++) {
				if (this.grid[i].length > max) {
					max = this.grid[i].length;
				}
			}
			return max;
		}
	}

	get player() {
		for (let i = 0; i < this.actors.length; i++) {
			if (this.actors[i].type === 'player') {
				return this.actors[i];
			}
		}
	}
	
	isFinished() {
		if (this.status !== null && this.finishDelay < 0) {
			return true;
		} else {
			return false;
		}
	}

	actorAt(item) {
		if (!(item  instanceof Actor)) {
			throw new Error("Можно передать только объект типа Actor");
		}
		const foundElement = this.actors.find(function (el) {
			if (el instanceof Actor) {
				return el.isIntersect(item) === true;
			}
		});
		return foundElement;
	}

	obstacleAt(position, size) {
		if (!(position instanceof Vector && size instanceof Vector)) {
			throw new Error("Можно передать только вектор типа Vector");
		}
		const item = new Actor(position, size);
		if (item.top < 0 || item.left < 0 || item.right > this.width) {
			return 'wall';
		} else if (item.bottom > this.height) {
			return 'lava';
		}
		for (let i = 0; i < this.grid.length; i++) {
			for (let j = 0; j < this.grid[i].length; j++) {
				let grid = new Actor(new Vector(j, i));
				if (grid.isIntersect(item)) {
					return this.grid[i][j];
				}
			}
		}
	}

	removeActor(item) {
		const index = this.actors.findIndex( function (el) {
			return el === item;
		});
		this.actors.splice(index, 1);
	}

	noMoreActors(item) {
		const found = this.actors.filter( function (el) {
			if (el) {
				return el.type === item;
			}
		});
		if (found.length === 0) {
			return true;
		} else {
			return false;
		}
	}

	playerTouched(obstacle, user_actor = {}) {
		if (obstacle === 'lava' || obstacle === 'fireball') {
			this.status = 'lost';
		} else if (obstacle === 'coin' && user_actor.type === 'coin') {
			this.removeActor(user_actor);
			if (this.noMoreActors('coin')) {
				this.status = 'won';
			}
		}
	}
}

class LevelParser {
	constructor(actorsDict = {}) {
		this.actorsDict = actorsDict;
	}

	actorFromSymbol(key) {
		if (key === undefined) {
			return undefined;
		} else if (key in this.actorsDict) {
			return this.actorsDict[key];
		} else {
			return undefined;
		}
	}

	obstacleFromSymbol(obstacle) {
		if (obstacle === 'x') {
			return 'wall';
		} else if (obstacle === '!') {
			return 'lava';
		} else {
			return undefined;
		}
	}

	createGrid(plan = []) {
		if (plan.length === 0) {
			return plan;
		} else {
			for (let i = 0; i < plan.length; i++) {
				plan[i] = plan[i].split('');
				for (let j = 0; j < plan[i].length; j++) {
					plan[i][j] = this.obstacleFromSymbol(plan[i][j]);
				}
			}
			return plan;
		}
	}

	createActors(plan = []) {
		const resultPlan = [];
		for (let i = 0; i < plan.length; i++) {
			for (let j = 0; j < plan[i].length; j++) {
				if (plan[i][j] in this.actorsDict) {
					if (typeof(this.actorsDict[plan[i][j]]) !== 'function') {
						continue;
					}
					const newObj = new this.actorsDict[plan[i][j]](new Vector(j, i));
					if (newObj instanceof Actor) {
						resultPlan.push(newObj);
					}
				} else {
					continue;
				}
			}
		}
		return resultPlan;
	}

	parse(plan) {
		const param2 = this.createActors(plan);
		const param1 = this.createGrid(plan);
		return(new Level(param1, param2));
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
		newPosition.x = newPosition.x + this.speed.x * time;
		newPosition.y = newPosition.y + this.speed.y * time;
		return newPosition;
	}

	handleObstacle() {
		this.speed.x = this.speed.x * -1;
		this.speed.y = this.speed.y * -1;
	}

	act(time = 1, plan = new Level()) {
		const newPosition = this.getNextPosition(time);
		if (plan.obstacleAt(newPosition, this.size) === undefined) {
			this.pos = newPosition;
		} else {
			this.handleObstacle();
		}
	}
}

class HorizontalFireball extends Fireball {
	constructor(pos = new Vector()) {
		super(pos, new Vector(2, 0), new Vector(1, 1));
	}

	get type() {
		return 'fireball';
	}
}

class VerticalFireball extends Fireball {
	constructor(pos = new Vector()) {
		super(pos, new Vector(0, 2), new Vector(1, 1));
	}

	get type() {
		return 'fireball';
	}
}

class FireRain extends Fireball {
	constructor(pos = new Vector()) {
		super(pos, new Vector(0, 3), new Vector(1, 1));
		this.startPos = pos;
	}

	get type() {
		return 'fireball';
	}

	handleObstacle() {
		this.speed.x = this.speed.x;
		this.speed.y = this.speed.y;
		this.pos = this.startPos;
	}
}

class Coin extends Actor {
	constructor(pos = new Vector()) {
		super(new Vector(pos.x + 0.2, pos.y + 0.1), new Vector(0.6, 0.6));
		this.startPos = new Vector(pos.x + 0.2, pos.y + 0.1);
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * (2 * Math.PI - 0) + 0;
	}

	get type() {
		return 'coin';
	}

	updateSpring(time = 1) {
		this.spring = this.spring + this.springSpeed * time;
	}

	getSpringVector() {
		const springVector = new Vector(0, Math.sin(this.spring) * this.springDist);
		return springVector;
	}

	getNextPosition(time = 1) {
		let newPosition = new Vector(this.startPos.x, this.startPos.y);
		this.updateSpring(time);
		newPosition = newPosition.plus(this.getSpringVector());
		return newPosition;
	}

	act(time = 1) {
		this.pos = this.getNextPosition(time);
	}
}

class Player extends Actor {
	constructor(pos = new Vector()) {
		super(new Vector(pos.x, pos.y - 0.5), new Vector(0.8, 1.5), new Vector(0, 0));
	}

	get type() {
		return 'player';
	}
}
