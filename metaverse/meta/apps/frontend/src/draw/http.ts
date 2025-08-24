import { BACKEND_URL } from "../config";
import axios from "axios";

export async function getExistingShapes() {
    const res = await axios.get(`${BACKEND_URL}/chats`);
    const messages = res.data.messages;

    const shapes = messages.map((x: {message: string}) => {
        const messageData = JSON.parse(x.message)
        return messageData.shape;
    })

    return shapes;
}