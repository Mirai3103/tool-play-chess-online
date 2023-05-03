import { useState } from "react";

import Tool from "./Tool";
import Config from "./Config";
import { Tabs } from "@mantine/core";
function App() {
    const [count, setCount] = useState(0);
    return (
        <Tabs defaultValue="tool">
            <Tabs.List>
                <Tabs.Tab value="tool">Tool</Tabs.Tab>
                <Tabs.Tab value="config">Config</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="tool">
                <Tool />
            </Tabs.Panel>
            <Tabs.Panel value="config">
                <Config />
            </Tabs.Panel>
        </Tabs>
    );
}

export default App;
