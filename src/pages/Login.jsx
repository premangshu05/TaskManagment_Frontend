import { useState } from "react";
import api from "../services/api";
import {useNavigate} from "react-router-dom";

function Login(){
    const [emailOrUsername,setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [error, setError] = useState("");

    const handleLogin = async(e)=>{
        e.preventDefault();
        setError("");
        try{
            const res = await api.post("/auth/login",{
                username:emailOrUsername,
                password,
            });
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard");
        }
        catch(err){
            setError("Invalid credentials. Please try again.");
        }
    };

    return(
        <div className="h-screen w-screen flex bg-gray-200 overflow-hidden">
            <div className="w-full h-full flex">
                <div className="w-1/2 bg-yellow-100 hidden lg:flex items-center justify-center p-4">
                    <img 
                        src="https://images.pexels.com/photos/6368834/pexels-photo-6368834.jpeg" 
                        alt="Illustration" 
                        className="w-full h-full max-w-lg max-h-140 object-cover rounded-xl shadow-lg"
                    />
                </div>
                <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 md:px-16 lg:px-20 py-8">
                <div className="mb-8 text-center">
                    <div className="text-3xl font-bold mb-2 text-gray-800">Organizo</div>
                    <div className="text-sm text-gray-500">Welcome back! </div>
                </div>
                    <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto w-full">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1"> Username</label>
                            <input 
                                type="text"
                                value={emailOrUsername}
                                onChange={(e)=>setEmailOrUsername(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900"
                                placeholder="Your email or username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e)=>setPassword(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900"
                                placeholder="Your password"
                            />
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <button
                            type="submit"
                            className="w-full bg-yellow-400 hover:bg-yellow-500 transition rounded-lg p-3 font-semibold"
                        >
                            Continue 
                        </button>
                        <div className="text-center mt-4">
                            <span className="text-sm text-gray-600">Don't have an account? </span>
                            <button
                                type="button"
                                onClick={() => navigate("/register")}
                                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium underline"
                            >
                                Sign up here
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
export default Login;