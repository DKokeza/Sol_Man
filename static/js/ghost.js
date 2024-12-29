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
        this.mode = 'scatter'; // New: Add movement mode
        this.modeTimer = null;

        // Set initial direction based on ghost color/personality
        this.setInitialDirection();
        console.log(`Ghost ${color} initialized at (${x}, ${y}) with speed ${speed}`);
    }

    setInitialDirection() {
        // Each ghost gets a different initial direction based on their color
        switch(this.originalColor) {
            case 'red':
                this.direction = { x: 1, y: 0 }; // Right
                break;
            case 'pink':
                this.direction = { x: 0, y: -1 }; // Up
                break;
            case 'cyan':
                this.direction = { x: -1, y: 0 }; // Left
                break;
            case 'orange':
                this.direction = { x: 0, y: 1 }; // Down
                break;
        }
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

    validatePosition(x, y, maze) {
        return x >= 0 && x < maze.width * this.tileSize && 
               y >= 0 && y < maze.height * this.tileSize;
    }

    update(playerPos, maze) {
        // Calculate next position
        const nextX = this.x + (this.direction.x * this.speed);
        const nextY = this.y + (this.direction.y * this.speed);

        // Validate next position before moving
        if (!this.validatePosition(nextX, nextY, maze)) {
            console.log(`Ghost ${this.originalColor} attempted invalid move to: (${nextX}, ${nextY})`);
            this.resetToLastValidPosition();
            return;
        }

        // Calculate next grid position
        const nextGridX = Math.floor(nextX / this.tileSize);
        const nextGridY = Math.floor(nextY / this.tileSize);

        // Check if we hit a wall or at intersection
        if (maze.isWall(nextGridX, nextGridY) || this.isAtIntersection(maze)) {
            if (this.isVulnerable) {
                // When vulnerable, try to move away from player
                this.moveAwayFromPlayer(playerPos, maze);
            } else {
                // Normal movement - choose direction based on mode
                this.chooseNewDirection(playerPos, maze);
            }
            return;
        }

        // Update position
        this.x = nextX;
        this.y = nextY;
        this.gridX = Math.floor(this.x / this.tileSize);
        this.gridY = Math.floor(this.y / this.tileSize);
    }

    isAtIntersection(maze) {
        const centerX = this.gridX * this.tileSize + (this.tileSize / 2);
        const centerY = this.gridY * this.tileSize + (this.tileSize / 2);
        const tolerance = 2;

        // Check if at center of tile
        if (Math.abs(this.x - centerX) < tolerance && Math.abs(this.y - centerY) < tolerance) {
            // Count available directions
            let availableDirections = 0;
            const directions = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];

            for (const dir of directions) {
                if (!maze.isWall(this.gridX + dir.x, this.gridY + dir.y)) {
                    availableDirections++;
                }
            }

            // It's an intersection if more than 2 directions available
            return availableDirections > 2;
        }
        return false;
    }

    moveAwayFromPlayer(playerPos, maze) {
        const directions = this.getValidDirections(maze);
        let bestDirection = null;
        let maxDistance = -1;

        for (const dir of directions) {
            const newX = this.gridX + dir.x;
            const newY = this.gridY + dir.y;

            const distance = Math.sqrt(
                Math.pow(newX - playerPos.x, 2) + 
                Math.pow(newY - playerPos.y, 2)
            );

            if (distance > maxDistance) {
                maxDistance = distance;
                bestDirection = dir;
            }
        }

        if (bestDirection) {
            this.direction = bestDirection;
        } else {
            this.randomizeDirection(maze);
        }
    }

    chooseNewDirection(playerPos, maze) {
        const directions = this.getValidDirections(maze);

        // Don't choose the opposite of current direction if possible
        const filteredDirections = directions.filter(dir => 
            !(dir.x === -this.direction.x && dir.y === -this.direction.y)
        );

        if (filteredDirections.length > 0) {
            this.direction = filteredDirections[Math.floor(Math.random() * filteredDirections.length)];
        } else if (directions.length > 0) {
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        }
    }

    getValidDirections(maze) {
        const directions = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
        return directions.filter(dir => 
            !maze.isWall(this.gridX + dir.x, this.gridY + dir.y)
        );
    }

    draw(ctx) {
        try {
            // Handle vulnerable state visuals
            if (this.isVulnerable) {
                if (this.vulnerableTimer && 
                    this.vulnerableTimer._idleTimeout - (Date.now() - this.vulnerableTimer._idleStart) < 2000) {
                    this.color = Math.floor(Date.now() / 250) % 2 === 0 ? '#FF69B4' : '#ffffff';
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

    randomizeDirection(maze) {
        const directions = this.getValidDirections(maze);
        if (directions.length > 0) {
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        }
    }

    resetToLastValidPosition() {
        console.log(`Ghost ${this.originalColor} resetting to last valid position`);
        // Ensure ghost is at grid center when resetting
        this.x = this.gridX * this.tileSize;
        this.y = this.gridY * this.tileSize;
        this.setInitialDirection();
    }
}