class Player {
    constructor(x, y, tileSize) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.direction = { x: 0, y: 0 };
        this.speed = 2;
        this.radius = tileSize / 2;
        this.mouthOpen = 0;
        this.mouthDir = 1;
        this.nextDirection = null; // Add buffer for next direction
    }

    update() {
        // Apply movement
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;

        // Mouth animation
        this.mouthOpen += 0.1 * this.mouthDir;
        if (this.mouthOpen >= 0.5 || this.mouthOpen <= 0) {
            this.mouthDir *= -1;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotate based on direction
        let angle = 0;
        if (this.direction.x === 1) angle = 0;
        if (this.direction.x === -1) angle = Math.PI;
        if (this.direction.y === -1) angle = -Math.PI/2;
        if (this.direction.y === 1) angle = Math.PI/2;

        ctx.rotate(angle);

        // Draw Pacman
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, this.mouthOpen * Math.PI, (2 - this.mouthOpen) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fillStyle = '#ff0';
        ctx.fill();

        ctx.restore();
    }

    setDirection(dir) {
        // Immediately set the direction if there's no current movement
        if (this.direction.x === 0 && this.direction.y === 0) {
            this.direction = dir;
            return;
        }

        // Store the next direction to be applied when possible
        this.nextDirection = dir;
    }

    tryChangeDirection(maze) {
        if (!this.nextDirection) return;

        const nextPos = {
            x: Math.floor((this.x + this.nextDirection.x * this.tileSize/2) / this.tileSize),
            y: Math.floor((this.y + this.nextDirection.y * this.tileSize/2) / this.tileSize)
        };

        if (!maze.isWall(nextPos.x, nextPos.y)) {
            this.direction = this.nextDirection;
            this.nextDirection = null;
        }
    }

    getGridPosition() {
        return {
            x: Math.floor(this.x / this.tileSize),
            y: Math.floor(this.y / this.tileSize)
        };
    }
}