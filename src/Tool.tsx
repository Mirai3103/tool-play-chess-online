import { Box, Button } from "@mantine/core";
import React from "react";
import { Badge } from "@mantine/core";
import { Loader } from "@mantine/core";
import { ipcRenderer } from "electron";
export default function Tool() {
    const [setupLoading, setSetupLoading] = React.useState(false);
    const [getMoveLoading, setGetMoveLoading] = React.useState(false);
    const [resetLoading, setResetLoading] = React.useState(false);
    const [move, setMove] = React.useState("");
    const moveBtnRef = React.useRef<HTMLButtonElement>(null);
    React.useEffect(() => {
        ipcRenderer.on("ctrl-space-event", () => {
            if (moveBtnRef.current && !moveBtnRef.current.disabled) {
                moveBtnRef.current.click();
            }
        });
        return () => {
            ipcRenderer.removeAllListeners("ctrl-space-event");
        };
    });
    const onSetup = () => {
        setSetupLoading(true);
        ipcRenderer
            .invoke("setup")
            .then((res: any) => {
                setSetupLoading(false);
                console.log(res);
            })
            .catch((err) => {
                console.log("error", err);
                setSetupLoading(false);
            });
    };
    const onGetMove = () => {
        setGetMoveLoading(true);
        ipcRenderer
            .invoke("getBestMove")
            .then((res: string) => {
                setGetMoveLoading(false);
                setMove(res);
                console.log(res);
            })
            .catch(() => {
                console.log("error");
                setGetMoveLoading(false);
            });
    };
    const onReset = () => {
        setResetLoading(true);
        ipcRenderer
            .invoke("restart")
            .then((res: string) => {
                setResetLoading(false);
            })
            .catch(() => {
                console.log("error");
                setResetLoading(false);
            });
    };

    return (
        <div className="mx-2 my-4">
            <div className="flex flex-col items-center justify-center">
                {setupLoading || getMoveLoading || resetLoading ? (
                    <Box bg={"indigo.1"} className="flex px-16 rounded-3xl py-2 justify-center items-center">
                        <Loader />
                    </Box>
                ) : (
                    <Badge className="text-2xl flex w-48 h-12" size="xl">
                        {move}
                    </Badge>
                )}
            </div>
            <div className=" mt-8 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-2 ">
                    <Button size="md" onClick={onSetup} disabled={setupLoading}>
                        Setup
                    </Button>
                    <Button size="md" onClick={onGetMove} disabled={getMoveLoading} ref={moveBtnRef}>
                        Move
                    </Button>
                    <Button size="md">Quit</Button>
                    <Button size="md" onClick={onReset} disabled={resetLoading}>
                        Reset
                    </Button>
                </div>
            </div>
        </div>
    );
}
