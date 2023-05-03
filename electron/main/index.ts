import { app, BrowserWindow, shell, ipcMain, screen, globalShortcut } from "electron";
import { release } from "node:os";
import { join } from "node:path";
import { resolve } from "node:path";
import Stockfish, { IStockfishOptions } from "../utils/Stockfish";
import { Builder, Browser, By, Key, until, WebDriver } from "selenium-webdriver";
import { ServiceBuilder } from "selenium-webdriver/chrome";
require("dotenv").config({
    path: "./.env",
});

process.env.DIST_ELECTRON = join(__dirname, "../");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, "../public") : process.env.DIST;
// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();
// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());
if (!app.requestSingleInstanceLock()) {
    console.log("Another instance is already running");
    app.quit();
    process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
let stockfish: Stockfish | null = null;
function log(...args: any[]) {
    win?.webContents.send("log", ...args);
}
function createStockfish() {
    let stockfishPath = process.env.STOCKFISH_PATH;

    if (!stockfishPath) {
        throw new Error("Stockfish path not found");
    }
    stockfishPath = resolve(process.cwd(), stockfishPath);
    stockfish = new Stockfish(stockfishPath);
    stockfish.setOptions({
        depth: process.env.DEPTH,
        hash: process.env.HASH,
        threads: process.env.THREADS,
        level: process.env.LEVEL,
    });
    stockfish.start();
}

const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

async function createWindow() {
    win = new BrowserWindow({
        title: "Chess.com Tools",
        icon: join(process.env.PUBLIC, "favicon.ico"),
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    win.setSize(250, 400);
    win.setMenuBarVisibility(false);
    win.setAlwaysOnTop(true, "floating", 1);
    const screenHeigth = screen.getPrimaryDisplay().workAreaSize.height;
    const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
    win.setPosition(screenWidth - 250, screenHeigth / 2 - 150);
    win.setResizable(false);
    win.webContents.openDevTools();

    if (url) {
        win.loadURL(url);
        win.webContents.openDevTools();
    } else {
        win.loadFile(indexHtml);
    }
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send("main-process-message", new Date().toLocaleString());
    });

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("https:")) shell.openExternal(url);
        return { action: "deny" };
    });
}

app.whenReady().then(() => {
    // ctrl + i
    globalShortcut.register("CommandOrControl+Space", () => {
        win?.webContents.send("ctrl-space-event");
    });
    createWindow();
});

app.on("window-all-closed", () => {
    win = null;
    if (process.platform !== "darwin") {
        stockfish?.stop();
        app.quit();
    }
});

app.on("second-instance", () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on("activate", () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        createWindow();
    }
});

ipcMain.handle("setOptions", (event, config: IStockfishOptions) => {
    stockfish?.setOptions(config);
    return stockfish?.getOptions();
});
ipcMain.handle("getOptions", (event) => {
    log({
        CHROME_DRIVER_PATH,
        USERNAME,
        PASSWORD,
    });
    return stockfish?.getOptions();
});
ipcMain.handle("restart", (event) => {
    stockfish?.stop();
    createStockfish();
});

let driver: WebDriver | undefined;
let CHROME_DRIVER_PATH = process.env.DRIVER_PATH;
let USERNAME = process.env.EMAIL!;
let PASSWORD = process.env.PASSWORD!;

if (!CHROME_DRIVER_PATH) throw new Error("Chrome driver path not found");
if (!USERNAME) throw new Error("Username not found");
if (!PASSWORD) throw new Error("Password not found");
CHROME_DRIVER_PATH = resolve(process.cwd(), CHROME_DRIVER_PATH);

const getBestMoveScript =
    'const moveList=document.querySelector(".vertical-move-list"),moves=moveList.querySelectorAll(".move"),listPgns=[];moves.forEach(e=>{let o=e.querySelectorAll(".node");o.forEach(e=>{listPgns.push(e.innerText)})});const pgnMoves=listPgns.join(" ");return pgnMoves';
ipcMain.handle("getBestMove", async (event) => {
    const pgnMoves = await driver?.executeScript<string>(getBestMoveScript);
    console.log(pgnMoves);
    if (!pgnMoves) return "";
    const bestMove = await stockfish!.getBestMove(pgnMoves);
    const [cellFrom, cellTo] = getCell(bestMove);
    if (stockfish?.withHighlight) {
        await hightLightCell(cellFrom, "red");
        await hightLightCell(cellTo, "green");
    }
    return bestMove;
});
interface ICell {
    x: number | string;
    y: number | string;
}
async function hightLightCell(cell: ICell, color: string = "red") {
    const script = `
         const chessBoard = document.getElementsByTagName("chess-board")[0];
        const witdh = chessBoard.offsetWidth;
        const height = chessBoard.offsetHeight;
        const cellSize = witdh / 8;
        chessBoard.style.position = "relative";
        const divE = document.createElement("div");
        divE.style.position = "absolute";
        divE.style.width = cellSize + "px";
        divE.style.height = cellSize + "px";
        divE.style.border = "12px solid ${color}";
        divE.style.left = (${cell.x}- 1) * cellSize + "px";
        divE.style.top = (7-(${cell.y}- 1))* cellSize + "px";
        chessBoard.appendChild(divE);
        setTimeout(() => {
            chessBoard.removeChild(divE);
        }, 2000);
        `;
    await driver?.executeScript(script);
}
createStockfish();
ipcMain.handle("setup", async (event) => {
    await driver?.quit();

    driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.get("https://www.chess.com/login");
    await driver?.findElement(By.id("username")).sendKeys(USERNAME);
    await driver?.findElement(By.id("password")).sendKeys(PASSWORD);
    await driver?.findElement(By.id("login")).click();
    createStockfish();
    return true;
});
ipcMain.handle("quit", (event) => {
    stockfish?.stop();
    app.quit();
});
function getCell(move: string) {
    const moveFrom = move.slice(0, 2);
    const moveTo = move.slice(2, 4);
    const map: { [key: string]: string } = {
        a: "1",
        b: "2",
        c: "3",
        d: "4",
        e: "5",
        f: "6",
        g: "7",
        h: "8",
    };

    return [
        {
            x: map[moveFrom[0]],
            y: moveFrom[1],
        },
        {
            x: map[moveTo[0]],
            y: moveTo[1],
        },
    ];
}
app.on("quit", () => {
    stockfish?.stop();
    driver?.quit();
});
process.on("uncaughtException", (err) => {
    console.log(err);
    stockfish?.stop();
    driver?.quit();
    app.quit();
    process.exit(0);
});
