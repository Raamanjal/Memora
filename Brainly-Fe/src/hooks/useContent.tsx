import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";

export function useContent() {
    const [contents, setContents] = useState([]);
    const navigate = useNavigate();

    function refresh() {
        axios.get(`${BACKEND_URL}/api/v1/content`, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        })
            .then((response) => {
                setContents(response.data.userContent)
            })
            .catch((error) => {
                console.error("Failed to fetch content:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem("token");
                    navigate("/signin");
                }
            });
    }

    useEffect(() => {
        refresh()
        const interval = setInterval(() => {
            refresh()
        }, 10 * 1000)

        return () => {
            clearInterval(interval);
        }
    }, [])

    return {contents, refresh};
}
