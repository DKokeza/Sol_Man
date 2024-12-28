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
            if (this.stuckTimer > 20) { // Reduced timer for quicker response
                console.log(`Ghost ${this.color} stuck at (${this.x},${this.y}), forcing direction change`);
                this.forceNewDirection(maze);
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }

        this.lastPosition = { ...currentPosition };

        if (this.mode === 'chase') {
            const possibleMoves = this.getPossibleMoves(maze);
            if (possibleMoves.length > 0) {
                let bestMove = this.findBestMove(possibleMoves, playerPos, currentTile);
                this.direction = bestMove;
            } else {
                console.log(`Ghost ${this.color} has no valid moves at position (${this.x},${this.y})`);
                this.forceNewDirection(maze);
            }
        }

        // Apply movement with wall check
        const nextX = this.x + this.direction.x * this.speed;
        const nextY = this.y + this.direction.y * this.speed;

        const nextTile = {
            x: Math.floor(nextX / this.tileSize),
            y: Math.floor(nextY / this.tileSize)
        };

        // Only move if next position is not a wall
        if (!maze.isWall(nextTile.x, nextTile.y)) {
            this.x = nextX;
            this.y = nextY;
            this.lastDirection = { ...this.direction };
        } else {
            console.log(`Ghost ${this.color} hit wall at (${nextTile.x},${nextTile.y})`);
            this.forceNewDirection(maze);
        }
    }

    findBestMove(possibleMoves, playerPos, currentTile) {
        // Filter out the opposite of the last direction to prevent back-and-forth movement
        if (this.lastDirection) {
            possibleMoves = possibleMoves.filter(move => 
                !(move.x === -this.lastDirection.x && move.y === -this.lastDirection.y)
            );
        }

        // If no valid moves after filtering, allow all moves
        if (possibleMoves.length === 0) {
            possibleMoves = this.getPossibleMoves(maze);
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

    forceNewDirection(maze) {
        const possibleMoves = this.getPossibleMoves(maze);
        if (possibleMoves.length > 0) {
            // Exclude the current direction from possible moves
            const newMoves = possibleMoves.filter(move => 
                move.x !== this.direction.x || move.y !== this.direction.y
            );

            // If we have alternative moves, use them, otherwise use all possible moves
            const movesToUse = newMoves.length > 0 ? newMoves : possibleMoves;

            // Choose a random direction
            const randomIndex = Math.floor(Math.random() * movesToUse.length);
            this.direction = movesToUse[randomIndex];
            console.log(`Ghost ${this.color} new direction: (${this.direction.x},${this.direction.y})`);
        } else {
            console.log(`Ghost ${this.color} unable to find new direction`);
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;

        // Ghost body
        ctx.beginPath();
        ctx.arc(
            this.x + this.tileSize/2,
            this.y + this.tileSize/2,
            this.tileSize/2,
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
            this.x + this.tileSize/3,
            this.y + this.tileSize/2,
            3,
            0,
            Math.PI * 2
        );
        ctx.arc(
            this.x + (this.tileSize * 2/3),
            this.y + this.tileSize/2,
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

    getPossibleMoves(maze) {
        const pos = this.getGridPosition();
        const moves = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        return moves.filter(move => {
            const newX = pos.x + move.x;
            const newY = pos.y + move.y;
            return !maze.isWall(newX, newY);
        });
    }
}