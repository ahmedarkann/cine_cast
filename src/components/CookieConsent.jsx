import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const privacySections = [
  {
    title: "Zbieranie údajov / Data Collection",
    content:
      "Zbierame základné údaje potrebné na prevádzku platformy – meno, e-mail, fyzické atribúty a portfólio. Tieto údaje sú nevyhnutné pre vašu účasť na castingových projektoch. / We collect basic data needed to operate the platform – name, email, physical attributes and portfolio.",
  },
  {
    title: "Použitie údajov / Use of Data",
    content:
      "Vaše údaje využívame výlučne na spájanie hercov a modelov s produkciami a na komunikáciu v rámci platformy CineCAST. / Your data is used solely to match performers with productions and for communication within the CineCAST platform.",
  },
  {
    title: "Zdieľanie s tretími stranami / Third-Party Sharing",
    content:
      "Vaše osobné údaje nepredávame. Profil zdieľame iba s režisérmi a producentmi projektov, na ktoré ste sa prihlásili. / We do not sell your data. Your profile is shared only with directors and producers of projects you applied to.",
  },
  {
    title: "Súbory cookie / Cookies",
    content:
      "Používame nevyhnutné súbory cookie na prihlasovanie a bezpečnosť relácie. Analytické cookies používame anonymne na zlepšenie funkčnosti stránky. / We use essential cookies for login and session security, and anonymous analytics cookies to improve site functionality.",
  },
  {
    title: "Bezpečnosť / Security",
    content:
      "Vaše údaje sú šifrované a uložené na zabezpečených serveroch. Heslá sú uložené výlučne v hashovanej podobe. / Your data is encrypted and stored on secure servers. Passwords are stored exclusively in hashed form.",
  },
  {
    title: "Vaše práva / Your Rights",
    content:
      "Máte právo na prístup, opravu alebo vymazanie svojich osobných údajov kedykoľvek prostredníctvom nastavení profilu alebo kontaktovaním support@cinecast.sk. / You may access, correct or delete your personal data at any time via profile settings or by contacting support@cinecast.sk.",
  },
  {
    title: "Zmeny zásad / Policy Updates",
    content:
      "O zmenách v týchto zásadách vás budeme informovať prostredníctvom e-mailu alebo oznámenia na platforme. Ďalšie používanie platformy po oznámení zmien znamená súhlas. / We will notify you of changes via email or platform notice. Continued use after notification implies consent.",
  },
]

const CONSENT_KEY = "cinecast_cookie_consent"

export default function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const contentRef = useRef(null)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleScroll = () => {
    const el = contentRef.current
    if (!el) return
    const progress = Math.min(1, el.scrollTop / (el.scrollHeight - el.clientHeight))
    setScrollProgress(progress)
  }

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted")
    setOpen(false)
  }

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "declined")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col p-0 sm:max-h-[85vh] sm:max-w-lg gap-0 !rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍪</span>
            <DialogTitle className="text-lg font-semibold">
              Súkromie & Cookies
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            CineCAST rešpektuje vaše súkromie. Prečítajte si prosím naše zásady pred pokračovaním.
          </p>
        </DialogHeader>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="overflow-y-auto px-6 py-4 flex-1 space-y-5"
          style={{ maxHeight: "55vh" }}
        >
          {privacySections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="font-medium text-sm">{section.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}

          <div className="pt-2 text-xs text-muted-foreground border-t border-border">
            Pre viac informácií kontaktujte: <span className="text-foreground">support@cinecast.sk</span>
          </div>
        </div>

        {/* Scroll progress bar */}
        <div className="h-0.5 bg-border">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${scrollProgress * 100}%`,
              background: "linear-gradient(135deg, #ef4136, #fbb040)",
            }}
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border flex-col sm:flex-row gap-2">
          {scrollProgress < 0.95 && (
            <p className="text-xs text-muted-foreground self-center mr-auto">
              ↓ Posuňte sa nadol pre čítanie
            </p>
          )}
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleDecline}
          >
            Odmietnuť
          </Button>
          <Button
            disabled={scrollProgress < 0.95}
            className="rounded-xl"
            style={scrollProgress >= 0.95 ? { background: "linear-gradient(135deg, #ef4136, #fbb040)", border: "none" } : {}}
            onClick={handleAccept}
          >
            Prijať všetky
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
