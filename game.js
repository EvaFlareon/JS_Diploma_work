'use strict';

class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	plus(item) {
		if (item instanceof Vector) {
			let x = item.x + this.x;
			let y = item.y + this.y;
			return new Vector(x, y);
		} else {
			throw new Error("Можно прибавлять к вектору только вектор типа Vector");
		}
	}
	
	times(num) {
		let x = this.x * num;
		let y = this.y * num;
		return new Vector(x, y);
	}
}

class Actor {
	constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
		if (pos instanceof Vector & size instanceof Vector & speed instanceof Vector) {
			this.pos = pos;
			this.size = size;
			this.speed = speed;
			this.act = function() {};
		} else {
			throw new Error("Можно передать только вектор типа Vector");
		}
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
		if (item  instanceof Actor) {
			if (item === this) {
				return false;
			} else if (this.top >= item.bottom || this.bottom <= item.top || this.left >= item.right || this.right <= item.left) {
				return false;
			} else {
				return true;
			}
		} else {
			throw new Error("Можно передать только объект типа Actor");
		}
	}
}

class Level {
	constructor(grid, actors) {
		this.grid = grid;
		this.actors = actors;
		this.status = null;
		this.finishDelay = 1;
	}

	get height() {
		if (this.grid === undefined) {
			return 0;
		} else {
			return this.grid.length;
		}
	}

	get width() {
		if (this.grid === undefined) {
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
		if (item  instanceof Actor) {
			if (this.grid === undefined) {
				return undefined;
			} else {
				for (let i = 0; i < this.actors.length; i++) {
					if (this.actors[i].isIntersect(item)) {
						return this.actors[i];
					} else {
						return undefined;
					}
				}
			}
		} else {
			throw new Error("Можно передать только объект типа Actor");
		}
	}
}
