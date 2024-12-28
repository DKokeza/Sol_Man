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
        this.momentum = 0.8;

        // Personality traits based on color
        const personalities = {
            red: { offset: { x: 0, y: 0 }, randomness: 0.1, speed: 1 },      // Direct chaser
            pink: { offset: { x: 4, y: -4 }, randomness: 0.2, speed: 0.9 },  // Predictor
            cyan: { offset: { x: -4, y: 4 }, randomness: 0.3, speed: 0.95 }, // Ambusher
            orange: { offset: { x: 8, y: 8 }, randomness: 0.4, speed: 0.85 } // Random wanderer
        };

        const personality = personalities[color] || personalities.red;
        this.personalityOffset = personality.offset;
        this.randomness = personality.randomness;
        this.baseSpeed = personality.speed * speed;

        console.log(`Ghost initialized: Color=${color}, Position=(${x},${y}), Speed=${this.baseSpeed}`);
    }

    update(playerPos, maze) {
        try {
            const currentTile = this.getGridPosition();

            // Update path less frequently
            this.pathUpdateTimer++;
            if (this.pathUpdateTimer >= 30) {
                this.pathUpdateTimer = 0;
                this.updateTargetTile(playerPos);
            }

            // Stuck detection with improved accuracy
            const currentPosition = { x: this.x, y: this.y };
            const isStuck = Math.abs(currentPosition.x - this.lastPosition.x) < 0.1 &&
                           Math.abs(currentPosition.y - this.lastPosition.y) < 0.1;

            if (isStuck) {
                this.stuckTimer++;
                if (this.stuckTimer > 15) {
                    this.handleStuckState(maze, currentTile);
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
            }

            this.lastPosition = { ...currentPosition };

            // Apply movement with momentum
            if (this.targetTile) {
                const moveDirection = this.getMoveDirectionToTarget(currentTile, maze);
                if (moveDirection) {
                    // Smooth direction changes
                    this.direction.x = this.direction.x * this.momentum + moveDirection.x * (1 - this.momentum);
                    this.direction.y = this.direction.y * this.momentum + moveDirection.y * (1 - this.momentum);
                }
            }

            // Movement and collision handling
            const nextX = this.x + this.direction.x * this.baseSpeed;
            const nextY = this.y + this.direction.y * this.baseSpeed;
            const nextTile = this.getTileFromPosition(nextX, nextY);

            if (!this.isCollision(maze, nextTile)) {
                this.x = nextX;
                this.y = nextY;
                this.lastDirection = { ...this.direction };
            } else {
                this.handleCollision(maze, currentTile);
            }

        } catch (error) {
            console.error(`Ghost ${this.color} update error:`, error);
            // Reset to safe state
            this.direction = { x: 0, y: 0 };
        }
    }

    updateTargetTile(playerPos) {
        try {
            const playerTile = {
                x: Math.floor(playerPos.x / this.tileSize),
                y: Math.floor(playerPos.y / this.tileSize)
            };

            // Add personality influence
            const targetOffset = {
                x: this.personalityOffset.x + (Math.random() * 2 - 1) * this.randomness * 5,
                y: this.personalityOffset.y + (Math.random() * 2 - 1) * this.randomness * 5
            };

            this.targetTile = {
                x: Math.max(0, Math.min(19, playerTile.x + targetOffset.x)),
                y: Math.max(0, Math.min(19, playerTile.y + targetOffset.y))
            };
        } catch (error) {
            console.error(`Ghost ${this.color} target update error:`, error);
            // Keep current target if update fails
        }
    }

    handleStuckState(maze, currentTile) {
        try {
            // Temporarily reduce momentum for better responsiveness
            this.momentum = 0.3;

            // Get valid moves excluding current direction
            const possibleMoves = this.getPossibleMoves(maze, currentTile)
                .filter(move => !(move.x === this.direction.x && move.y === this.direction.y));

            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                this.direction = randomMove;
                this.targetTile = null; // Force path recalculation
            }

            // Restore momentum gradually
            setTimeout(() => {
                this.momentum = 0.8;
            }, 300);

        } catch (error) {
            console.error(`Ghost ${this.color} stuck handling error:`, error);
            this.direction = { x: 0, y: 0 };
        }
    }

    handleCollision(maze, currentTile) {
        try {
            // Try sliding along walls first
            if (!maze.isWall(currentTile.x + Math.sign(this.direction.x), currentTile.y)) {
                this.y = currentTile.y * this.tileSize + this.tileSize / 2;
                this.x += this.direction.x * this.baseSpeed;
                return;
            }
            if (!maze.isWall(currentTile.x, currentTile.y + Math.sign(this.direction.y))) {
                this.x = currentTile.x * this.tileSize + this.tileSize / 2;
                this.y += this.direction.y * this.baseSpeed;
                return;
            }

            // If sliding fails, find new direction
            const possibleMoves = this.getPossibleMoves(maze, currentTile);
            if (possibleMoves.length > 0) {
                const validMoves = possibleMoves.filter(move =>
                    !(move.x === -this.direction.x && move.y === -this.direction.y)
                );
                const movesToUse = validMoves.length > 0 ? validMoves : possibleMoves;
                this.direction = movesToUse[Math.floor(Math.random() * movesToUse.length)];
            } else {
                this.direction = { x: 0, y: 0 };
            }
        } catch (error) {
            console.error(`Ghost ${this.color} collision handling error:`, error);
            this.direction = { x: 0, y: 0 };
        }
    }

    getMoveDirectionToTarget(currentTile, maze) {
        try {
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

                const distance = Math.sqrt(
                    Math.pow(newTile.x - this.targetTile.x, 2) +
                    Math.pow(newTile.y - this.targetTile.y, 2)
                );

                const score = distance * (1 + Math.random() * this.randomness);

                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }

            return bestMove;
        } catch (error) {
            console.error(`Ghost ${this.color} movement calculation error:`, error);
            return null;
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
        try {
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
        } catch (error) {
            console.error(`Ghost ${this.color} drawing error:`, error);
        }
    }
}