import { useRef, useState } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { BACKEND_URL } from "../config";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "../icons/Logo";

export function Signin() {
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function signin() {
        const username = usernameRef.current?.value.trim();
        const password = passwordRef.current?.value;

        if (!username || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await axios.post(BACKEND_URL + "/api/v1/auth/login", {
                username,
                password
            });
            const jwt = response.data.token;
            localStorage.setItem("token", jwt);
            navigate("/dashboard");
        } catch (err: any) {
            console.error(err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Unable to sign in. Please check your credentials.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-950 px-4 py-12">
            <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400">
                        <Logo />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Welcome back</h2>
                    <p className="mt-1 text-sm text-slate-400">Sign in to access your Second Brain</p>
                </div>

                <div className="mt-8 space-y-4">
                    <Input 
                        reference={usernameRef} 
                        placeholder="Username" 
                        label="Username" 
                        disabled={isLoading}
                        onKeyDown={(e) => { if (e.key === "Enter") void signin(); }}
                        className="!border-slate-800 !bg-slate-950/40 !text-white focus:!border-violet-500 focus:!ring-violet-950"
                    />
                    <Input 
                        reference={passwordRef} 
                        type="password" 
                        placeholder="Password" 
                        label="Password" 
                        disabled={isLoading}
                        onKeyDown={(e) => { if (e.key === "Enter") void signin(); }}
                        className="!border-slate-800 !bg-slate-950/40 !text-white focus:!border-violet-500 focus:!ring-violet-950"
                    />
                </div>

                {error && (
                    <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div className="mt-6">
                    <Button 
                        onClick={signin} 
                        loading={isLoading} 
                        variant="primary" 
                        text="Sign in" 
                        fullWidth={true} 
                    />
                </div>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="font-semibold text-violet-400 hover:text-violet-300 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
