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
    }

    update(playerPos, maze) {
        const currentTile = this.getGridPosition();

        // Check if ghost is stuck
        const currentPosition = { x: this.x, y: this.y };
        if (Math.abs(currentPosition.x - this.lastPosition.x) < 0.1 &&
            Math.abs(currentPosition.y - this.lastPosition.y) < 0.1) {
            this.stuckTimer++;
            if (this.stuckTimer > 60) { // If stuck for 60 frames (about 1 second)
                this.unstuck(maze);
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
        } else {
            // If we hit a wall, try to find a new direction
            this.unstuck(maze);
        }
    }

    findBestMove(possibleMoves, playerPos, currentTile) {
        let bestMove = possibleMoves[0];
        let shortestDistance = Infinity;

        for (const move of possibleMoves) {
            const newX = currentTile.x + move.x;
            const newY = currentTile.y + move.y;

            const distance = Math.sqrt(
                Math.pow(newX - playerPos.x, 2) +
                Math.pow(newY - playerPos.y, 2)
            );

            // Add some randomness to prevent predictable movement
            const randomFactor = Math.random() * 0.2; // 20% random variation
            const adjustedDistance = distance * (1 + randomFactor);

            if (adjustedDistance < shortestDistance) {
                shortestDistance = adjustedDistance;
                bestMove = move;
            }
        }

        return bestMove;
    }

    unstuck(maze) {
        const possibleMoves = this.getPossibleMoves(maze);
        if (possibleMoves.length > 0) {
            // Choose a random direction when stuck
            const randomIndex = Math.floor(Math.random() * possibleMoves.length);
            this.direction = possibleMoves[randomIndex];
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