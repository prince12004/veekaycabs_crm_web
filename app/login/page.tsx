"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
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
    <main className="grid min-h-[100dvh] bg-white lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <section className="relative hidden min-h-[100dvh] overflow-hidden bg-gradient-to-br from-[#fffefa] via-[#f8f4ec] to-[#eee5d6] px-12 py-10 text-[#202a3a] lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="pointer-events-none absolute -right-36 -top-32 h-[540px] w-[540px] rounded-full border border-[#c8ae7b]/15" />
        <div className="pointer-events-none absolute -right-14 -top-10 h-[300px] w-[300px] rounded-full border border-[#f15a24]/15" />
        <div className="relative">
          <Image src="/logo.png" alt="Veekay Cabs" width={497} height={91} priority className="h-auto w-[245px]" />
        </div>
        <div className="relative max-w-[640px] pb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#c8ae7b]/30 bg-white/60 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#98733b]">
            <span className="h-2 w-2 rounded-full bg-[#f15a24]" /> Veekay Cabs · Internal workspace
          </span>
          <h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">
            Every lead.<br />Every journey.<br /><span className="text-[#c98630]">One workspace.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#74716a]">
            Manage customer enquiries, coordinate your sales team and keep every booking conversation moving.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-[#505361]">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#e6dac4] bg-white/70 text-[#b38244]"><ShieldCheck size={19} /></span>
            Secure access for the Veekay Cabs team
          </div>
        </div>
        <p className="relative text-xs text-[#8b877f]">© {new Date().getFullYear()} Veekay Cabs · Delhi NCR</p>
      </section>

      <section className="flex min-h-[100dvh] items-center justify-center bg-[#f5f2eb] px-5 py-10 sm:px-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-7 lg:hidden">
            <Image src="/logo.png" alt="Veekay Cabs" width={497} height={91} priority className="h-auto w-[190px]" />
          </div>
          <div className="rounded-[26px] border border-[#e8e2d7] bg-[#fffefa] p-7 shadow-[0_24px_70px_rgba(50,45,34,0.08)] sm:p-10">
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6531c]">Team sign in</span>
              <h2 className="mt-2 text-[30px] font-black tracking-tight text-[#191b23]">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#747987]">Sign in to continue to the Veekay CRM workspace.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="crm-email" className="mb-2 block text-xs font-bold text-[#424653]">Work email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ba0ab]" />
                  <input
                    id="crm-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@veekaycabs.com"
                    className="w-full rounded-xl border border-[#e1e3e8] bg-white py-3 pl-10 pr-3 text-sm text-[#20232d] outline-none transition focus:border-[#f15a24] focus:ring-4 focus:ring-[#f15a24]/10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="crm-password" className="mb-2 block text-xs font-bold text-[#424653]">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ba0ab]" />
                  <input
                    id="crm-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#e1e3e8] bg-white py-3 pl-10 pr-3 text-sm text-[#20232d] outline-none transition focus:border-[#f15a24] focus:ring-4 focus:ring-[#f15a24]/10"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f15a24] py-3.5 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(241,90,36,0.2)] transition hover:bg-[#dd4e1b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <>Sign in securely <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </form>
            <div className="mt-7 flex items-center justify-center gap-2 border-t border-[#f0f1f3] pt-5 text-[11px] font-medium text-[#9297a2]">
              <ShieldCheck size={14} className="text-[#37a464]" />
              Your CRM account is protected with secure sign-in
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-[#8b909b]">Need access? Contact your CRM administrator.</p>
        </div>
      </section>
    </main>
  );
}
