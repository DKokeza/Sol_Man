class Game {
    constructor() {
        try {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.tileSize = 20;

            this.canvas.width = 400;
            this.canvas.height = 400;

            this.score = 0;
            this.lives = 3;
            this.level = 1;
            this.isInvulnerable = false;
            this.invulnerabilityDuration = 2000;
            this.gameActive = false;  // Changed to false initially
            this.processingCollision = false;
            this.bitcoinPoints = 50;

            console.log('Starting game initialization...');
            this.initializeLevel();
            this.audioManager = new AudioManager();
            this.loadHighScores();
            this.bindControls();

            // Initial render without starting the game loop
            this.draw();

            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error initializing game:', error);
            this.handleGameError(error);
        }
    }

    initializeLevel() {
        try {
            console.log(`Initializing level ${this.level}`);
            this.maze = new Maze(20, 20, this.tileSize);
            this.player = new Player(10 * this.tileSize, 15 * this.tileSize, this.tileSize);

            // Create ghosts with increasing speed based on level
            const baseSpeed = 1 + (this.level - 1) * 0.2; // Speed increases by 20% each level
            this.ghosts = [
                new Ghost(9, 9, this.tileSize, 'red', baseSpeed),
                new Ghost(10, 9, this.tileSize, 'pink', baseSpeed),
                new Ghost(11, 9, this.tileSize, 'cyan', baseSpeed),
                new Ghost(10, 8, this.tileSize, 'orange', baseSpeed)
            ];

            // Update display
            document.getElementById('level').textContent = this.level;
            console.log('Level initialization complete');
        } catch (error) {
            console.error('Error initializing level:', error);
            this.handleGameError();
        }
    }

    nextLevel() {
        try {
            console.log(`Advancing to level ${this.level + 1}`);
            this.level++;
            this.initializeLevel();
            // Give player brief invulnerability when starting new level
            this.isInvulnerable = true;
            setTimeout(() => {
                this.isInvulnerable = false;
                console.log('Invulnerability period ended');
            }, 1000);
        } catch (error) {
            console.error('Error advancing to next level:', error);
            this.handleGameError();
        }
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            try {
                if (!this.gameActive && 
                    (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                     e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                    console.log('First key press detected, starting game');
                    document.getElementById('instructions').classList.add('hidden');
                    this.gameActive = true;
                    this.gameLoop();
                    return;
                }

                if (!this.gameActive) return;

                if (this.audioManager) {
                    this.audioManager.initAudioContext();
                }

                let newDirection = null;
                switch(e.key) {
                    case 'ArrowLeft':
                        newDirection = { x: -1, y: 0 };
                        break;
                    case 'ArrowRight':
                        newDirection = { x: 1, y: 0 };
                        break;
                    case 'ArrowUp':
                        newDirection = { x: 0, y: -1 };
                        break;
                    case 'ArrowDown':
                        newDirection = { x: 0, y: 1 };
                        break;
                }

                if (newDirection) {
                    console.log(`Direction input: ${e.key}`);
                    this.player.setDirection(newDirection);
                }
            } catch (error) {
                console.error('Error in control binding:', error);
                this.handleGameError(error);
            }
        });
    }

    async loadHighScores() {
        try {
            const response = await fetch('/api/scores');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const scores = await response.json();
            console.log('Scores loaded successfully:', scores);

            if (!Array.isArray(scores)) {
                throw new Error('Invalid scores data received');
            }
            this.updateLeaderboard(scores);
        } catch (error) {
            console.error('Error loading high scores:', error);
            const leaderboard = document.getElementById('highScores');
            leaderboard.innerHTML = '<p class="error">Unable to load scores. Please try again later.</p>';
        }
    }

    updateLeaderboard(scores) {
        const leaderboard = document.getElementById('highScores');
        if (!scores || !Array.isArray(scores)) {
            leaderboard.innerHTML = '<p>No scores available</p>';
            return;
        }
        leaderboard.innerHTML = scores.map((score, index) => `
            <div class="score-entry">
                <span>${index + 1}. ${score.name || 'Unknown'}</span>
                <span>${score.score || 0}</span>
            </div>
        `).join('');
    }

    update() {
        if (!this.gameActive) return;

        try {
            // Try to change direction if there's a pending direction change
            this.player.tryChangeDirection(this.maze);

            const nextPos = {
                x: this.player.x + this.player.direction.x * this.player.speed,
                y: this.player.y + this.player.direction.y * this.player.speed
            };

            const gridPos = {
                x: Math.floor(nextPos.x / this.tileSize),
                y: Math.floor(nextPos.y / this.tileSize)
            };

            if (!this.maze.isWall(gridPos.x, gridPos.y)) {
                this.player.update();
                console.log(`Player position updated: (${this.player.x}, ${this.player.y})`);
            }

            // Update ghosts and check collisions
            if (!this.isInvulnerable && !this.processingCollision) {
                for (const ghost of this.ghosts) {
                    ghost.update(gridPos, this.maze);

                    const distance = Math.sqrt(
                        Math.pow(this.player.x - (ghost.x + this.tileSize/2), 2) +
                        Math.pow(this.player.y - (ghost.y + this.tileSize/2), 2)
                    );

                    if (distance < this.tileSize) {
                        console.log('Ghost collision detected');
                        this.handleCollision();
                        break;
                    }
                }
            }

            // Handle dot collection
            if (this.maze.removeDot(gridPos.x, gridPos.y)) {
                this.score += 10;
                if (this.audioManager) {
                    this.audioManager.play('chomp');
                }
                document.getElementById('score').textContent = this.score;
            }

            // Handle bitcoin collection
            if (this.maze.removeBitcoin(gridPos.x, gridPos.y)) {
                this.score += this.bitcoinPoints;
                if (this.audioManager) {
                    this.audioManager.play('chomp');
                }
                document.getElementById('score').textContent = this.score;
            }

            // Check level completion
            if (this.maze.dots.length === 0 && this.maze.bitcoins.length === 0) {
                console.log('Level complete, advancing to next level');
                this.nextLevel();
            }

        } catch (error) {
            console.error('Error in game update:', error);
            this.handleGameError(error);
        }
    }

    handleCollision() {
        if (this.processingCollision) return;

        try {
            this.processingCollision = true;
            this.lives--;
            document.getElementById('lives').textContent = this.lives;

            if (this.audioManager) {
                this.audioManager.play('death');
            }

            if (this.lives <= 0) {
                console.log('Game over - no lives remaining');
                this.gameActive = false;
                this.gameOver();
            } else {
                console.log('Collision detected - resetting positions');
                this.resetPositions();
                this.isInvulnerable = true;
                setTimeout(() => {
                    this.isInvulnerable = false;
                    this.processingCollision = false;
                }, this.invulnerabilityDuration);
            }
        } catch (error) {
            console.error('Error handling collision:', error);
            this.handleGameError(error);
        }
    }

    resetPositions() {
        try {
            this.player.x = 10 * this.tileSize;
            this.player.y = 15 * this.tileSize;
            this.player.direction = { x: 0, y: 0 };
            this.player.nextDirection = null;

            this.ghosts.forEach((ghost, index) => {
                ghost.x = (9 + index) * this.tileSize;
                ghost.y = 9 * this.tileSize;
                ghost.direction = { x: 0, y: 0 };
                ghost.targetTile = null;
            });

            console.log('Positions reset successfully');
        } catch (error) {
            console.error('Error resetting positions:', error);
            this.handleGameError(error);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.maze.draw(this.ctx);

        if (!this.isInvulnerable || Math.floor(Date.now() / 200) % 2) {
            this.player.draw(this.ctx);
        }

        for (const ghost of this.ghosts) {
            ghost.draw(this.ctx);
        }
    }

    gameLoop() {
        if (!this.gameActive) return;

        try {
            requestAnimationFrame(() => {
                try {
                    this.update();
                    this.draw();

                    if (this.gameActive) {
                        this.gameLoop();
                    }
                } catch (error) {
                    console.error('Error in game loop iteration:', error);
                    this.handleGameError(error);
                }
            });
        } catch (error) {
            console.error('Critical error in game loop:', error);
            this.handleGameError(error);
        }
    }

    handleGameError(error) {
        console.error('Game error details:', {
            error: error.message,
            stack: error.stack,
            gameState: {
                active: this.gameActive,
                score: this.score,
                level: this.level,
                playerPos: this.player ? { x: this.player.x, y: this.player.y } : null,
                ghostsCount: this.ghosts ? this.ghosts.length : 0
            }
        });

        // Reset game state
        this.gameActive = false;
        this.processingCollision = false;

        const errorMessage = document.createElement('div');
        errorMessage.className = 'error';
        errorMessage.innerHTML = `
            <p>An error occurred during gameplay.</p>
            <p>Error details: ${error.message}</p>
            <button onclick="location.reload()">Restart Game</button>
        `;
        document.body.appendChild(errorMessage);
    }

    gameOver(won = false) {
        this.gameActive = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
    }
}

async function submitScore() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    const score = parseInt(document.getElementById('finalScore').textContent);

    try {
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: score
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'success') {
            document.getElementById('scoreSubmission').innerHTML = '<p>Score submitted successfully!</p>';
            window.game.loadHighScores();
        } else {
            throw new Error(result.message || 'Failed to submit score');
        }
    } catch (error) {
        console.error('Error submitting score:', error);
        document.getElementById('scoreSubmission').innerHTML = 
            '<p class="error">Failed to submit score. Please try again.</p>';
    }
}

window.addEventListener('load', () => {
    try {
        window.game = new Game();
        console.log('Game loaded successfully');
    } catch (error) {
        console.error('Failed to start game:', error);
        document.body.innerHTML = '<div class="error">Failed to start game. Please refresh the page.</div>';
    }
});

window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default handling
    event.preventDefault();
});