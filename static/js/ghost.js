class Ghost {
    constructor(x, y, tileSize, color, speed = 1) {
        this.x = x * tileSize;
        this.y = y * tileSize;
        this.tileSize = tileSize;
        this.color = color;
        this.direction = { x: 0, y: 0 };
        this.speed = speed;
        this.mode = 'chase';
        this.stuckTimer = 0;
        this.lastPosition = { x: x * tileSize, y: y * tileSize };
        this.lastDirection = null;
        this.targetTile = null;
        this.pathUpdateTimer = 0;
        this.momentum = 0.8; // Add momentum for smoother movement

        console.log(`Ghost initialized: Color=${color}, Position=(${x},${y}), Speed=${speed}`);
    }

    update(playerPos, maze) {
        const currentTile = this.getGridPosition();

        // Update path less frequently to reduce erratic movement
        this.pathUpdateTimer++;
        if (this.pathUpdateTimer >= 30) { // Update path every 30 frames
            this.pathUpdateTimer = 0;
            this.updateTargetTile(playerPos, maze);
        }

        // Check if ghost is stuck
        const currentPosition = { x: this.x, y: this.y };
        if (Math.abs(currentPosition.x - this.lastPosition.x) < 0.1 &&
            Math.abs(currentPosition.y - this.lastPosition.y) < 0.1) {
            this.stuckTimer++;
            if (this.stuckTimer > 15) { // Reduced timer for quicker response
                this.handleStuckState(maze, currentTile);
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }

        this.lastPosition = { ...currentPosition };

        // Movement logic based on target tile
        if (this.targetTile) {
            const moveDirection = this.getMoveDirectionToTarget(currentTile, maze);
            if (moveDirection) {
                // Apply momentum for smoother direction changes
                this.direction.x = this.direction.x * this.momentum + moveDirection.x * (1 - this.momentum);
                this.direction.y = this.direction.y * this.momentum + moveDirection.y * (1 - this.momentum);
            }
        }

        // Apply movement with improved collision detection
        const nextX = this.x + this.direction.x * this.speed;
        const nextY = this.y + this.direction.y * this.speed;
        const nextTile = this.getTileFromPosition(nextX, nextY);

        if (!this.isCollision(maze, nextTile)) {
            this.x = nextX;
            this.y = nextY;
            this.lastDirection = { ...this.direction };
        } else {
            // If collision detected, try to slide along walls
            if (!this.isCollision(maze, { x: currentTile.x + this.direction.x, y: currentTile.y })) {
                this.y = currentTile.y * this.tileSize + this.tileSize / 2;
                this.x = nextX;
            } else if (!this.isCollision(maze, { x: currentTile.x, y: currentTile.y + this.direction.y })) {
                this.x = currentTile.x * this.tileSize + this.tileSize / 2;
                this.y = nextY;
            } else {
                this.handleCollision(maze, currentTile);
            }
        }
    }

    updateTargetTile(playerPos, maze) {
        const playerTile = {
            x: Math.floor(playerPos.x / this.tileSize),
            y: Math.floor(playerPos.y / this.tileSize)
        };

        // Add some randomness to prevent all ghosts from following the same path
        const randomOffset = {
            x: Math.floor(Math.random() * 3) - 1,
            y: Math.floor(Math.random() * 3) - 1
        };

        this.targetTile = {
            x: playerTile.x + randomOffset.x,
            y: playerTile.y + randomOffset.y
        };
    }

    getMoveDirectionToTarget(currentTile, maze) {
        if (!this.targetTile) return null;

        const possibleMoves = this.getPossibleMoves(maze, currentTile);
        if (possibleMoves.length === 0) return null;

        let bestMove = null;
        let bestScore = Infinity;

        for (const move of possibleMoves) {
            const newTile = {
                x: currentTile.x + move.x,
                y: currentTile.y + move.y
            };

            // Calculate distance to target
            const distance = Math.sqrt(
                Math.pow(newTile.x - this.targetTile.x, 2) +
                Math.pow(newTile.y - this.targetTile.y, 2)
            );

            // Add slight randomness to prevent predictable movement
            const randomFactor = Math.random() * 0.3; // Reduced randomness
            const score = distance * (1 + randomFactor);

            if (score < bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    handleStuckState(maze, currentTile) {
        console.log(`Ghost ${this.color} stuck, finding new path`);

        // Reset momentum when stuck
        this.momentum = 0.2;

        // Find all possible moves excluding the current direction
        const possibleMoves = this.getPossibleMoves(maze, currentTile)
            .filter(move => move.x !== this.direction.x || move.y !== this.direction.y);

        if (possibleMoves.length > 0) {
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.direction = randomMove;
            // Reset target to force path recalculation
            this.targetTile = null;
        }

        // Gradually restore momentum
        setTimeout(() => {
            this.momentum = 0.8;
        }, 500);
    }

    handleCollision(maze, currentTile) {
        const possibleMoves = this.getPossibleMoves(maze, currentTile);
        if (possibleMoves.length > 0) {
            // Prefer moves that aren't opposite to current direction
            const preferredMoves = possibleMoves.filter(move =>
                !(move.x === -this.direction.x && move.y === -this.direction.y)
            );

            const movesToUse = preferredMoves.length > 0 ? preferredMoves : possibleMoves;
            this.direction = movesToUse[Math.floor(Math.random() * movesToUse.length)];
        } else {
            this.direction = { x: 0, y: 0 };
        }
    }

    getPossibleMoves(maze, currentTile) {
        const moves = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        return moves.filter(move => {
            const newX = currentTile.x + move.x;
            const newY = currentTile.y + move.y;
            return !maze.isWall(newX, newY);
        });
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
    }
}