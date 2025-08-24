"use client";
import {WS_URL} from "../config";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas() {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYzUxMWM5Mi03ODBjLTRmZDEtYjI0NC00NDFkYTI5MTY1ZTciLCJpYXQiOjE3NTU4NDE1NDN9.W7BnMbudXE7EVpUFmZdepgGSW_RLwNQ22Pf4uBghmSw`)

        ws.onopen = () => {
            setSocket(ws);
            const data = JSON.stringify({
                type: "join_room"
            });
            console.log(data);
            ws.send(data)
        }
        
    }, [])
   
    if (!socket) {
        return <div>
            Connecting to server....
        </div>
    }

    return <div>
        <Canvas socket={socket} />
    </div>
}