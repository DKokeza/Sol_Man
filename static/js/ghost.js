class Ghost {
    constructor(x, y, tileSize, color, speed) {
        this.x = x * tileSize;
        this.y = y * tileSize;
        this.tileSize = tileSize;
        this.color = color;
        this.speed = speed;
        this.direction = { x: 0, y: 0 };
        this.movementTimer = 0;

        // Debug info
        console.log(`Ghost ${color} created at position (${x}, ${y})`);
        this.randomizeDirection();
    }

    update(playerPos, maze) {
        try {
            this.movementTimer++;

            // Change direction periodically or when hitting a wall
            if (this.movementTimer >= 60 || this.isWallAhead(maze)) {
                this.randomizeDirection();
                this.movementTimer = 0;
                console.log(`Ghost ${this.color} changing direction to (${this.direction.x}, ${this.direction.y})`);
            }

            // Calculate next position
            const nextX = this.x + this.direction.x * this.speed;
            const nextY = this.y + this.direction.y * this.speed;

            // Validate move
            const nextTile = this.getTileFromPosition(nextX, nextY);
            if (!this.isCollision(maze, nextTile)) {
                // Store previous position for logging
                const prevX = Math.floor(this.x / this.tileSize);
                const prevY = Math.floor(this.y / this.tileSize);

                // Update position
                this.x = nextX;
                this.y = nextY;

                const newX = Math.floor(this.x / this.tileSize);
                const newY = Math.floor(this.y / this.tileSize);

                // Log only when changing tiles
                if (prevX !== newX || prevY !== newY) {
                    console.log(`Ghost ${this.color} moved from (${prevX}, ${prevY}) to (${newX}, ${newY})`);
                }
            } else {
                console.log(`Ghost ${this.color} blocked by wall at (${Math.floor(nextX/this.tileSize)}, ${Math.floor(nextY/this.tileSize)})`);
                this.randomizeDirection();
            }
        } catch (error) {
            console.error(`Ghost ${this.color} update error:`, error);
            // Recovery action
            this.randomizeDirection();
        }
    }

    isWallAhead(maze) {
        const nextX = this.x + this.direction.x * this.speed * 2; // Look 2 steps ahead
        const nextY = this.y + this.direction.y * this.speed * 2;
        const nextTile = this.getTileFromPosition(nextX, nextY);
        return this.isCollision(maze, nextTile);
    }

    randomizeDirection() {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        // Avoid choosing same direction
        const currentDir = this.direction;
        const newDirections = directions.filter(dir => 
            !(dir.x === currentDir.x && dir.y === currentDir.y));

        this.direction = newDirections[Math.floor(Math.random() * newDirections.length)];
        console.log(`Ghost ${this.color} new direction: (${this.direction.x}, ${this.direction.y})`);
    }

    isCollision(maze, tile) {
        try {
            return maze.isWall(Math.floor(tile.x), Math.floor(tile.y));
        } catch (error) {
            console.error(`Ghost ${this.color} collision check error:`, error);
            return true; // Safer to assume collision
        }
    }

    getTileFromPosition(x, y) {
        return {
            x: x / this.tileSize,
            y: y / this.tileSize
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