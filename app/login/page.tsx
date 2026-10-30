"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("crm_token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem("crm_token", data.data.token);
      localStorage.setItem("crm_user", JSON.stringify(data.data.user));
      toast.success(`Welcome back, ${data.data.user.name}`);
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#E8540A] text-white font-black flex items-center justify-center mx-auto mb-3 font-mono text-lg">
            VK
          </div>
          <h1 className="text-xl font-black text-[#0F0F1A]">Veekay CRM</h1>
          <p className="text-[#9090A8] text-sm mt-1">Lead Management & Sales</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@veekaycabs.com"
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A4A6A] mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8]" />
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-[1.5px] border-[#E4E5EF] focus:border-[#E8540A] rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#E8540A] hover:bg-[#c94508] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
