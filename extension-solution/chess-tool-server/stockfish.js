import { spawn } from "child_process";
import { Position } from "kokopu";

export default class Stockfish {
    depth = 8;
    hash = 32;
    threads = 2;
    level = 3;
    stockfishProcess = undefined;
    static BEST_MOVE_REGEX = /bestmove\s(\w{4})\s?/;

    constructor(stockfishPath = "stockfish.exe") {
        this.stockfishPath = stockfishPath;
    }
    setOptions(options) {
        this.depth = options.depth || this.depth;
        this.hash = options.hash || this.hash;
        this.threads = options.threads || this.threads;
        this.level = options.level || this.level;
        this.setProcessOptions();
    }

    setProcessOptions() {
        this.stockfishProcess?.stdin.write(`setoption name Threads value ${this.threads}\n`);
        this.stockfishProcess?.stdin.write(`setoption name Hash value ${this.hash}\n`);
        this.stockfishProcess?.stdin.write(`setoption name Skill Level value ${this.level}\n`);
    }
    async newGame() {
        await this.stockfishProcess?.stdin.write(`ucinewgame\n`);
    }
    start() {
        this.stockfishProcess = spawn(this.stockfishPath);
        this.stockfishProcess.stdin.setDefaultEncoding("utf-8");
        // this.stockfishProcess.stderr.on("data", (data) => {
        //     console.error(data.toString());
        // });
        // this.stockfishProcess.stdout.on("data", (data) => {
        //     console.log(data.toString());
        // });
        this.stockfishProcess.on("close", (code) => {
            console.log(`Stockfish exited with code ${code}`);
        });

        this.stockfishProcess.stdin.write(`uci\n`);
        this.setProcessOptions();
    }
    stop() {
        this.stockfishProcess?.stdin.write(`quit\n`);
        this.stockfishProcess?.kill();
        this.stockfishProcess = undefined;
    }
    async getBestMove(rawPos) {
        if (!this.stockfishProcess) {
            this.start();
        }
        await this.newGame();
        const result = await new Promise((resolve, reject) => {
            if (this.stockfishProcess) {
                this.stockfishProcess.stdout.on("data", (data) => {
                    const dataStr = data.toString();
                    const bestMoveMatch = dataStr.match(Stockfish.BEST_MOVE_REGEX);
                    if (bestMoveMatch) {
                        resolve(bestMoveMatch[1]);
                    }
                });
                this.stockfishProcess.stderr.on("data", (data) => {
                    reject(data.toString());
                });
                this.stockfishProcess.stdin.write(`position fen ${this.getFen(rawPos)}\n`);
                this.stockfishProcess.stdin.write(`go depth ${this.depth}\n`);
            }
        });
        return result;
    }

    getFen(movesStr) {
        const position = new Position();
        movesStr.split(" ").forEach((move) => position.play(move));
        return position.fen();
    }
}
