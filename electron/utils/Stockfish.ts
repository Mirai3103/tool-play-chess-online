import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Position } from "kokopu";
export interface IStockfishOptions {
    depth?: number | string;
    threads?: number | string;
    hash?: number | string;
    level?: number | string;
    withHighlight?: boolean;
}
class Stockfish {
    private depth: number | string = 8;
    private hash: number | string = 32;
    private threads: number | string = 2;
    private level: number | string = 3;
    private stockfishProcess: ChildProcessWithoutNullStreams | undefined;
    public withHighlight: boolean = false;
    private static BEST_MOVE_REGEX = /bestmove\s(\w{4})\s?/;

    constructor(private readonly stockfishPath: string) {}
    public setOptions(options: IStockfishOptions) {
        this.depth = options.depth || this.depth;
        this.hash = options.hash || this.hash;
        this.threads = options.threads || this.threads;
        this.level = options.level || this.level;
        this.withHighlight = options.withHighlight || this.withHighlight;
        this.setProcessOptions();
    }
    public getOptions(): IStockfishOptions {
        return {
            depth: this.depth,
            hash: this.hash,
            threads: this.threads,
            level: this.level,
            withHighlight: this.withHighlight,
        };
    }
    private setProcessOptions() {
        this.stockfishProcess?.stdin.write(`setoption name Threads value ${this.threads}\n`);
        this.stockfishProcess?.stdin.write(`setoption name Hash value ${this.hash}\n`);
        this.stockfishProcess?.stdin.write(`setoption name Skill Level value ${this.level}\n`);
    }
    private async newGame() {
        await this.stockfishProcess?.stdin.write(`ucinewgame\n`);
    }
    public start() {
        this.stockfishProcess = spawn(this.stockfishPath);
        this.stockfishProcess.stdin.setDefaultEncoding("utf-8");
        this.stockfishProcess.stderr.on("data", (data) => {
            console.error(data.toString());
        });
        this.stockfishProcess.stdout.on("data", (data) => {
            console.log(data.toString());
        });
        this.stockfishProcess.on("close", (code) => {
            console.log(`Stockfish exited with code ${code}`);
        });

        this.stockfishProcess.stdin.write(`uci\n`);
        this.setProcessOptions();
    }
    public stop() {
        this.stockfishProcess?.stdin.write(`quit\n`);
        this.stockfishProcess?.kill();
        this.stockfishProcess = undefined;
    }
    public async getBestMove(rawPos: string): Promise<string> {
        if (!this.stockfishProcess) {
            this.start();
        }
        await this.newGame();
        const result = await new Promise<string>((resolve, reject) => {
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
        return result as string;
    }

    private getFen(movesStr: string) {
        const position = new Position();
        movesStr.split(" ").forEach((move) => position.play(move));
        return position.fen();
    }
}

export default Stockfish;
