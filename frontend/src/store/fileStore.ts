import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import Cookies from "js-cookie";

axios.defaults.baseURL = 'http://localhost:5000/api';

interface FileStoreState {
    uploadQuestion:(question:string) => void,
    getAnswer:(question:string) => void,
    getResponse:(id:number) => Promise<any>,
    id:number,
    setId:(id:number) => void
}

const useFileStore = create<FileStoreState>()(
    (set, get) => ({
        id:2,
        setId: (id:number) => set(() => ({ id: id })),
        uploadQuestion: (question:string) => {
            axios.post('chat/chat', {
                question: question,
            })
        },
        getAnswer: (question:string) => {
            
        },
        getResponse: async (id:number) => {
            const response = await axios.get(`summary/documents/${id}/summary`)
            return response.data
        },
    })
)

export default useFileStore;