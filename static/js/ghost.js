class Ghost {
    constructor(x, y, tileSize, color, speed = 1) {
        this.x = x * tileSize;
        this.y = y * tileSize;
        this.tileSize = tileSize;
        this.color = color;
        this.direction = { x: 0, y: 0 };
        this.speed = speed;
        this.stuckTimer = 0;

        // Initialize with a random direction
        this.randomizeDirection();

        console.log(`Ghost initialized: Color=${color}, Position=(${x},${y}), Speed=${speed}`);
    }

    update(playerPos, maze) {
        try {
            const currentTile = this.getGridPosition();

            // Occasionally change direction randomly
            if (Math.random() < 0.02) { // 2% chance each frame
                this.randomizeDirection();
            }

            // Check if ghost is stuck
            const nextX = this.x + this.direction.x * this.speed;
            const nextY = this.y + this.direction.y * this.speed;
            const nextTile = this.getTileFromPosition(nextX, nextY);

            if (this.isCollision(maze, nextTile)) {
                this.randomizeDirection();
            } else {
                this.x = nextX;
                this.y = nextY;
            }

        } catch (error) {
            console.error(`Ghost ${this.color} update error:`, error);
            this.randomizeDirection();
        }
    }

    randomizeDirection() {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    isCollision(maze, tile) {
        return maze.isWall(Math.floor(tile.x), Math.floor(tile.y));
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

            // Ghost skirt
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