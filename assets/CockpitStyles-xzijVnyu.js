import{o as e,t}from"./jsx-runtime-9YgKe2Eq.js";import{t as n}from"./react-CM_0bdEm.js";import{t as r}from"./use-reduced-motion-DR8m-NXb.js";var i=e(n(),1);function a(){return!!r()}function o(e){let[t,n]=(0,i.useState)(!1);return(0,i.useEffect)(()=>{let t=window.matchMedia(e),r=()=>n(t.matches);return r(),t.addEventListener(`change`,r),()=>t.removeEventListener(`change`,r)},[e]),t}var s=()=>o(`(hover: hover) and (pointer: fine)`),c=()=>o(`(min-width: 1024px)`);function l(e,t,n,r,i,a){let o=e=>e/Math.sqrt(1+e*e);return[o((e-n)/i),o((t-r)/a)]}var u=[`Car or vehicle dealership`,`Jewellery or watches`,`Bridal, couture or designer fashion`,`Fashion or lifestyle retail`,`Furniture, interiors or flooring`,`Corporate gifting or B2B supply`,`Real estate or property`,`Dental practice`,`Specialty clinic (skin, eye, fertility, physio)`,`Hospital or multi-specialty`,`Manufacturing`,`Wholesale or distribution`,`Education, coaching or training`,`Hotels, resorts or travel`,`Events, catering or banquets`,`Fitness, salon or wellness`,`Logistics or transport`,`Professional services (legal, accounting, consulting)`,`Marketing or creative agency`,`E-commerce or D2C brand`,`Something else`],d=[{key:`category`,label:`What kind of business?`,kind:`select`,required:!0,options:u},{key:`team`,label:`How many people would use it?`,hint:`Everyone who would sign in, not just the office.`,kind:`select`,required:!0,options:[`Just me`,`2 to 5`,`6 to 15`,`16 to 40`,`41 to 100`,`More than 100`]}],f=[{from:0,to:12e4},{from:12e4,to:6e5},{from:6e5,to:3e6},{from:3e6,to:12e6},{from:12e6,to:null}],p=`I would rather say on the call`,m=[{from:0,to:750},{from:750,to:2e3},{from:2e3,to:5e3},{from:5e3,to:15e3},{from:15e3,to:null}],h=`No idea yet, tell me what it should be`,g=[{key:`need`,label:`What is going wrong today?`,hint:`The problem, in your words. This is the answer we read first.`,kind:`textarea`,required:!0,placeholder:`e.g. Enquiries come on WhatsApp, Instagram and the phone. Nobody knows which ones were followed up, and I find out a month later that a customer went elsewhere.`},{key:`website`,label:`Your website`,hint:`So we can look at your catalogue before we speak, not during.`,kind:`text`,required:!1,placeholder:`yourcompany.com`},{key:`instagram`,label:`Your Instagram`,hint:`Often a better catalogue than the website, and always more current.`,kind:`text`,required:!1,placeholder:`@yourcompany`},{key:`timeline`,label:`When do you want it running?`,kind:`select`,required:!0,options:[`This month`,`Within 3 months`,`This quarter, no fixed date`,`Later this year`,`Just looking for now`]}],_=[{key:`name`,label:`Your name`,kind:`text`,required:!0,placeholder:`Full name`},{key:`email`,label:`Email`,kind:`text`,required:!0,hint:`The calendar invite goes here.`,placeholder:`you@company.com`}],v=`https://script.google.com/macros/s/AKfycbyDMiGETFWrOPu8MEJi6I9t9sukX58fEhZ3-n2o_45cLNZo4iNbtZ5dO4_89IkbZpLyvQ/exec`;function y(e,t){let n=(e||``).trim()||(t||``).trim();if(!n)return``;let r=n.replace(/^@/,``).replace(/^https?:\/\//i,``).replace(/^www\./i,``).split(/[/?#]/)[0];/^instagram\.com$/i.test(r)&&(r=n.replace(/^https?:\/\//i,``).replace(/^www\./i,``).split(`/`)[1]||``);let i=r.split(`.`)[0].replace(/[_-]+/g,` `).trim();return i?i.split(` `).map(e=>/[a-z]/.test(e)&&/[A-Z]/.test(e)?e:e.charAt(0).toUpperCase()+e.slice(1)).join(` `):``}var b=t();function x(){return(0,b.jsx)(`style`,{children:`
@keyframes zs-shine {
  0%   { background-position: 160% 0; }
  55%  { background-position: -60% 0; }
  100% { background-position: -60% 0; }
}
.zs-shine {
  background-image: linear-gradient(110deg, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%);
  background-size: 220% 100%;
  background-repeat: no-repeat;
  animation: zs-shine 3.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.zs-shine-ink {
  background-image: linear-gradient(110deg, transparent 38%, rgba(213,235,75,0.35) 50%, transparent 62%);
}

/* nav links on the homepage: a lime line draws in under the word */
.zs-navlink { position: relative; }
.zs-navlink::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px;
  border-radius: 2px; background: #D5EB4B;
  transform: scaleX(0); transform-origin: left;
  transition: transform .35s cubic-bezier(0.16, 1, 0.3, 1);
}
.zs-navlink:hover::after, .zs-navlink:focus-visible::after { transform: scaleX(1); }

/* film grain over the ink hero, so the black has depth instead of being flat */
@keyframes zs-grain {
  0%, 100% { transform: translate3d(0, 0, 0); }
  25% { transform: translate3d(-2%, 1%, 0); }
  50% { transform: translate3d(1%, -2%, 0); }
  75% { transform: translate3d(2%, 2%, 0); }
}
.zs-grain {
  position: absolute; inset: -10%; pointer-events: none; opacity: .07; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: zs-grain 1.2s steps(4) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .zs-grain { animation: none; }
}
`})}export{h as a,g as c,y as d,l as f,c as h,m as i,f as l,s as m,d as n,u as o,a as p,v as r,_ as s,x as t,p as u};