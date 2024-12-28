class Maze {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.grid = [];
        this.dots = [];
        this.generateMaze();
    }

    generateMaze() {
        const mazeTemplate = [
            "######################",
            "#..................##",
            "#.####.#####.####..#",
            "#.#  #.#   #.#  #..#",
            "#.####.#####.####..#",
            "#....................#",
            "#.####.##.##.####..#",
            "#.####.##.##.####..#",
            "#......##.##........#",
            "######.##.##.######",
            "     #.##.##.#     ",
            "######.##.##.######",
            "#......##.##........#",
            "#.####.#####.####..#",
            "#....................#",
            "#.####.#####.####..#",
            "#.#  #.#   #.#  #..#",
            "#.####.#####.####..#",
            "#....................#",
            "######################"
        ];

        this.grid = mazeTemplate.map(row => row.split(''));
        
        // Generate dots
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === '.') {
                    this.dots.push({ x, y });
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
}
