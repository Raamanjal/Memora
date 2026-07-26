import { useRef, useState } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "../icons/Logo";

export function Signup() {
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    async function signup() {
        const username = usernameRef.current?.value.trim();
        const password = passwordRef.current?.value;

        if (!username || !password) {
            setError("Please fill in all fields.");
            return;
        }

        if (username.length < 3) {
            setError("Username must be at least 3 characters long.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            await axios.post(BACKEND_URL + "/api/v1/auth/signup", {
                username,
                password
            });
            setSuccessMessage("Account created successfully! Redirecting...");
            setTimeout(() => {
                navigate("/signin");
            }, 1500);
        } catch (err: any) {
            console.error(err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data?.errors?.username) {
                setError(err.response.data.errors.username[0]);
            } else if (err.response?.data?.errors?.password) {
                setError(err.response.data.errors.password[0]);
            } else {
                setError("Unable to sign up. Username might already be taken.");
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
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Create an account</h2>
                    <p className="mt-1 text-sm text-slate-400">Start building your personal Second Brain</p>
                </div>

                <div className="mt-8 space-y-4">
                    <Input 
                        reference={usernameRef} 
                        placeholder="Username (min 3 chars)" 
                        label="Username" 
                        disabled={isLoading || !!successMessage}
                        onKeyDown={(e) => { if (e.key === "Enter") void signup(); }}
                        className="!border-slate-800 !bg-slate-950/40 !text-white focus:!border-violet-500 focus:!ring-violet-950"
                    />
                    <Input 
                        reference={passwordRef} 
                        type="password" 
                        placeholder="Password (min 8 chars)" 
                        label="Password" 
                        disabled={isLoading || !!successMessage}
                        onKeyDown={(e) => { if (e.key === "Enter") void signup(); }}
                        className="!border-slate-800 !bg-slate-950/40 !text-white focus:!border-violet-500 focus:!ring-violet-950"
                    />
                </div>

                {error && (
                    <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-sm text-emerald-400">
                        {successMessage}
                    </div>
                )}

                <div className="mt-6">
                    <Button 
                        onClick={signup} 
                        loading={isLoading || !!successMessage} 
                        variant="primary" 
                        text="Sign up" 
                        fullWidth={true} 
                    />
                </div>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link to="/signin" className="font-semibold text-violet-400 hover:text-violet-300 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
