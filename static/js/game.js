class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 20;

        this.canvas.width = 400;
        this.canvas.height = 400;

        this.score = 0;
        this.lives = 3;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 2000; 
        this.bitcoinPoints = 50;

        this.maze = new Maze(20, 20, this.tileSize);
        this.player = new Player(10 * this.tileSize, 15 * this.tileSize, this.tileSize);
        this.ghosts = [
            new Ghost(9, 9, this.tileSize, 'red'),
            new Ghost(10, 9, this.tileSize, 'pink'),
            new Ghost(11, 9, this.tileSize, 'cyan'),
            new Ghost(10, 8, this.tileSize, 'orange')
        ];

        this.audioManager = new AudioManager();
        this.loadHighScores();
        this.bindControls();
        this.gameLoop();
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
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

    loadHighScores() {
        fetch('/api/scores')
            .then(response => response.json())
            .then(scores => this.updateLeaderboard(scores))
            .catch(error => console.error('Error loading high scores:', error));
    }

    updateLeaderboard(scores) {
        const leaderboard = document.getElementById('highScores');
        leaderboard.innerHTML = scores.map((score, index) => `
            <div class="score-entry">
                <span>${index + 1}. ${score.name}</span>
                <span>${score.score}</span>
            </div>
        `).join('');
    }

    update() {
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

        if (!this.isInvulnerable) {
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

        if (this.maze.dots.length === 0) {
            this.gameOver(true);
        }
    }

    handleCollision() {
        this.lives--;
        document.getElementById('lives').textContent = this.lives;

        if (this.audioManager) {
            this.audioManager.play('death');
        }

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPositions();
            this.isInvulnerable = true;
            setTimeout(() => {
                this.isInvulnerable = false;
            }, this.invulnerabilityDuration);
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
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
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

    gameOver(won = false) {
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        this.loadHighScores(); 
    }
}

// Functions for handling score submission
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

        if (response.ok) {
            document.getElementById('scoreSubmission').innerHTML = '<p>Score submitted successfully!</p>';
            window.game.loadHighScores();
        } else {
            throw new Error('Failed to submit score');
        }
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('Failed to submit score. Please try again.');
    }
}

window.addEventListener('load', () => {
    window.game = new Game();
});