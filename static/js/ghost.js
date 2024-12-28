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

        console.log(`Ghost initialized: Color=${color}, Position=(${x},${y}), Speed=${speed}`);
    }

    update(playerPos, maze) {
        const currentTile = this.getGridPosition();

        // Check if ghost is stuck
        const currentPosition = { x: this.x, y: this.y };
        if (Math.abs(currentPosition.x - this.lastPosition.x) < 0.1 &&
            Math.abs(currentPosition.y - this.lastPosition.y) < 0.1) {
            this.stuckTimer++;
            if (this.stuckTimer > 20) {
                console.log(`Ghost ${this.color} stuck at (${currentPosition.x},${currentPosition.y}), forcing direction change`);
                this.forceNewDirection(maze, currentTile);
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }

        this.lastPosition = { ...currentPosition };

        // Update movement logic
        if (this.mode === 'chase') {
            const possibleMoves = this.getPossibleMoves(maze, currentTile);
            if (possibleMoves.length > 0) {
                const bestMove = this.findBestMove(possibleMoves, playerPos, currentTile, maze);
                if (bestMove) {
                    this.direction = bestMove;
                }
            } else {
                console.log(`Ghost ${this.color} has no valid moves at position (${currentTile.x},${currentTile.y})`);
                this.forceNewDirection(maze, currentTile);
            }
        }

        // Apply movement with improved collision detection
        const nextX = this.x + this.direction.x * this.speed;
        const nextY = this.y + this.direction.y * this.speed;
        const nextTile = {
            x: Math.floor(nextX / this.tileSize),
            y: Math.floor(nextY / this.tileSize)
        };

        // Check both current and next tile for valid movement
        if (!this.isCollision(maze, nextTile)) {
            this.x = nextX;
            this.y = nextY;
            this.lastDirection = { ...this.direction };
        } else {
            console.log(`Ghost ${this.color} collision detected at (${nextTile.x},${nextTile.y})`);
            this.forceNewDirection(maze, currentTile);
        }
    }

    isCollision(maze, tile) {
        // Check if the next position would result in a wall collision
        const tileX = Math.floor(tile.x);
        const tileY = Math.floor(tile.y);
        return maze.isWall(tileX, tileY);
    }

    findBestMove(possibleMoves, playerPos, currentTile, maze) {
        // Filter out the opposite of the last direction to prevent back-and-forth movement
        if (this.lastDirection) {
            possibleMoves = possibleMoves.filter(move =>
                !(move.x === -this.lastDirection.x && move.y === -this.lastDirection.y)
            );
        }

        // If no valid moves after filtering, allow all moves
        if (possibleMoves.length === 0) {
            possibleMoves = this.getPossibleMoves(maze, currentTile);
        }

        let bestMove = possibleMoves[0];
        let shortestDistance = Infinity;

        for (const move of possibleMoves) {
            const newX = currentTile.x + move.x;
            const newY = currentTile.y + move.y;

            const distance = Math.sqrt(
                Math.pow(newX - playerPos.x, 2) +
                Math.pow(newY - playerPos.y, 2)
            );

            // Increase randomness factor significantly
            const randomFactor = Math.random() * 0.6; // Increased randomness
            const adjustedDistance = distance * (1 + randomFactor);

            if (adjustedDistance < shortestDistance) {
                shortestDistance = adjustedDistance;
                bestMove = move;
            }
        }

        return bestMove;
    }

    forceNewDirection(maze, currentTile) {
        const possibleMoves = this.getPossibleMoves(maze, currentTile);
        if (possibleMoves.length > 0) {
            // Exclude the current and opposite directions
            const newMoves = possibleMoves.filter(move => {
                const isCurrentDir = move.x === this.direction.x && move.y === this.direction.y;
                const isOppositeDir = move.x === -this.direction.x && move.y === -this.direction.y;
                return !isCurrentDir && !isOppositeDir;
            });

            // Use filtered moves if available, otherwise use all possible moves
            const movesToUse = newMoves.length > 0 ? newMoves : possibleMoves;
            const randomIndex = Math.floor(Math.random() * movesToUse.length);
            this.direction = movesToUse[randomIndex];
            console.log(`Ghost ${this.color} new direction: (${this.direction.x},${this.direction.y})`);
        } else {
            // If no moves available, stop movement
            this.direction = { x: 0, y: 0 };
            console.log(`Ghost ${this.color} no valid moves available, stopping`);
        }
    }

    getPossibleMoves(maze, currentTile) {
        const moves = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        // Filter out invalid moves and moves that would cause collision
        return moves.filter(move => {
            const newX = currentTile.x + move.x;
            const newY = currentTile.y + move.y;
            return !maze.isWall(newX, newY);
        });
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

    getGridPosition() {
        return {
            x: Math.floor(this.x / this.tileSize),
            y: Math.floor(this.y / this.tileSize)
        };
    }
}