import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import Cookies from "js-cookie";

axios.defaults.baseURL = 'http://localhost:5000/api';

interface FileStoreState {
    uploadQuestion:(question:string) => void,
    getAnswer:(question:string) => void,
    getDetails:() => void,
}

const useFileStore = create<FileStoreState>()(
    (set, get) => ({
        uploadQuestion: (question:string) => {
            axios.post('uploadQues/upload-question', {
                question: question,
            })
        },
        getAnswer: (question:string) => {
            
        },
        getDetails: () => {
            axios.get('summary/')
        }
    })
)

export default useFileStore;