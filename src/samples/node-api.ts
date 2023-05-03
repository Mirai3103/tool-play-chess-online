import { lstat } from "node:fs/promises";
import { cwd } from "node:process";
import { ipcRenderer } from "electron";

ipcRenderer.on("log", (_event, ...args) => {
    console.log("node process log:", ...args);
});

lstat(cwd())
    .then((stats) => {
        console.log("[fs.lstat]", stats);
    })
    .catch((err) => {
        console.error(err);
    });
