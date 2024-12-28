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
            this.gameActive = true;
            this.processingCollision = false;
            this.bitcoinPoints = 50;

            this.initializeLevel();
            this.audioManager = new AudioManager();
            this.loadHighScores();
            this.bindControls();
            this.gameLoop();

            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error initializing game:', error);
            document.body.innerHTML = '<div class="error">Failed to initialize game. Please refresh the page.</div>';
        }
    }

    initializeLevel() {
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
    }

    nextLevel() {
        this.level++;
        this.initializeLevel();
        // Give player brief invulnerability when starting new level
        this.isInvulnerable = true;
        setTimeout(() => {
            this.isInvulnerable = false;
        }, 1000);
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;

            if (this.audioManager) {
                this.audioManager.initAudioContext();
            }

            switch(e.key) {
                case 'ArrowLeft':
                    this.player.setDirection({ x: -1, y: 0 });
                    break;
                case 'ArrowRight':
                    this.player.setDirection({ x: 1, y: 0 });
                    break;
                case 'ArrowUp':
                    this.player.setDirection({ x: 0, y: -1 });
                    break;
                case 'ArrowDown':
                    this.player.setDirection({ x: 0, y: 1 });
                    break;
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
        }

        if (this.maze.removeDot(gridPos.x, gridPos.y)) {
            this.score += 10;
            if (this.audioManager) {
                this.audioManager.play('chomp');
            }
            document.getElementById('score').textContent = this.score;
        }

        if (this.maze.removeBitcoin(gridPos.x, gridPos.y)) {
            this.score += this.bitcoinPoints;
            if (this.audioManager) {
                this.audioManager.play('chomp');
                setTimeout(() => this.audioManager.play('chomp'), 100);
            }
            document.getElementById('score').textContent = this.score;
        }

        if (!this.isInvulnerable && !this.processingCollision) {
            for (const ghost of this.ghosts) {
                ghost.update(gridPos, this.maze);

                const distance = Math.sqrt(
                    Math.pow(this.player.x - (ghost.x + this.tileSize/2), 2) +
                    Math.pow(this.player.y - (ghost.y + this.tileSize/2), 2)
                );

                if (distance < this.tileSize) {
                    this.handleCollision();
                    break;
                }
            }
        }

        // Check if level is complete
        if (this.maze.dots.length === 0 && this.maze.bitcoins.length === 0) {
            this.nextLevel();
        }
    }

    handleCollision() {
        if (this.processingCollision) return;

        this.processingCollision = true;
        this.lives--;
        document.getElementById('lives').textContent = this.lives;

        if (this.audioManager) {
            this.audioManager.play('death');
        }

        if (this.lives <= 0) {
            this.gameActive = false;
            this.gameOver();
        } else {
            this.resetPositions();
            this.isInvulnerable = true;
            setTimeout(() => {
                this.isInvulnerable = false;
                this.processingCollision = false;
            }, this.invulnerabilityDuration);
        }
    }

    resetPositions() {
        this.player.setDirection({ x: 0, y: 0 });
        this.player.x = 10 * this.tileSize;
        this.player.y = 15 * this.tileSize;

        this.ghosts.forEach((ghost, index) => {
            ghost.x = (9 + index) * this.tileSize;
            ghost.y = 9 * this.tileSize;
        });
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
        try {
            if (this.gameActive) {
                this.update();
                this.draw();
                requestAnimationFrame(() => this.gameLoop());
            }
        } catch (error) {
            console.error('Error in game loop:', error);
            this.gameActive = false;
            this.handleGameError();
        }
    }

    handleGameError() {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error';
        errorMessage.innerHTML = `
            <p>An error occurred during gameplay.</p>
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