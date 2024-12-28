class Maze {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.grid = [];
        this.dots = [];
        this.powerPellets = [];
        this.bitcoins = []; 
        this.generateMaze();
    }

    generateMaze() {
        const mazeTemplate = [
            "######################",
            "#......B.....P...B.##",
            "#.####.#####.####..#",
            "#.#  #.#   #.#  #..#",
            "#.####.#####.####..#",
            "#........P..........#",
            "#.####.##.##.####..#",
            "#.####.##.##.####..#",
            "#......##B##........#",
            "######.##.##.######",
            "     #.##.##.#     ",
            "######.##.##.######",
            "#......##B##........#",
            "#.####.#####.####..#",
            "#........P..........#",
            "#.####.#####.####..#",
            "#.#  #.#   #.#  #..#",
            "#.####.#####.####..#",
            "#......B.....P...B..#",
            "######################"
        ];

        this.grid = mazeTemplate.map(row => row.split(''));

        // Generate dots, power pellets and bitcoins
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === '.') {
                    this.dots.push({ x, y });
                } else if (this.grid[y][x] === 'B') {
                    this.bitcoins.push({ x, y });
                    this.grid[y][x] = '.';
                } else if (this.grid[y][x] === 'P') {
                    this.powerPellets.push({ x, y });
                    this.grid[y][x] = '.';
                }
            }
        }
    }

    draw(ctx) {
        // Draw walls
        ctx.fillStyle = '#00f';
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === '#') {
                    ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }

        // Draw dots
        ctx.fillStyle = '#fff';
        for (const dot of this.dots) {
            ctx.beginPath();
            ctx.arc(
                dot.x * this.tileSize + this.tileSize / 2,
                dot.y * this.tileSize + this.tileSize / 2,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Draw power pellets (larger, flashing dots)
        const flashingAlpha = (Math.sin(Date.now() / 200) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashingAlpha})`;
        for (const pellet of this.powerPellets) {
            ctx.beginPath();
            ctx.arc(
                pellet.x * this.tileSize + this.tileSize / 2,
                pellet.y * this.tileSize + this.tileSize / 2,
                6,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Draw Solana coins
        for (const bitcoin of this.bitcoins) {
            ctx.fillStyle = '#14F195';
            ctx.beginPath();
            ctx.arc(
                bitcoin.x * this.tileSize + this.tileSize / 2,
                bitcoin.y * this.tileSize + this.tileSize / 2,
                this.tileSize / 3,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = `${this.tileSize/3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                'SOL',
                bitcoin.x * this.tileSize + this.tileSize / 2,
                bitcoin.y * this.tileSize + this.tileSize / 2
            );
        }
    }

    isWall(x, y) {
        return this.grid[y][x] === '#';
    }

    removeDot(x, y) {
        const index = this.dots.findIndex(dot => dot.x === x && dot.y === y);
        if (index !== -1) {
            this.dots.splice(index, 1);
            return true;
        }
        return false;
    }

    removeBitcoin(x, y) {
        const index = this.bitcoins.findIndex(coin => coin.x === x && coin.y === y);
        if (index !== -1) {
            this.bitcoins.splice(index, 1);
            return true;
        }
        return false;
    }

    removePowerPellet(x, y) {
        const index = this.powerPellets.findIndex(pellet => pellet.x === x && pellet.y === y);
        if (index !== -1) {
            this.powerPellets.splice(index, 1);
            return true;
        }
        return false;
    }
}