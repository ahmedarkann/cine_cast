import{j as e}from"./react-Ob5U6yH-.js";import"./vendor-CSbt0EBh.js";function l(){const i=new URLSearchParams(window.location.search).get("tab")||"privacy",o={privacy:{title:"Privacy Policy",body:`Last updated: June 2025

1. Data We Collect
We collect information you provide directly, including name, email, phone number, physical attributes, and portfolio photos when you register on CineCast.

2. How We Use Your Data
Your data is used to match you with casting opportunities, communicate with production companies, and improve our platform.

3. Data Sharing
We share your profile data with production companies only when you apply for a position. We do not sell your data to third parties.

4. Your Rights (GDPR)
You have the right to access, correct, and delete your personal data. Contact us at privacy@cinecast.sk to exercise these rights.

5. Cookies
We use essential cookies for authentication and analytics cookies (with consent) to improve our service.

6. Kontakt
CineCast s.r.o., Mýtna 28, 811 07 Bratislava, Slovensko. Email: registracia@cinecast.sk`},terms:{title:"Terms of Service",body:`Last updated: June 2025

1. Acceptance of Terms
By using CineCast, you agree to these terms. If you do not agree, please do not use our platform.

2. User Accounts
You are responsible for maintaining the security of your account. Provide accurate information and keep it up to date.

3. Casting Applications
Applications submitted through our platform are binding expressions of interest. Production companies may contact you directly.

4. Content
You retain ownership of photos and content you upload. By uploading, you grant CineCast a license to display your content on the platform.

5. Prohibited Conduct
Do not submit false information, impersonate others, or use the platform for any illegal purpose.

6. Limitation of Liability
CineCast is not responsible for outcomes of casting applications or disputes between actors and production companies.

7. Changes
We may update these terms periodically. Continued use constitutes acceptance of changes.`},cookies:{title:"Cookie Policy",body:`Last updated: June 2025

We use the following types of cookies:

Essential Cookies
These are required for the platform to function (authentication, session management). You cannot opt out of these.

Analytics Cookies
We use analytics cookies to understand how users interact with our platform. These can be disabled in your browser settings.

Preference Cookies
These remember your language preference and other settings.

Managing Cookies
You can control cookies through your browser settings. Disabling certain cookies may affect platform functionality.`}},s=o[i]||o.privacy;return e.jsx("div",{className:"min-h-screen bg-black text-white py-16 px-4",children:e.jsxs("div",{className:"max-w-2xl mx-auto",children:[e.jsx("div",{className:"flex gap-4 mb-8",children:Object.entries(o).map(([t,a])=>e.jsx("a",{href:`/legal?tab=${t}`,className:`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded border transition-all ${i===t?"bg-red-600 border-red-600 text-white":"border-white/20 text-white/40 hover:text-white"}`,children:t},t))}),e.jsx("h1",{className:"text-3xl font-black uppercase tracking-tight mb-8",children:s.title}),e.jsx("div",{className:"prose prose-invert max-w-none",children:s.body.split(`

`).map((t,a)=>t.match(/^\d+\./)?e.jsxs("div",{className:"mb-4",children:[e.jsx("h3",{className:"font-bold text-white mb-1",children:t.split(`
`)[0]}),e.jsx("p",{className:"text-white/60 text-sm leading-relaxed",children:t.split(`
`).slice(1).join(" ")})]},a):e.jsx("p",{className:"text-white/60 text-sm leading-relaxed mb-4",children:t},a))})]})})}export{l as default};
