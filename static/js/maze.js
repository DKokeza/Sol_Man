class Maze {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.grid = [];
        this.dots = [];
        this.bitcoins = []; // New array for Bitcoin coins
        this.generateMaze();
    }

    generateMaze() {
        const mazeTemplate = [
            "######################",
            "#......B.........B.##",
            "#.####.#####.####..#",
            "#.#  #.#   #.#  #..#",
            "#.####.#####.####..#",
            "#....................#",
            "#.####.##.##.####..#",
            "#.####.##.##.####..#",
            "#......##B##........#",
            "######.##.##.######",
            "     #.##.##.#     ",
            "######.##.##.######",
            "#......##B##........#",
            "#.####.#####.####..#",
            "#....................#",
            "#.####.#####.####..#",
            "#.#  #.#   #.#  #..#",
            "#.####.#####.####..#",
            "#......B.........B..#",
            "######################"
        ];

        this.grid = mazeTemplate.map(row => row.split(''));

        // Generate dots and bitcoins
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === '.') {
                    this.dots.push({ x, y });
                } else if (this.grid[y][x] === 'B') {
                    this.bitcoins.push({ x, y });
                    this.grid[y][x] = '.'; // Make the space walkable
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

        // Draw Bitcoin coins
        for (const bitcoin of this.bitcoins) {
            // Draw larger golden circle
            ctx.fillStyle = '#F7931A';
            ctx.beginPath();
            ctx.arc(
                bitcoin.x * this.tileSize + this.tileSize / 2,
                bitcoin.y * this.tileSize + this.tileSize / 2,
                this.tileSize / 3,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw "₿" symbol
            ctx.fillStyle = '#ffffff';
            ctx.font = `${this.tileSize/2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                '₿',
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
}