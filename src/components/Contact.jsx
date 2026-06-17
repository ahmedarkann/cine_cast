import React, { useState, useEffect, useRef } from "react";
import { useLang } from "@/hooks/useLang";
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter, Linkedin, ChevronRight, Send, Building2 } from "lucide-react";
import { Map } from "@/components/ui/mapcn-map";
import { useTheme } from "next-themes";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

const mapStyles = {
  default: undefined,
  openstreetmap: "https://tiles.openfreemap.org/styles/bright",
  openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
  openstreetmap_dark: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  openstreetmap3d_dark: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
};

export default function Contact() {
  const { lang } = useLang();
  const mapRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setStatus("sending");
    setFormError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.subject ? `[${form.subject}]\n\n${form.message}` : form.message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send");
      setStatus("ok");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setFormError(err.message);
    }
  }

  const [mapStyle, setMapStyle] = useState("default");
  const selectedStyle = mapStyles[mapStyle];
  const is3D = mapStyle === "openstreetmap3d";
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 500 });
  }, [is3D]);

  const contactInfo = [
    { icon: Mail,    label: "Email",                                                        value: "registracia@cinecast.sk",               link: "mailto:registracia@cinecast.sk" },
    { icon: Phone,   label: lang === "sk" ? "Telefón" : "Phone",                           value: "+421 911 316 022",                       link: "tel:+421911316022" },
    { icon: MapPin,  label: lang === "sk" ? "Adresa" : "Address",                          value: "Mýtna 28, 811 07 Bratislava",            link: "https://maps.google.com/?q=Mýtna+28,+811+07+Bratislava" },
    { icon: Clock,   label: lang === "sk" ? "Otváracie hodiny" : "Opening Hours",          value: lang === "sk" ? "Po - Pi: 9:00 - 17:00" : "Mon - Fri: 9:00 AM - 5:00 PM", link: null },
  ];

  const inpClass = "w-full text-sm text-white placeholder-white/40 px-4 py-3.5 rounded-lg outline-none transition-all bg-white/[0.06] border border-white/10 focus:border-[#fbb040] focus:ring-1 focus:ring-[#fbb040]/20";
  const lbl = "block text-[10px] uppercase tracking-widest text-white/55 mb-2 font-bold";

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30">

      {/* ── HERO ── */}
      <section className="relative h-[65vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=2000&q=80"
            className="w-full h-full object-cover opacity-40 grayscale"
            alt=""
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <span className="inline-block text-xs tracking-[0.4em] uppercase mb-4 text-[#fabb9c] font-bold">
            {lang === "sk" ? "KONTAKTUJTE NÁS" : "CONTACT US"}
          </span>
          <h1
            className="text-6xl md:text-8xl font-black uppercase leading-none mb-6"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "-0.02em", textWrap: "balance" }}
          >
            {lang === "sk" ? "BUĎME V" : "STAY IN"}<br />
            <span style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {lang === "sk" ? "KONTAKTE" : "TOUCH"}
            </span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ textWrap: "pretty" }}>
            {lang === "sk"
              ? "Máte otázky? Sme tu pre vás. Napíšte nám správu alebo nás navštívte v našom bratislavskom office."
              : "Have questions? We're here for you. Send us a message or visit us at our Bratislava office."}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 py-24">

        {/* ── LEFT: Form + Contact info ── */}
        <div className="space-y-12">

          {/* Form card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 md:p-10">
            <h2 className="text-3xl font-black mb-8 uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "-0.01em" }}>
              {lang === "sk" ? "Napíšte nám správu" : "Send us a message"}
            </h2>

            {status === "ok" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: gradient }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-2xl font-black uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {lang === "sk" ? "Správa odoslaná!" : "Message sent!"}
                </h4>
                <p className="text-white/60 text-sm">
                  {lang === "sk" ? "Ozveme sa čo najskôr." : "We'll get back to you as soon as possible."}
                </p>
                <button onClick={() => setStatus(null)} className="text-xs text-white/40 hover:text-white underline underline-offset-2 transition-colors">
                  {lang === "sk" ? "Odoslať ďalšiu správu" : "Send another message"}
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>{lang === "sk" ? "Meno" : "Name"}</label>
                    <input type="text" placeholder={lang === "sk" ? "Vaše meno" : "Your name"} className={inpClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Email</label>
                    <input type="email" placeholder="email@example.com" className={inpClass} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>{lang === "sk" ? "Predmet" : "Subject"}</label>
                  <input type="text" placeholder={lang === "sk" ? "O čom chcete písať?" : "What is this about?"} className={inpClass} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>{lang === "sk" ? "Správa" : "Message"}</label>
                  <textarea rows={4} placeholder={lang === "sk" ? "Vaša správa..." : "Your message..."} className={`${inpClass} resize-none`} required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                {status === "error" && (
                  <p className="text-red-400 text-xs">{formError || "Something went wrong. Please try again."}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending" || !form.message.trim()}
                  className="w-full font-bold text-xs tracking-[0.2em] uppercase text-white py-4 rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: gradient }}
                >
                  {status === "sending" ? (lang === "sk" ? "Odosiela sa…" : "Sending…") : (lang === "sk" ? "Odoslať správu" : "Send Message")}
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactInfo.map((item, idx) => (
              <div key={idx} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 group hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(239,65,54,0.12)" }}>
                    <item.icon className="w-4 h-4 text-[#fabb9c]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{item.label}</p>
                    {item.link ? (
                      <a href={item.link} className="text-sm font-medium text-white hover:text-[#fabb9c] transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-sm font-medium text-white">{item.value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Map + Socials + Company info + CTA ── */}
        <div className="space-y-8">

          {/* Map */}
          <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            <Map
              ref={mapRef}
              center={[17.1158, 48.1539]}
              zoom={15}
              styles={
                mapStyle === "default"
                  ? undefined
                  : { light: mapStyles[mapStyle], dark: mapStyles[`${mapStyle}_dark`] || mapStyles[mapStyle] }
              }
            />
            <div className="absolute top-4 right-4 z-10">
              <select
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/80 backdrop-blur-md px-3 py-1.5 text-xs text-white outline-none focus:border-[#fbb040]"
              >
                <option value="default">Default (Carto)</option>
                <option value="openstreetmap">OpenStreetMap</option>
                <option value="openstreetmap3d">OpenStreetMap 3D</option>
              </select>
            </div>
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Office Location</p>
                <p className="text-xs font-bold text-white">Mýtna 28, 811 07 Bratislava</p>
              </div>
              <a
                href="https://maps.google.com/?q=Mýtna+28,+811+07+Bratislava"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Open in Google Maps"
              >
                <ChevronRight className="w-4 h-4 text-[#fabb9c]" />
              </a>
            </div>
          </div>

          {/* Socials */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-7">
            <h3 className="text-sm font-bold mb-5 text-white/75 uppercase tracking-wider">
              {lang === "sk" ? "Sledujte našu prácu" : "Follow our work"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Facebook,  label: "Facebook",  link: "https://www.facebook.com/cinecast.sk" },
                { icon: Instagram, label: "Instagram", link: "https://www.instagram.com/cinecast_casting" },
                { icon: Twitter,   label: "Twitter",   link: "#" },
                { icon: Linkedin,  label: "LinkedIn",  link: "#" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.06] hover:border-white/15"
                >
                  <social.icon className="w-5 h-5 text-white/60" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{social.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Company info */}
          <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03]">
            <div className="px-6 py-3.5 flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.03]">
              <Building2 className="w-4 h-4 text-[#ef4136]/70" />
              <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-white/50">CINECAST s. r. o.</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/[0.07]">
              <div className="px-6 py-5">
                <p className="text-[10px] uppercase tracking-[0.2em] mb-3 font-bold text-[#fabb9c]">
                  {lang === "sk" ? "Sídlo" : "Headquarters"}
                </p>
                <p className="text-white/85 text-sm font-medium">Športová 99/11</p>
                <p className="text-white/50 text-sm">900 44 Tomášov</p>
              </div>
              <div className="px-6 py-5">
                <p className="text-[10px] uppercase tracking-[0.2em] mb-3 font-bold text-[#fabb9c]">
                  {lang === "sk" ? "Fakturačné údaje" : "Billing"}
                </p>
                <dl className="space-y-1.5">
                  {[["IČO","51916673"],["DIČ","2120831218"],["IČ DPH","SK2120831218"]].map(([k,v]) => (
                    <div key={k} className="flex items-baseline gap-2">
                      <dt className="text-[11px] text-white/40 w-14 shrink-0">{k}</dt>
                      <dd className="text-white/65 text-xs font-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="p-px rounded-2xl" style={{ background: gradient }}>
            <div className="bg-zinc-950 rounded-[15px] p-8 text-center">
              <h4 className="text-xl font-bold mb-2 text-white">{lang === "sk" ? "Chcete u nás hrať?" : "Want to act with us?"}</h4>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">{lang === "sk" ? "Zaregistrujte sa a staňte sa súčasťou našej databázy." : "Register and become part of our database."}</p>
              <button
                className="px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-black transition-all hover:opacity-90"
                style={{ background: gradient, color: "#fff" }}
              >
                {lang === "sk" ? "Registrovať sa" : "Register Now"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
