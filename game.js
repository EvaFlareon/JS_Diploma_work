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
		let x = item.x + this.x;
		let y = item.y + this.y;
		return new Vector(x, y);
	}
	
	times(num) {
		let x = this.x * num;
		let y = this.y * num;
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
		let item = new Actor(position, size);
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
		let resultPlan = [];
		for (let i = 0; i < plan.length; i++) {
			for (let j = 0; j < plan[i].length; j++) {
				if (plan[i][j] in this.actorsDict) {
					if (typeof(this.actorsDict[plan[i][j]]) !== 'function') {
						continue;
					}
					let newObj = new this.actorsDict[plan[i][j]](new Vector(j, i));
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
		let param2 = this.createActors(plan);
		let param1 = this.createGrid(plan);
		return(new Level(param1, param2));
	}
}
