import React from "react";
import { TextInput, Group, Button } from "@mantine/core";
import { Switch } from "@mantine/core";
import { ipcRenderer } from "electron";
import { notifications } from "@mantine/notifications";
export interface IStockfishOptions {
    depth?: number | string;
    threads?: number | string;
    hash?: number | string;
    level?: number | string;
    withHighlight?: boolean;
}
export default function Config() {
    const [option, setOption] = React.useState<IStockfishOptions | undefined>();
    React.useEffect(() => {
        ipcRenderer.invoke("getOptions").then((options) => {
            setOption(options);
        });
    }, []);
    const saveOptions = () => {
        ipcRenderer
            .invoke("setOptions", option)
            .then((options) => {
                notifications.show({
                    title: "Options saved",
                    message: "Options saved successfully",
                    color: "indigo",
                });
                setOption(options);
            })
            .catch(() => {
                notifications.show({
                    title: "Error",
                    message: "Error saving options",
                    color: "red",
                });
            });
    };
    const handleChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.currentTarget;
        setOption({ ...option, [name]: value });
    };
    return (
        <div className=" my-2 mx-2">
            <div className="grid grid-cols-2 gap-2">
                <TextInput
                    type="number"
                    size="md"
                    label="Depth"
                    placeholder="Depth"
                    value={option?.depth || 0}
                    name="depth"
                    onChange={handleChanges}
                />
                <TextInput
                    type="number"
                    size="md"
                    label="Level"
                    placeholder="Level"
                    value={option?.level || 0}
                    name="level"
                    onChange={handleChanges}
                />
                <TextInput
                    type="number"
                    size="md"
                    label="Threads"
                    placeholder="Threads"
                    value={option?.threads || 0}
                    name="threads"
                    onChange={handleChanges}
                />
                <TextInput
                    type="number"
                    size="md"
                    label="Hash"
                    placeholder="Hash"
                    value={option?.hash || 0}
                    name="hash"
                    onChange={handleChanges}
                />
                <Switch
                    className="col-span-2 "
                    size="md"
                    label="With highlight ?"
                    checked={option?.withHighlight || false}
                    name="withHighlight"
                    onChange={(e) =>
                        setOption({
                            ...option,
                            withHighlight: e.currentTarget.checked,
                        })
                    }
                />
            </div>
            <Group mt={"md"} position="center">
                <Button className="px-10" size="md" onClick={saveOptions}>
                    Save
                </Button>
            </Group>
        </div>
    );
}
