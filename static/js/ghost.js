class Ghost {
    constructor(x, y, tileSize, color, speed) {
        this.gridX = x;
        this.gridY = y;
        this.x = x * tileSize;
        this.y = y * tileSize;
        this.tileSize = tileSize;
        this.originalColor = color;
        this.color = color;
        this.speed = speed;
        this.originalSpeed = speed;
        this.direction = { x: 0, y: 0 };
        this.isVulnerable = false;
        this.vulnerableTimer = null;

        // Initialize with random direction
        this.randomizeDirection();
        console.log(`Ghost ${color} initialized at (${x}, ${y})`);
    }

    makeVulnerable(duration) {
        this.isVulnerable = true;
        this.color = '#9370DB'; // Changed to medium purple for better visibility
        this.speed = this.originalSpeed * 0.5;

        if (this.vulnerableTimer) {
            clearTimeout(this.vulnerableTimer);
        }

        this.vulnerableTimer = setTimeout(() => {
            this.resetVulnerability();
        }, duration);
    }

    resetVulnerability() {
        this.isVulnerable = false;
        this.color = this.originalColor;
        this.speed = this.originalSpeed;
        if (this.vulnerableTimer) {
            clearTimeout(this.vulnerableTimer);
            this.vulnerableTimer = null;
        }
    }

    update(playerPos, maze) {
        // Move in current direction
        const nextX = this.x + (this.direction.x * this.speed);
        const nextY = this.y + (this.direction.y * this.speed);

        // Calculate next grid position
        const nextGridX = Math.floor(nextX / this.tileSize);
        const nextGridY = Math.floor(nextY / this.tileSize);

        // Check if we hit a wall or reached a grid intersection
        if (maze.isWall(nextGridX, nextGridY) || 
            (this.isAtGridCenter() && Math.random() < 0.3)) {
            this.randomizeDirection();
            return;
        }

        // Update position
        this.x = nextX;
        this.y = nextY;
        this.gridX = Math.floor(this.x / this.tileSize);
        this.gridY = Math.floor(this.y / this.tileSize);
    }

    isAtGridCenter() {
        const centerX = this.gridX * this.tileSize + (this.tileSize / 2);
        const centerY = this.gridY * this.tileSize + (this.tileSize / 2);
        const tolerance = 2;

        return Math.abs(this.x - centerX) < tolerance && 
               Math.abs(this.y - centerY) < tolerance;
    }

    draw(ctx) {
        try {
            // Handle vulnerable state visuals
            if (this.isVulnerable) {
                if (this.vulnerableTimer && 
                    this.vulnerableTimer._idleTimeout - (Date.now() - this.vulnerableTimer._idleStart) < 2000) {
                    this.color = Math.floor(Date.now() / 250) % 2 === 0 ? '#9370DB' : '#ffffff';
                }
            }

            // Draw ghost body
            ctx.fillStyle = this.color;
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

            // Draw eyes (only when not vulnerable)
            if (!this.isVulnerable) {
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
            }
        } catch (error) {
            console.error(`Ghost ${this.color} drawing error:`, error);
        }
    }

    randomizeDirection() {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        // Don't pick the opposite of current direction if possible
        let availableDirections = directions.filter(dir => 
            !(dir.x === -this.direction.x && dir.y === -this.direction.y)
        );

        if (availableDirections.length === 0) {
            availableDirections = directions;
        }

        this.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
    }

    resetToLastValidPosition() {
        // Ensure ghost is at grid center when resetting
        this.x = this.gridX * this.tileSize;
        this.y = this.gridY * this.tileSize;
        this.randomizeDirection();
    }
}