class Ghost {
    constructor(x, y, tileSize, color, speed) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.originalColor = color;
        this.color = color;
        this.speed = speed;
        this.originalSpeed = speed;
        this.direction = { x: 0, y: 0 };
        this.isVulnerable = false;
        this.vulnerableTimer = null;
        this.mode = 'scatter';
        this.modeTimer = null;
        this.gridX = Math.floor(x / tileSize);
        this.gridY = Math.floor(y / tileSize);

        // Set initial direction based on ghost color/personality
        this.setInitialDirection();
        console.log(`Ghost ${color} initialized at position (${x}, ${y}) with speed ${speed}`);
    }

    validatePosition(x, y, maze) {
        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);
        return gridX >= 0 && gridX < maze.width && 
               gridY >= 0 && gridY < maze.height && 
               !maze.isWall(gridX, gridY);
    }

    update(playerPos, maze) {
        // Calculate next position
        const nextX = this.x + (this.direction.x * this.speed);
        const nextY = this.y + (this.direction.y * this.speed);

        // Validate next position before moving
        if (!this.validatePosition(nextX, nextY, maze)) {
            console.log(`Ghost ${this.originalColor} attempting new direction at: (${nextX}, ${nextY})`);
            this.chooseNewDirection(playerPos, maze);
            return;
        }

        // Update position
        this.x = nextX;
        this.y = nextY;
        this.gridX = Math.floor(this.x / this.tileSize);
        this.gridY = Math.floor(this.y / this.tileSize);

        // Check if at intersection or hit wall
        if (this.isAtIntersection(maze)) {
            if (this.isVulnerable) {
                this.moveAwayFromPlayer(playerPos, maze);
            } else {
                this.chooseNewDirection(playerPos, maze);
            }
        }
    }

    setInitialDirection() {
        const directions = [
            { x: 1, y: 0 },  // right
            { x: -1, y: 0 }, // left
            { x: 0, y: -1 }, // up
            { x: 0, y: 1 }   // down
        ];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    makeVulnerable(duration) {
        this.isVulnerable = true;
        this.color = '#FF69B4'; // Hot pink for better visibility
        this.speed = this.originalSpeed * 0.5;

        console.log(`Ghost ${this.originalColor} became vulnerable for ${duration}ms`);

        if (this.vulnerableTimer) {
            clearTimeout(this.vulnerableTimer);
        }

        this.vulnerableTimer = setTimeout(() => {
            this.resetVulnerability();
        }, duration);
    }

    resetVulnerability() {
        console.log(`Ghost ${this.originalColor} vulnerability ended`);
        this.isVulnerable = false;
        this.color = this.originalColor;
        this.speed = this.originalSpeed;
        if (this.vulnerableTimer) {
            clearTimeout(this.vulnerableTimer);
            this.vulnerableTimer = null;
        }
    }

    isAtIntersection(maze) {
        let availableMoves = 0;
        const directions = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 }
        ];

        for (const dir of directions) {
            if (this.validatePosition(
                this.x + dir.x * this.tileSize,
                this.y + dir.y * this.tileSize,
                maze
            )) {
                availableMoves++;
            }
        }

        return availableMoves > 2;
    }

    chooseNewDirection(playerPos, maze) {
        const directions = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 }
        ];

        // Filter valid moves
        const validDirections = directions.filter(dir =>
            this.validatePosition(
                this.x + dir.x * this.tileSize,
                this.y + dir.y * this.tileSize,
                maze
            )
        );

        if (validDirections.length > 0) {
            // Choose random valid direction
            this.direction = validDirections[
                Math.floor(Math.random() * validDirections.length)
            ];
            console.log(`Ghost ${this.originalColor} chose new direction: (${this.direction.x}, ${this.direction.y})`);
        } else {
            // If no valid moves, stop
            this.direction = { x: 0, y: 0 };
            console.log(`Ghost ${this.originalColor} stopped due to no valid moves`);
        }
    }

    moveAwayFromPlayer(playerPos, maze) {
        const directions = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 }
        ];

        let maxDistance = -1;
        let bestDirection = null;

        for (const dir of directions) {
            const nextX = this.x + dir.x * this.tileSize;
            const nextY = this.y + dir.y * this.tileSize;

            if (this.validatePosition(nextX, nextY, maze)) {
                const distance = Math.sqrt(
                    Math.pow(nextX - playerPos.x * this.tileSize, 2) +
                    Math.pow(nextY - playerPos.y * this.tileSize, 2)
                );

                if (distance > maxDistance) {
                    maxDistance = distance;
                    bestDirection = dir;
                }
            }
        }

        if (bestDirection) {
            this.direction = bestDirection;
        } else {
            this.chooseNewDirection(playerPos, maze);
        }
    }

    draw(ctx) {
        ctx.save();

        // Handle vulnerable state visuals
        if (this.isVulnerable) {
            ctx.fillStyle = '#FF69B4';
            if (this.vulnerableTimer && 
                this.vulnerableTimer._idleTimeout - (Date.now() - this.vulnerableTimer._idleStart) < 2000) {
                ctx.fillStyle = Math.floor(Date.now() / 250) % 2 === 0 ? '#FF69B4' : '#ffffff';
            }
        } else {
            ctx.fillStyle = this.color;
        }

        // Draw ghost body
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

        // Draw eyes
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

        ctx.restore();
    }
    randomizeDirection(maze) {
        const directions = this.getValidDirections(maze);
        if (directions.length > 0) {
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        }
    }
    getValidDirections(maze) {
        const directions = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
        return directions.filter(dir =>
            !maze.isWall(this.gridX + dir.x, this.gridY + dir.y)
        );
    }
    resetToLastValidPosition() {
        console.log(`Ghost ${this.originalColor} resetting to last valid position`);
        // Ensure ghost is at grid center when resetting
        this.x = this.gridX * this.tileSize;
        this.y = this.gridY * this.tileSize;
        this.setInitialDirection();
    }
}