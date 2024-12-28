class Ghost {
    constructor(x, y, tileSize, color, speed = 1) {
        this.x = x * tileSize;
        this.y = y * tileSize;
        this.tileSize = tileSize;
        this.color = color;
        this.direction = { x: 0, y: 0 };
        this.speed = speed;
        this.mode = 'chase';
    }

    update(playerPos, maze) {
        const currentTile = this.getGridPosition();

        if (this.mode === 'chase') {
            const possibleMoves = this.getPossibleMoves(maze);
            let bestMove = { x: 0, y: 0 };
            let shortestDistance = Infinity;

            for (const move of possibleMoves) {
                const distance = Math.sqrt(
                    Math.pow(currentTile.x + move.x - playerPos.x, 2) +
                    Math.pow(currentTile.y + move.y - playerPos.y, 2)
                );

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    bestMove = move;
                }
            }

            this.direction = bestMove;
        }

        // Apply speed to movement
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;
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