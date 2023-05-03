# D:\tools\webdriver\chromedriver.exe

from selenium import webdriver

import tkinter as tk
import tkinter.font as tkFont
import chess
from stockfish import Stockfish
from selenium.webdriver.common.by import By
from config import DEPTH, HASH, PASSWORD, SKILL_LEVEL, THREADS, USERNAME, WITH_HIGHTLIGHT
from pynput.keyboard import Key, Listener
stockfish = Stockfish(
    path="./stockfish/stockfish.exe", depth=DEPTH, parameters={"Threads": THREADS, "Hash": HASH, "Skill Level": SKILL_LEVEL})


def toUci(str):
    board = chess.Board()
    UCIstr = ""
    listPgn = str.split(" ")
    for move in listPgn:
        UCIstr += board.push_san(move).uci() + " "
    return UCIstr


def getClassName(move="e2e4"):
    moveFrom = move[0:2]
    moveTo = move[2:4]
    className = "square-"
    # a1 -> 11
    # a2 -> 12
    # a3 -> 13
    map = {"a": "1", "b": "2", "c": "3", "d": "4",
           "e": "5", "f": "6", "g": "7", "h": "8"}
    classNameFrom = className + map[moveFrom[0]] + moveFrom[1]
    classNameTo = className + map[moveTo[0]] + moveTo[1]
    return classNameFrom, classNameTo


class App:

    def __init__(self, root):
        # setting title
        root.title("undefined")
        # setting window size
        width = 165
        height = 250
        screenwidth = root.winfo_screenwidth()
        screenheight = root.winfo_screenheight()
        root.resizable(width=False, height=False)

        root.geometry('%dx%d+%d+%d' % (width, height, screenwidth -
                                       width-20, 165))

        GButton_333 = tk.Button(root)
        GButton_333["bg"] = "#f0f0f0"
        ft = tkFont.Font(family='nunito', size=10)
        GButton_333["font"] = ft
        GButton_333["fg"] = "#000000"
        GButton_333["justify"] = "center"
        GButton_333["text"] = "Set up"
        GButton_333.place(x=2, y=50, width=70, height=25)
        GButton_333["command"] = self.GButton_333_command
        GButton_208 = tk.Button(root)
        GButton_208["bg"] = "#f0f0f0"
        ft = tkFont.Font(family='nunito', size=10)
        GButton_208["font"] = ft
        GButton_208["fg"] = "#000000"
        GButton_208["justify"] = "center"
        GButton_208["text"] = "Best move"
        GButton_208.place(x=92, y=50, width=70, height=25)
        GButton_208["command"] = self.GButton_208_command

        GButton_342 = tk.Button(root)
        GButton_342["bg"] = "#f0f0f0"
        ft = tkFont.Font(family='nunito', size=10)
        GButton_342["font"] = ft
        GButton_342["fg"] = "#000000"
        GButton_342["justify"] = "center"
        GButton_342["text"] = "Quit"
        GButton_342.place(x=2, y=90, width=70, height=25)
        GButton_342["command"] = self.GButton_342_command

        GButton_748 = tk.Button(root)
        GButton_748["bg"] = "#f0f0f0"
        ft = tkFont.Font(family='nunito', size=10)
        GButton_748["font"] = ft
        GButton_748["fg"] = "#000000"
        GButton_748["justify"] = "center"
        GButton_748["text"] = "Login"
        GButton_748.place(x=92, y=90, width=70, height=25)
        GButton_748["command"] = self.GButton_748_command

        GMessage_894 = tk.Label(root)
        self.GMessage_894 = GMessage_894
        ft = tkFont.Font(family='nunito', size=15)
        GMessage_894["font"] = ft
        GMessage_894["fg"] = "red"

        GMessage_894["justify"] = "left"
        GMessage_894["text"] = "Message"
        GMessage_894.place(x=2, y=10, width=140, height=40)
        self.DepthEntry = tk.Entry(root)
        self.DepthEntry.place(x=2, y=130, width=70, height=25)
        self.DepthEntry.insert(0, DEPTH)
        self.DepthEntry["justify"] = "center"
        self.DepthEntry["text"] = "Depth"
        self.DepthEntry["state"] = "disabled"

        self.HashEntry = tk.Entry(root)
        self.HashEntry.place(x=92, y=130, width=70, height=25)
        self.HashEntry.insert(0, HASH)
        self.HashEntry["justify"] = "center"
        self.HashEntry["text"] = "Hash"
        self.HashEntry["state"] = "disabled"

        self.LevelEntry = tk.Entry(root)
        self.LevelEntry.place(x=2, y=170, width=70, height=25)
        self.LevelEntry.insert(0, SKILL_LEVEL)
        self.LevelEntry["justify"] = "center"
        self.LevelEntry["text"] = "Level"
        self.LevelEntry["state"] = "disabled"

        self.ThreadsEntry = tk.Entry(root)
        self.ThreadsEntry.place(x=92, y=170, width=70, height=25)
        self.ThreadsEntry.insert(0, THREADS)
        self.ThreadsEntry["justify"] = "center"
        self.ThreadsEntry["text"] = "Threads"
        self.ThreadsEntry["state"] = "disabled"

        self.listener = Listener(on_press=self.On_Ctrl_Space)
        self.listener.start()

    def On_Ctrl_Space(self, key):
        if key == Key.f9:
            self.GButton_208_command()

    def GButton_333_command(self):
        #
        self.driver = webdriver.Chrome('D:\tools\webdriver\chromedriver.exe')
        self.driver.get('https://www.chess.com/home')
        # self.driver.get('https://play.chess.com/Mwy3F')

    def GButton_208_command(self):
        if not self.driver:
            return
        result = self.driver.execute_script(
            )
        uci = toUci(result).split(" ")
        stockfish.set_position(uci)
        bestMove = stockfish.get_best_move()
        self.GMessage_894["text"] = bestMove
        classNameFrom, classNameTo = getClassName(bestMove)

        if WITH_HIGHTLIGHT:
            self.driver.execute_script(
                f'const a = document.querySelector(".board .{classNameFrom}"); a.style.backgroundColor="red"; setTimeout(()=>{{a.style.backgroundColor="";}}, 2000);')

    def GButton_342_command(self):
        # exit
        self.listener.stop()
        self.driver.quit()
        exit()

    def GButton_748_command(self):
        self.driver.find_element(By.ID, "username").send_keys(USERNAME)
        self.driver.find_element(By.ID, "password").send_keys(PASSWORD)
        self.driver.find_element(By.ID, "login").click()


if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()
