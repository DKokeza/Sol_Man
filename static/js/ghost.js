class Ghost {
    constructor(x, y, tileSize, color, speed) {
        this.x = x * tileSize;
        this.y = y * tileSize;
        this.tileSize = tileSize;
        this.color = color;
        this.speed = speed;
        this.direction = { x: 0, y: 0 };
        this.lastDirectionChange = 0;
        this.minDirectionChangeInterval = 30;
        this.lastPosition = { x: this.x, y: this.y };

        // Initialize with a random direction
        this.randomizeDirection();
        console.log(`Ghost ${color} initialized at (${x},${y}) with speed ${speed}`);
    }

    update(playerPos, maze) {
        try {
            // Check if ghost is stuck
            const currentPosition = { x: this.x, y: this.y };
            const isStuck = Math.abs(currentPosition.x - this.lastPosition.x) < 0.1 &&
                           Math.abs(currentPosition.y - this.lastPosition.y) < 0.1;

            if (isStuck || Math.random() < 0.02) { // Change direction if stuck or randomly
                const availableDirections = this.getAvailableDirections(maze);
                if (availableDirections.length > 0) {
                    const newDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                    this.direction = newDirection;
                    console.log(`Ghost ${this.color} changed direction to (${this.direction.x},${this.direction.y})`);
                }
            }

            // Try to move in current direction
            const nextX = this.x + this.direction.x * this.speed;
            const nextY = this.y + this.direction.y * this.speed;
            const nextTile = this.getTileFromPosition(nextX, nextY);

            if (!this.isCollision(maze, nextTile)) {
                this.x = nextX;
                this.y = nextY;
                console.log(`Ghost ${this.color} moved to (${Math.floor(this.x/this.tileSize)},${Math.floor(this.y/this.tileSize)})`);
            } else {
                this.randomizeDirection();
            }

            this.lastPosition = currentPosition;

        } catch (error) {
            console.error(`Ghost ${this.color} update error:`, error);
            this.randomizeDirection();
        }
    }

    getAvailableDirections(maze) {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        const currentTile = this.getGridPosition();
        return directions.filter(dir => {
            const testTile = {
                x: currentTile.x + dir.x,
                y: currentTile.y + dir.y
            };
            return !this.isCollision(maze, testTile);
        });
    }

    randomizeDirection() {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        console.log(`Ghost ${this.color} randomized direction to (${this.direction.x},${this.direction.y})`);
    }

    isCollision(maze, tile) {
        try {
            return maze.isWall(Math.floor(tile.x), Math.floor(tile.y));
        } catch (error) {
            console.error(`Ghost ${this.color} collision check error:`, error);
            return true;
        }
    }

    getTileFromPosition(x, y) {
        return {
            x: Math.floor(x / this.tileSize),
            y: Math.floor(y / this.tileSize)
        };
    }

    getGridPosition() {
        return this.getTileFromPosition(this.x, this.y);
    }

    draw(ctx) {
        try {
            ctx.fillStyle = this.color;

            // Ghost body
            ctx.beginPath();
            ctx.arc(
                this.x + this.tileSize / 2,
                this.y + this.tileSize / 2,
                this.tileSize / 2,
                Math.PI,
                0
            );
            ctx.lineTo(this.x + this.tileSize, this.y + this.tileSize);
            ctx.lineTo(this.x, this.y + this.tileSize);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(
                this.x + this.tileSize / 3,
                this.y + this.tileSize / 2,
                3,
                0,
                Math.PI * 2
            );
            ctx.arc(
                this.x + (this.tileSize * 2 / 3),
                this.y + this.tileSize / 2,
                3,
                0,
                Math.PI * 2
            );
            ctx.fill();

        } catch (error) {
            console.error(`Ghost ${this.color} drawing error:`, error);
        }
    }
}