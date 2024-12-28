class Ghost {
    constructor(x, y, tileSize, color, speed = 1) {
        this.x = x * tileSize;
        this.y = y * tileSize;
        this.tileSize = tileSize;
        this.color = color;
        this.direction = { x: 0, y: 0 };
        this.speed = speed;
        this.lastDirectionChange = 0;
        this.minDirectionChangeInterval = 30; // Minimum frames between direction changes

        // Initialize with a random direction
        this.randomizeDirection();
        console.log(`Ghost ${this.color} initialized at (${x},${y}) with speed ${speed}`);
    }

    update(playerPos, maze) {
        try {
            const currentTile = this.getGridPosition();
            const framesSinceLastChange = performance.now() - this.lastDirectionChange;

            // Check for wall ahead
            const nextX = this.x + this.direction.x * this.speed;
            const nextY = this.y + this.direction.y * this.speed;
            const nextTile = this.getTileFromPosition(nextX, nextY);

            // Change direction if about to hit wall or enough time has passed
            if (this.isCollision(maze, nextTile) || 
                (framesSinceLastChange > this.minDirectionChangeInterval && Math.random() < 0.02)) {

                const availableDirections = this.getAvailableDirections(maze, currentTile);
                if (availableDirections.length > 0) {
                    // Choose a random available direction
                    const newDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                    this.direction = newDirection;
                    this.lastDirectionChange = performance.now();
                    console.log(`Ghost ${this.color} changed direction to (${this.direction.x},${this.direction.y})`);
                }
            }

            // Move if no collision ahead
            if (!this.isCollision(maze, nextTile)) {
                this.x = nextX;
                this.y = nextY;
            }

        } catch (error) {
            console.error(`Ghost ${this.color} movement error:`, error);
            // Recovery: choose new random direction
            this.randomizeDirection();
        }
    }

    getAvailableDirections(maze, currentTile) {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        // Filter out directions that lead to walls
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
        this.lastDirectionChange = performance.now();
        console.log(`Ghost ${this.color} randomized direction to (${this.direction.x},${this.direction.y})`);
    }

    isCollision(maze, tile) {
        try {
            return maze.isWall(Math.floor(tile.x), Math.floor(tile.y));
        } catch (error) {
            console.error(`Ghost ${this.color} collision check error:`, error);
            return true; // Safer to assume collision on error
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