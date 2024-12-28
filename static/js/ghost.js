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
        this.isMoving = false;
        this.targetX = this.x;
        this.targetY = this.y;
        this.isVulnerable = false;
        this.isReturning = false;
        this.blinkStart = 0;
        this.vulnerableTimer = null;

        console.log(`Ghost ${color} initialized at grid (${x}, ${y}), pixel (${this.x}, ${this.y})`);
        this.randomizeDirection();
    }

    makeVulnerable(duration) {
        this.isVulnerable = true;
        this.color = '#2121ff'; // Blue color for vulnerable state
        this.speed = this.originalSpeed * 0.5; // Slow down when vulnerable
        this.blinkStart = Date.now() + (duration - 2000); // Start blinking 2 seconds before end

        // Clear existing timer if any
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
        this.blinkStart = 0;
        if (this.vulnerableTimer) {
            clearTimeout(this.vulnerableTimer);
            this.vulnerableTimer = null;
        }
    }

    update(playerPos, maze) {
        try {
            // If not currently moving, decide on next move
            if (!this.isMoving) {
                this.decideNextMove(maze);
                return;
            }

            // Move towards target position
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                // Reached target, snap to grid
                this.x = this.targetX;
                this.y = this.targetY;
                this.gridX = Math.round(this.x / this.tileSize);
                this.gridY = Math.round(this.y / this.tileSize);
                this.isMoving = false;
            } else {
                // Continue moving towards target
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }

        } catch (error) {
            console.error(`Ghost ${this.color} update error:`, error);
            this.resetToLastValidPosition();
        }
    }

    draw(ctx) {
        try {
            // Handle vulnerable state visuals
            if (this.isVulnerable) {
                const timeLeft = this.vulnerableTimer?._idleStart + this.vulnerableTimer?._idleTimeout - Date.now();
                if (timeLeft < 2000 && timeLeft > 0) {
                    // Blink when vulnerability is about to end
                    this.color = Math.floor(Date.now() / 250) % 2 === 0 ? '#2121ff' : '#ffffff';
                }
            }

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

            // Eyes (white when normal, blue when vulnerable)
            const eyeColor = this.isVulnerable ? this.color : 'white';
            ctx.fillStyle = eyeColor;
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

    decideNextMove(maze) {
        try {
            const possibleDirections = this.getValidDirections(maze);
            if (possibleDirections.length === 0) {
                console.warn(`Ghost ${this.color} has no valid moves at (${this.gridX}, ${this.gridY})`);
                return;
            }

            // Choose random direction excluding current direction if possible
            let availableDirections = possibleDirections.filter(dir =>
                !(dir.x === -this.direction.x && dir.y === -this.direction.y)
            );

            if (availableDirections.length === 0) {
                availableDirections = possibleDirections;
            }

            const newDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];
            this.direction = newDirection;

            // Set new target position
            const targetGridX = this.gridX + newDirection.x;
            const targetGridY = this.gridY + newDirection.y;

            if (this.isValidPosition(maze, targetGridX, targetGridY)) {
                this.targetX = targetGridX * this.tileSize;
                this.targetY = targetGridY * this.tileSize;
                this.isMoving = true;
            }

        } catch (error) {
            console.error(`Ghost ${this.color} movement decision error:`, error);
            this.resetToLastValidPosition();
        }
    }

    getValidDirections(maze) {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        return directions.filter(dir => 
            this.isValidPosition(maze, this.gridX + dir.x, this.gridY + dir.y)
        );
    }

    isValidPosition(maze, gridX, gridY) {
        try {
            if (gridX < 0 || gridY < 0 || gridX >= maze.width || gridY >= maze.height) {
                return false;
            }
            return !maze.isWall(gridX, gridY);
        } catch (error) {
            console.error(`Ghost ${this.color} position validation error:`, error);
            return false;
        }
    }

    resetToLastValidPosition() {
        this.x = this.gridX * this.tileSize;
        this.y = this.gridY * this.tileSize;
        this.isMoving = false;
        this.direction = { x: 0, y: 0 };
        console.log(`Ghost ${this.color} reset to last valid position (${this.gridX}, ${this.gridY})`);
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
}