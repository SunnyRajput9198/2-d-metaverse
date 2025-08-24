import { initDraw } from "../draw/index";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Game } from "../draw/Game";
import { Circle, Pencil, RectangleHorizontalIcon, ArrowUpRight, LineChart, Gem, Eraser,Type } from "lucide-react";

export type Tool = "circle" | "rect" | "pencil" | "arrow" | "line" | "diamond" | "eraser"|"text";

export function Canvas({
    socket
}: {
    socket: WebSocket
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("circle")

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {

        if (canvasRef.current) {
            const g = new Game(canvasRef.current, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }


    }, [canvasRef]);

    return <div style={{
        height: "100vh",
        overflow: "hidden"
    }}>
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
        <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
    </div>
}

function Topbar({selectedTool, setSelectedTool}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
}) {
    return <div style={{
            position: "fixed",
            top: 10,
            left: 10
        }}>
            <div className="flex gap-t">
                <IconButton 
                    onClick={() => setSelectedTool("pencil")}
                    activated={selectedTool === "pencil"}
                    icon={<Pencil />}
                />
                <IconButton 
                    onClick={() => setSelectedTool("rect")}
                    activated={selectedTool === "rect"}
                    icon={<RectangleHorizontalIcon />}
                />
                <IconButton 
                    onClick={() => setSelectedTool("circle")}
                    activated={selectedTool === "circle"}
                    icon={<Circle />}
                />
                <IconButton 
                    onClick={() => setSelectedTool("arrow")}
                    activated={selectedTool === "arrow"}
                    icon={<ArrowUpRight />}
                />
                <IconButton 
                    onClick={() => setSelectedTool("line")}
                    activated={selectedTool === "line"}
                    icon={<LineChart />}
                />
                <IconButton 
                    onClick={() => setSelectedTool("diamond")}
                    activated={selectedTool === "diamond"}
                    icon={<Gem />}
                />
                <IconButton 
                    onClick={() => setSelectedTool("eraser")}
                    activated={selectedTool === "eraser"}
                    icon={<Eraser />}
                />
                 <IconButton onClick={() => setSelectedTool("text")} activated={selectedTool === "text"} icon={<Type />} />
            </div>
        </div>
}
