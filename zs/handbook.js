/* THE HANDBOOK. What ZippyScale is, what we sell, and how this cockpit works.

   WHY THIS IS A FILE AND NOT A VECTOR DATABASE.

   A vector database earns its place when there is more text than fits in a
   prompt, and the job becomes finding the right paragraph. This is about four
   thousand words. Gemini takes a million. So retrieval here would be a search
   engine built to search one book, answering a question the whole book already
   fits inside — more moving parts, another thing to keep in sync, and a new way
   to be confidently wrong when it retrieves the wrong section. If this ever
   grows past what a prompt can hold, the first step is picking sections by
   heading, and only then embeddings.

   WHAT IT IS FOR. A new person on the team asks Jarvis what an Agentic Cockpit
   is, what it costs, how a deal moves, what AC-001 means, and gets a straight
   answer drawn from here rather than invented. This is the ONLY thing a model
   is allowed to write prose from. Anything about a client, a fee or a deal
   stays arithmetic over the book itself, so those numbers are right rather than
   plausible.

   KEEP IT TRUE. Every price, stage name and role in here must match what the
   code actually does. check_handbook.js fails the build when they drift. */
(function () {
  'use strict';

  /* Words that appear everywhere and therefore mean nothing when matching. */
  /* "mean" is NOT in here. "What does AC-001 mean" is the question, and the
     section that answers it is titled "What the reference codes mean". Stopping
     the one word that carries the intent left the question scoring 1 against two
     sections at once, which is a tie, which is no answer. */
  var STOP = ('what does from with this that they them have will your about when where ' +
    'which there here would could should anything everything the and for are can you our ' +
    'how why who tell show explain work works thing things much many').split(' ');

  var H = [

/* ---------------------------------------------------------------- */
{ id: 'what-we-are', title: 'What ZippyScale is',
  where: [['The overview', '#/home']], text:
"ZippyScale is a small studio in Hyderabad, India, run by Bhargav Naidu. We " +
"build one system that runs a business, and we build it on the client's own " +
"data rather than on a demo. We work mostly with luxury and considered-purchase " +
"retail: pre-owned car dealers, couture and silk houses, flooring, corporate " +
"gifting, chauffeur services. What those have in common is a long sale, a few " +
"high-value deals a month, and an owner who is currently holding the whole " +
"thing in their head.\n\n" +
"We are not an agency that runs ads and reports on them. We build the system " +
"the business is run from, and we automate the parts nobody enjoys."
},

/* ---------------------------------------------------------------- */
{ id: 'what-we-sell', title: 'What we sell',
  where: [['What we sell', '#/stock'], ['Set the prices', '#/settings/lines']], text:
"Two lines. They are set up in Settings under What we sell, and every price " +
"there is a FLOOR, not a price list: the fee on any given engagement is agreed " +
"per job and typed onto the engagement itself.\n\n" +
"AGENTIC COCKPIT, code AC. One system built for one business: the console, " +
"roles and permissions, the sales pipeline, the delivery board, client records " +
"with contacts and documents, invoicing, automations and the agent layer. This " +
"is the flagship. Every reference on it reads AC-001, AC-002 and so on.\n\n" +
"AI AUTOMATIONS, code AO. Funnels, WhatsApp, GoHighLevel and the integrations " +
"between them. Scoped per job rather than sold as a package. References read " +
"AO-001 upwards.\n\n" +
"A line is something you sell more than once. Anything sold once is an " +
"engagement with its own scope, not a line of its own. If somebody asks for a " +
"price, the honest answer is the floor for that line plus 'the fee depends on " +
"the scope, and we agree it before anything starts'."
},

/* ---------------------------------------------------------------- */
{ id: 'what-a-cockpit-is', title: 'What an Agentic Cockpit actually contains',
  where: [['The overview', '#/home'], ['Roles and access', '#/settings/access']], text:
"Eight layers, and they are the same eight whatever trade the client is in. " +
"Only the vocabulary changes.\n\n" +
"1. PERMISSIONS. Roles with a scope and a list of what each may reach. A " +
"restricted figure is masked on screen and, where there is a server, is not in " +
"the response at all.\n" +
"2. THE ITEM REGISTRY. Whatever the business sells, with its real fields. Cars " +
"for a dealer, designs for a couture house, our own two lines here.\n" +
"3. CRM. Clients are companies. Each has contacts, documents, an address, bank " +
"details and a history.\n" +
"4. THE PIPELINE. One ladder from first enquiry to signed, with the stage on " +
"the deal rather than on the person, so a returning client keeps their history.\n" +
"5. DELIVERY. A second board for what happens after the money, because a " +
"different person does that work.\n" +
"6. FOLLOW-UPS. Every open deal has a next contact booked, or it appears on the " +
"list of ones that do not.\n" +
"7. AUTOMATIONS. Rules that fire on an event, with conditions that are actually " +
"evaluated and a dry-run Test that counts the real audience and sends nothing.\n" +
"8. THE AGENT LAYER. Named workers with a job, a mode and an obligation to show " +
"their reasoning."
},

/* ---------------------------------------------------------------- */
{ id: 'pipeline', title: 'How a deal moves',
  where: [['The sales board', '#/floor'], ['The delivery board', '#/processing']], text:
"The sales ladder has seven open rungs and two closed ones.\n\n" +
"ENQUIRY. Came in from somewhere. Nobody has spoken to them yet.\n" +
"CONTACTED. We have reached them. Working out whether there is a business here.\n" +
"DISCOVERY BOOKED. A discovery call is in the diary.\n" +
"DISCOVERY DONE. We know what they do and where it hurts. Now build the pitch.\n" +
"PITCHED. They have seen what we would build. Waiting on their word.\n" +
"MOU SENT. Terms are with them. Revisions are counted on the record, not as a " +
"new stage.\n" +
"INVOICED. Agreed in principle and the first invoice is raised. Money not in yet.\n" +
"WON. Paid and starting. It moves to the delivery board.\n" +
"LOST. With a reason recorded, because a lost deal with no reason teaches " +
"nothing.\n\n" +
"A client is a company. An engagement belongs to that company AND runs through " +
"exactly one person inside it: the point of contact. A company may have " +
"somebody in sales, somebody in accounts and somebody who owns the content, and " +
"which one an engagement runs through is a fact about the engagement."
},

/* ---------------------------------------------------------------- */
{ id: 'references', title: 'What the reference codes mean',
  where: [['Change a line code', '#/settings/lines']], text:
"Every record carries a short reference so it can be talked about out loud.\n\n" +
"An engagement takes the code of the line it is on, then a running number: " +
"AC-001 is the first Agentic Cockpit engagement, AO-001 the first AI " +
"Automations one. Change the code on a line in Settings and it prefixes " +
"everything opened on that line afterwards.\n\n" +
"Clients read CL-001 upwards. Invoices read IN-001 upwards. The numbers are " +
"assigned when the record is created and never reused, so a gap in the sequence " +
"means something was deleted rather than that something is missing."
},

/* ---------------------------------------------------------------- */
{ id: 'roles', title: 'The roles, and what each can reach',
  where: [['Roles and access', '#/settings/access'], ['People', '#/settings/people']], text:
"OWNER. Everything, including Settings, passwords and deleting. Deleting is " +
"owner-only and nothing else can reach it, not even Jarvis.\n" +
"DIRECTOR. Everything operational: cost and margin, credentials, invoices, " +
"deploying, automations, the agents, targets and team reports. No Settings, no " +
"passwords.\n" +
"ACCOUNT MANAGER. Clients, mobiles, invoices, editing and starting engagements, " +
"exports and team reports. No cost or margin, no credentials.\n" +
"BUILDER. Clients, credentials, editing engagements, deploying and automations. " +
"No cost, no invoices, no full mobile numbers.\n" +
"CONTRACTOR. Only their own work, and only the engagements assigned to them. No " +
"client records, no credentials, no money.\n\n" +
"A role also carries a SCOPE: everyone, their line, or only their own. Scope " +
"decides which rows they see at all, before any of the above applies."
},

/* ---------------------------------------------------------------- */
{ id: 'agents', title: 'The agent layer',
  where: [['The roster', '#/jarvis'], ['Automations', '#/automations']], text:
"An AUTOMATION is a rule that fires on an event. An AGENT is a named worker " +
"with a job, a mode and an obligation to show its reasoning. Most of them are " +
"rules with a job title, and saying so plainly is the point: a client who finds " +
"out later that 'AI' meant an if-statement stops believing everything else.\n\n" +
"Jarvis reads the whole cockpit, ranks what is going wrong, dispatches the " +
"others and takes instructions in plain words.\n" +
"The Chaser nudges deals that have gone quiet.\n" +
"The Closer drafts outreach for work that is finished and never sent, which is " +
"the most expensive state a build can be in.\n" +
"The Watchman checks the live builds.\n" +
"The Collector chases invoices past their terms.\n" +
"The Reconciler reads a payment proof, pulls out what actually moved, matches it " +
"against the invoices on that engagement and proposes marking one cleared. It " +
"never clears one itself: a payment read wrong is a debt somebody stops chasing.\n" +
"Morning Brief is the daily read of everything.\n" +
"The Signal watches WhatsApp health: the sending tier, the quality rating and " +
"which failures are Meta's fault rather than ours.\n\n" +
"Three rules hold the whole layer. They propose and a human approves; anything " +
"a client would see queues for approval whatever mode the agent is on, and that " +
"is a guard in the dispatcher the mode cannot reach. Every run shows its work. " +
"And each agent is Off, Suggest or Auto, defaulting to Suggest.\n\n" +
"Time saved is arithmetic over our own estimates, not a measurement, and it is " +
"labelled as modelled wherever it appears."
},

/* ---------------------------------------------------------------- */
{ id: 'jarvis', title: 'What Jarvis is, and what he is not',
  where: [['Talk to him', '#/jarvis']], text:
"Jarvis answers from the book itself. 'What is owed' is arithmetic over the " +
"invoices, so it is right rather than plausible, it is instant, and it costs " +
"nothing. No model writes those answers.\n\n" +
"A language model sits behind him for two jobs only. It rewrites a question he " +
"did not catch into one of the shapes he knows, and shows you the rewrite. And " +
"it answers questions about ZippyScale itself from this handbook. It never " +
"writes a number about a client.\n\n" +
"He acts AS YOU. Where your role is refused, so is he, and he says whose rule " +
"stopped him. He cannot delete anything and never will. He cannot upload a " +
"file, because a browser will not let JavaScript put a file into a file input, " +
"but he can open the right upload slot and can rename, re-file, replace or " +
"delete anything already uploaded."
},

/* ---------------------------------------------------------------- */
{ id: 'whatsapp', title: 'WhatsApp, and whose fault a failure is',
  where: [['WhatsApp settings', '#/settings/whatsapp'], ['What connecting needs', '#/settings/connections']], text:
"Meta has three template categories. MARKETING is anything promotional and is " +
"the one users can block. UTILITY is about something they already did: an " +
"order, an appointment, a payment. AUTHENTICATION is one-time codes only.\n\n" +
"The sending tier goes 250, 1,000, 10,000, 100,000 and unlimited unique " +
"customers in 24 hours, and it moves on quality rather than on spend.\n\n" +
"The failure codes that matter: 131049 is Meta capping marketing messages to " +
"that particular user for their own experience, which is Meta's decision and " +
"not a fault in the template. 131047 means the 24-hour window closed and a " +
"template is required. 131026 means the number cannot receive. 132001 means the " +
"template does not exist or is not approved in that language.\n\n" +
"Naming whose fault a failure is matters, because a client who is told 'it " +
"failed' assumes it was us."
},

/* ---------------------------------------------------------------- */
{ id: 'notifications', title: 'How you find out something arrived',
  where: [['Turn them on', '#/settings/data'], ['The overview', '#/home']], text:
"The cockpit asks the server every twenty seconds, while the tab is in front, " +
"whether anything has changed. When something has, it pulls it and the screen " +
"updates on its own. You never reload to see a new enquiry.\n\n" +
"WITH NOTIFICATIONS OFF it stops asking the moment you look at something else, " +
"and catches up when you come back, so a tab left open all week costs nothing.\n\n" +
"TURN NOTIFICATIONS ON and you are told when something arrives while you are in " +
"another tab or another application. That also means the tab keeps asking once a " +
"minute in the background, which is what makes it possible: for a long time it " +
"did not, and no notification could ever arrive, because the check stopped on " +
"exactly the state a notification is for. It is one notification, replaced each " +
"time, never a pile of them.\n\n" +
"The offer to turn them on is on the overview the first time, and it is in " +
"Settings, Connections after that. The browser only asks when you click a " +
"button: a site that asks the second it loads gets refused out of habit, and " +
"once refused only the browser can undo it, from the icon beside the address " +
"bar.\n\n" +
"IT NEEDS THE COCKPIT OPEN IN SOME TAB. A notification with the browser shut " +
"needs push, a service worker and a subscription for each device, which is real " +
"work rather than a switch. Until that is built, an enquiry that arrives with " +
"everything closed is waiting on the board when you open it.\n\n" +
"What it tells you is read off the board rather than guessed: how many enquiries " +
"or clients arrived, who the newest one is from, and which rung it landed on."
},

/* ---------------------------------------------------------------- */
{ id: 'nothing-is-lost', title: 'Why nothing you type can disappear',
  where: [['Your data', '#/settings/data'], ['Connections', '#/settings/connections']], text:
"THIS WENT WRONG ONCE AND IT IS WORTH KNOWING WHY. A client was added, it never " +
"reached the server, and the next time the cockpit fetched the book it rebuilt " +
"everything from what the server sent. The record was gone, with no error, " +
"because nothing on the server had ever recorded it existing.\n\n" +
"HOW IT WORKS NOW. Every record carries a mark saying whether the server has " +
"accepted it. Anything without that mark is work that exists in this browser and " +
"nowhere else, and fetching the book is not allowed to remove it: it survives and " +
"is sent up straight away. A record the server HAS accepted, which then " +
"disappears from the server, was genuinely deleted, and is allowed to go. Losing " +
"your typing is impossible; bringing back something deleted elsewhere is merely " +
"untidy, so the doubt runs that way on purpose.\n\n" +
"Fetching also sends anything waiting BEFORE it replaces anything, so the common " +
"case never reaches the rescue at all.\n\n" +
"Settings, Your data shows the count: 'Only in this browser'. Zero is the normal " +
"reading. A number that will not fall means the server is refusing those records, " +
"and the reason is on the same panel. Nothing is thrown away while you sort it " +
"out.\n\n" +
"YOU CAN TYPE WHILE SIGNED OUT and it still works. It waits in the browser, and " +
"the moment you sign in it goes up."
},

/* ---------------------------------------------------------------- */
{ id: 'where-the-data-is', title: 'Where the data actually lives',
  where: [['Your data', '#/settings/data'], ['Connections', '#/settings/connections']], text:
"There is a real server: a Cloudflare Worker with a D1 database and R2 for " +
"documents. Signing in is a session on that server, sessions can be revoked, " +
"and passwords are hashed rather than stored.\n\n" +
"A role is a WHERE clause there, not a CSS class: a column somebody may not see " +
"is not in the response at all, rather than hidden by the browser. The local " +
"store in the browser is a cache and keeps the screen instant; changes are " +
"pushed as a diff a moment later, and queue up when the network is gone.\n\n" +
"Settings, Your data has Export, which writes a file of everything, and Import, " +
"which reads one back. That is how the book moves between machines."
},

/* ---------------------------------------------------------------- */
{ id: 'how-to', title: 'How to do the ordinary things',
  where: [['Clients', '#/clients'], ['The sales board', '#/floor'], ['Settings', '#/settings/access']], text:
"ADD A CLIENT. Clients, then New client. Or tell Jarvis: 'add a client called " +
"Vishwa Textiles'. He asks before creating it, because any string is a valid " +
"company name and a misheard sentence should not become a record.\n\n" +
"OPEN AN ENGAGEMENT. The board, then New engagement, and pick the client first. " +
"The form asks who it is for before anything else: the client, and which person " +
"inside it this one runs through. Or: 'start an engagement for Vishwa on " +
"Agentic Cockpit'.\n\n" +
"SET A FEE. The Opportunity value sits beside the stage on the engagement. Or " +
"'set the fee on Vishwa to 120000'.\n\n" +
"FILL IN THE DETAILS ON AN ENGAGEMENT. The On file panel holds everything an " +
"engagement should carry: the billing identity, the terms, the plan, the build, " +
"the logins. Type into as many boxes as you like. NOTHING IS SAVED AS YOU TYPE. " +
"Each box you change is marked and a bar at the foot of the panel counts them; " +
"press Save these details and the lot goes in at once, or Throw them away and " +
"none of it does. A field that fails its check stays in the box with the error " +
"so you can correct it, and the rest still save.\n\n" +
"DELETE SOMETHING. Owner only, and it goes to the Bin for thirty days rather " +
"than disappearing. See the bin section.\n\n" +
"MOVE A DEAL. The Stage picker on the engagement, or 'move Vishwa to Pitched'.\n\n" +
"RAISE AN INVOICE. On the engagement, or 'raise an invoice for Vishwa for " +
"120000'. It is a draft until it is sent.\n\n" +
"ADD SOMEBODY TO THE TEAM. Settings, People. You set their username and their " +
"first password, and they can change it themselves afterwards. Only the owner " +
"can set a role.\n\n" +
"CHANGE A PRICE. Settings, What we sell. The dollar figure beside it is worked " +
"out from the rupee price and the rate on that same page, never stored, so it " +
"cannot go stale."
},

/* ---------------------------------------------------------------- */
{ id: 'how-we-pitch', title: 'How we talk to a prospect',
  where: [['The sales board', '#/floor']], text:
"Value first. When we look at a prospect's site we find real faults: a price " +
"two digits short, no descriptions, a brand spelled two ways, an open endpoint " +
"anyone can read. A FAULT is a wrong value and a GAP is a missing one. We hand " +
"the faults over free, before any pitch. That is what earns the meeting.\n\n" +
"Then we do the arithmetic on their own numbers rather than quoting features. " +
"Forty orders a month at an eight to twelve week lead time is about a hundred " +
"live orders, not forty, and at three to five pieces each that is three to five " +
"hundred objects in motion tracked by one person's memory. That sentence sells " +
"the system. A feature list does not.\n\n" +
"We promise something we can be held to: not 'we will fix your drop-off' but " +
"'eight to fifteen points of improvement in ninety days, measured this way'. A " +
"promise you can miss is worse than a smaller one you will beat.\n\n" +
"And we never let invented data flatter anybody. A demo built on a client's own " +
"scraped catalogue is a different conversation from one built on made-up names."
}

,

/* ---------------------------------------------------------------- */
{ id: 'where-everything-is', title: 'Where everything is, screen by screen',
  where: [['The overview', '#/home'], ['Settings', '#/settings/access']], text:
"The left-hand rail, top to bottom.\n\n" +
"OVERVIEW. What is going wrong and what is going well, ranked. Start here.\n" +
"JARVIS. Talk to him, the queue of things waiting on you, the roster of agents, " +
"and what they did.\n" +
"DIARY. Every meeting and every follow-up in one place, a day at a time, with " +
"what is booked and already behind you at the top.\n" +
"SALES. The pipeline board. Every open deal, by stage.\n" +
"DELIVERY. Everything signed, until it is live and theirs.\n" +
"CLIENTS. The companies, their contacts, documents and history.\n" +
"WHAT WE SELL. The two lines, with prices, targets and what is on each.\n" +
"INBOX. Every WhatsApp and Instagram conversation, filterable by channel. Hand " +
"one to somebody and it moves to their inbox.\n" +
"CHATBOT. The menu that answers on WhatsApp and Instagram before a person does.\n" +
"CAMPAIGNS. Paid campaigns, so a lead names which ad brought it rather than just " +
"Meta. Meta, Google and LinkedIn connect here.\n" +
"AUTOMATIONS. The rules that fire on their own.\n" +
"REPORTS. Everyone's numbers against their targets, for the window you pick.\n" +
"ACTIVITY. One line per thing anybody did, filterable by kind.\n" +
"TARGETS. Monthly numbers for every line and every person.\n" +
"SHEET. Every engagement as one row, exportable as CSV.\n" +
"TEAM. Who is on the roster and what each of them is carrying.\n" +
"BIN. Everything deleted, kept for thirty days. Owner only.\n" +
"SETTINGS. Eight tabs: Roles and access, People, What we sell, WhatsApp, " +
"Connections, Engagement sheet, Your data, Start again.\n\n" +
"WHATSAPP IS IN SETTINGS, not in Campaigns. Campaigns is paid advertising. " +
"Settings, WhatsApp holds the templates, the sending limit and what actually " +
"landed."
},

/* ---------------------------------------------------------------- */
{ id: 'whatsapp-templates', title: 'Writing a WhatsApp template',
  where: [['Templates', '#/settings/whatsapp'], ['What connecting needs', '#/settings/connections']], text:
"Settings, WhatsApp, Templates, and the button reads Write a template.\n\n" +
"A template is a message Meta has approved in advance. Without one you can only " +
"reply inside 24 hours of them writing to you, which is almost never when you " +
"need to.\n\n" +
"Writing it here is the first half. The second is Meta: it has to be submitted " +
"and approved before it can be sent, and that needs the WhatsApp Business " +
"Account connected. What is written here is stored and ready, and goes out for " +
"approval the day the number is connected.\n\n" +
"Pick the category honestly. Utility is about something they already did: an " +
"order, an appointment, a payment. Marketing is anything else, and it is the one " +
"users can block and the one Meta caps per user. Choosing Marketing and calling " +
"it Utility is how a number gets its quality rating cut.\n\n" +
"Put variables in by CLICKING them, never by typing. They are numbered in the " +
"order they appear, and typing one by hand breaks the numbering so the message " +
"arrives with the wrong words in the wrong slots. The picker lists every " +
"variable the cockpit can fill: the client, the contact, the engagement, the " +
"fee, the stage, the next meeting, the invoice and its due date.\n\n" +
"Then the sending limit. It starts at 250 unique customers in 24 hours and " +
"climbs to 1,000, 10,000, 100,000 and unlimited, on quality rather than on " +
"spend. The What landed tab shows what succeeded and what failed, and says " +
"whose fault each failure was."
},

/* ---------------------------------------------------------------- */
{ id: 'automations', title: 'How an automation is built',
  where: [['Automations', '#/automations'], ['Write a new rule', '#/automation/new']], text:
"Automations, then New rule. A rule is three parts: a trigger, conditions, and " +
"one or more actions.\n\n" +
"THE TRIGGER is the event that starts it. They are grouped: Enquiry covers a new " +
"enquiry arriving, a WhatsApp reply, a missed call, the website form, and a lead " +
"going untouched for so many days. Sales covers discovery done, no pitch after " +
"so many days, an MOU going out, an MOU sitting unsigned, an MOU revised again, " +
"a deal won and a deal lost. Money covers an invoice raised, an invoice overdue " +
"by so many days, a payment landing, and part of an agreed fee never invoiced. " +
"Delivery covers a build entering delivery, onboarding with no answers, a " +
"milestone date passing unmet, a build waiting on the client, testing starting, " +
"handover, work finished and never sent, a live build going down, and a check-in " +
"falling due. Team covers the month being behind target, and a credential we " +
"need not being on file.\n\n" +
"CONDITIONS narrow who it applies to, and they are actually evaluated rather " +
"than decorative. Stage, line, owner, fee, sector, source, days since last " +
"touch, whether an invoice is overdue, and so on.\n\n" +
"ACTIONS are what it does. Internal ones: notify one person, notify everyone in " +
"a role, put a follow-up on their salesperson, assign the client, and wait. " +
"Client-facing ones: send an approved WhatsApp template, send a WhatsApp " +
"message, ask for a Google review, and add to a campaign audience.\n\n" +
"Nothing is mandatory except the action. A rule with no conditions applies to " +
"everyone the trigger catches, which is often what you want.\n\n" +
"ONE CLIENT-FACING ACTION MAKES THE WHOLE RULE CLIENT-FACING, and the card says " +
"so. The guardrails are always on and cannot be switched off: no marketing to " +
"anyone without consent or with an open complaint, and outside WhatsApp's " +
"24-hour window only an approved template goes out.\n\n" +
"TEST IS A DRY RUN. It names the real audience, counts them, and sends nothing."
},

/* ---------------------------------------------------------------- */
{ id: 'integrations', title: 'Integrations: what is connected, and what connecting needs',
  where: [['Connections', '#/settings/connections'], ['Campaigns', '#/campaigns']], text:
"Nothing that is not connected pretends to be. Every integration shows a status " +
"chip and a line naming exactly what it needs first.\n\n" +
"META ADS MANAGER, GOOGLE ADS and LINKEDIN ADS live on the Campaigns screen. " +
"Each needs a server with a public URL, the right permission from that platform, " +
"and an account connected to it. Meta needs app review for ads_read, Google needs " +
"a developer token, LinkedIn needs a marketing token. Until then campaigns are " +
"added by hand, which still works: every paid lead names which campaign brought " +
"it, so the source column answers which ad rather than just Meta.\n\n" +
"WHATSAPP is in Settings, not in Campaigns, because it is a conversation channel " +
"rather than advertising. It needs a WhatsApp Business Account, a verified " +
"number, and templates approved by Meta.\n\n" +
"THE SERVER itself is connected: a Cloudflare Worker with a D1 database and R2 " +
"for documents. That is what makes sign-in real, what makes a role a WHERE " +
"clause rather than a CSS class, and what holds the key for the model behind " +
"Jarvis."
},

/* ---------------------------------------------------------------- */
{ id: 'documents', title: 'Documents, and what happens to them',
  where: [['Clients', '#/clients'], ['The sales board', '#/floor']], text:
"Anything can be uploaded against a client or against an engagement: an MOU, an " +
"invoice, a brief, a screenshot of a payment. Several at once.\n\n" +
"YOU NAME EACH ONE AS YOU UPLOAD IT. Drop three files in and you are asked " +
"what each is before anything is filed, with the boxes already filled in from " +
"the filenames so pressing Save is a fine answer. A phone calls a photograph " +
"IMG_4471.jpg and a laptop calls a download document(3).pdf; three of those " +
"under one heading cannot be told apart without opening all three. The two " +
"'drop it in and let it read' boxes skip that step on purpose and still give " +
"the file a readable name.\n\n" +
"Every document is viewable, renamable, replaceable and deletable, from wherever " +
"it was uploaded. A photographed document, which is how a signed MOU actually " +
"arrives over WhatsApp, is downscaled and kept.\n\n" +
"Every one can be DOWNLOADED, so putting it here means not keeping it on a " +
"laptop, and SHARED, which makes a link somebody outside can open with no " +
"sign-in. That link expires after thirty days, can be stopped at any moment, " +
"and counts how many times it was opened. Anything filed as a credential, or " +
"named like a password, cannot be shared at all by anybody.\n\n" +
"Sharing needs the file to have reached the server. One uploaded before the " +
"server was connected lives only in that browser, and there is nothing for " +
"anybody else to fetch; re-upload it and the button works.\n\n" +
"They go to R2 on the server rather than into the browser, so they follow you " +
"between machines and do not fill up local storage. A role that may not see " +
"credentials does not receive the documents holding them.\n\n" +
"Jarvis can open the right upload slot and can rename, re-file, replace or " +
"delete anything already uploaded. He cannot upload one: a browser will not let " +
"JavaScript put a file into a file input, and no model changes that."
},

/* ---------------------------------------------------------------- */
{ id: 'inbox', title: 'The inbox: conversations, and who handles which',
  where: [['Inbox', '#/inbox'], ['Connections', '#/settings/connections']], text:
"Every WhatsApp and Instagram message lands in the Inbox as a CONVERSATION, one " +
"per person per channel. Somebody who writes on both is two conversations, " +
"because they are two separate 24-hour windows and two sets of rules.\n\n" +
"FILTER IT by Everything, WhatsApp or Instagram, and by Mine. The counts on the " +
"chips are real.\n\n" +
"WHO SEES WHAT. The owner sees every conversation. Everybody else sees only the " +
"ones handed to them, and that is enforced on the server rather than hidden on " +
"the screen: a salesperson asking for a conversation that is not theirs is told " +
"there is no such conversation.\n\n" +
"HANDING ONE OVER. Open it and press the name button at the top. It moves to " +
"that person's inbox and leaves everybody else's, and you can take it back the " +
"same way. THE CLIENT NOTICES NOTHING: every reply goes out from the one " +
"ZippyScale WhatsApp number and the one Instagram account, whoever writes it. " +
"They see one business; we see the rota. Who actually typed it is recorded " +
"under the message, for us.\n\n" +
"THE 24-HOUR WINDOW, which is Meta's rule and not ours. WhatsApp lets you write " +
"whatever you like for 24 hours after the customer last wrote to you. After " +
"that, only a template Meta has already approved will be delivered, and a plain " +
"message is refused rather than delivered late. The reply box says which of the " +
"two you are in before you start typing, and offers the templates when it has " +
"to.\n\n" +
"A MESSAGE IS NOT AN ENQUIRY. Nothing here opens a client or a deal by itself; " +
"there is a button for that when you decide it is one. A board that fills " +
"itself from every hello is a board nobody trusts."
},

/* ---------------------------------------------------------------- */
{ id: 'chatbot', title: 'The chatbot, and why it is a menu',
  where: [['Chatbot', '#/chatbot'], ['Inbox', '#/inbox']], text:
"One bot can answer on both WhatsApp and Instagram, or you can have one for " +
"each.\n\n" +
"IT IS A MENU, NOT SOMETHING THAT ANSWERS FREELY, and that is a decision rather " +
"than a shortcut. Anything a bot invents about price, about what is included or " +
"about when it will be ready is a promise made in your name, in writing, that " +
"the customer keeps on their phone. Every word this one can say is written on " +
"the Chatbot screen first.\n\n" +
"A bot is a list of STEPS. A step says something and offers up to three options " +
"(three because WhatsApp shows three buttons). An option leads to another step, " +
"or hands the conversation to a person, or opens an enquiry on the board, or " +
"stops. They can reply with the number or type the words.\n\n" +
"OFF, SUGGEST OR AUTO, and it arrives on Suggest. In Suggest it writes the reply " +
"and waits for somebody to press send. In Auto it answers on its own, day and " +
"night. Move a bot to Auto once you have watched it for a while, not before.\n\n" +
"IT GETS OUT OF THE WAY. The moment a person replies in that conversation, the " +
"bot stops there for good. Somebody asking for a human gets one immediately. And " +
"an answer the menu does not understand gets one nudge, then a person: a bot " +
"that repeats its menu at somebody answering in their own words loses the " +
"customer rather than the argument."
},

/* ---------------------------------------------------------------- */
{ id: 'bin', title: 'Deleting something, and getting it back',
  where: [['The bin', '#/bin'], ['Clients', '#/clients']], text:
"NOTHING IS DELETED OUTRIGHT. Anything you delete goes to the Bin and stays " +
"there for thirty days. After that it goes for good, on its own.\n\n" +
"Only the owner can delete, and only the owner can see the bin. Deleting asks " +
"you to type DELETE in capitals first, and tells you exactly what goes with it.\n\n" +
"WHOLE RECORDS GO TOGETHER. Deleting an engagement takes its meetings, " +
"follow-ups, invoices and documents with it. Deleting a CLIENT takes every " +
"engagement under them, every contact, and every document. Putting it back puts " +
"all of it back, in one piece, where it was.\n\n" +
"TWO THINGS REFUSE TO BE DELETED. A client with a PAID invoice, because that is " +
"an accounting record. And a client with a WON engagement, because that is " +
"delivery in flight. Mark the engagement lost, or void the invoice, if you " +
"genuinely mean it.\n\n" +
"THE SERVER HOLDS THE BIN, not the browser. That matters because it was the " +
"other way round at first and it did not work: the cockpit rebuilds everything " +
"from the server on each sync, so the list of what had been deleted emptied " +
"itself every twenty seconds while the records were already gone. Deleted now " +
"means captured on the server, where a restore can actually reach it, and a " +
"binned document keeps its file so putting it back gives you the document and " +
"not a broken link. A row marked 'this browser only' was deleted while the " +
"cockpit had no server, and lives only there.\n\n" +
"In the bin each row says what it is, who deleted it, when, how many days are " +
"left, and what it is carrying. Put it back restores it. The cross deletes it " +
"for good, and that is the one that cannot be undone. Empty it now clears the " +
"lot."
},

/* ---------------------------------------------------------------- */
{ id: 'money', title: 'Invoices, and what owed actually means',
  where: [['The sales board', '#/floor'], ['Reports', '#/reports']], text:
"An invoice is raised against an engagement, never against a company in the " +
"abstract, so every rupee traces back to a piece of work.\n\n" +
"It starts as a DRAFT. Nothing has been sent and nothing is owed. Sending it " +
"makes it due, and it carries its terms. Past those terms it is OVERDUE, which " +
"is what The Collector watches. Marking it PAID closes it.\n\n" +
"Owed is the sum of everything sent and not yet paid. It never counts drafts, " +
"because a draft is a thing you have not asked for yet, and counting it would " +
"flatter the number.\n\n" +
"The OPPORTUNITY VALUE is what the whole engagement is worth. It sits beside the " +
"stage on the engagement, because those are the two things anybody wants within " +
"a second of opening it. Invoices are raised against it and the split is " +
"measured against it. The difference between it and what has been invoiced is " +
"the bit nobody has asked for, which is its own trigger under Money.\n\n" +
"An ADVANCE is money received against an invoice before it is settled. It comes " +
"off what is outstanding and is counted as arrived, because it has. Paying the " +
"whole amount in advance clears the invoice: an invoice with nothing left owing " +
"that still reads \u201cnot cleared\u201d is a row arguing with itself.\n\n" +
"PAYMENT PROOF is read for you. Upload a screenshot, a UPI confirmation or a " +
"bank advice against the engagement and The Reconciler reads the amount, the " +
"date and the reference, matches it against the invoices raised, and proposes " +
"marking one cleared. It never clears one itself. Everything it read, and how " +
"sure it was, is kept on the invoice so the figure can be argued with later " +
"rather than simply believed."
},

/* ---------------------------------------------------------------- */
{ id: 'mom', title: 'Minutes of meeting, and why they come before the MOU',
  where: [['The sales board', '#/floor'], ['Clients', '#/clients']], text:
"MINUTES OF MEETING (MOM) is the first slot under Terms on an engagement, above " +
"the MOU, because that is the order things happen in. What was agreed on a call " +
"is what the MOU is then supposed to say.\n\n" +
"Upload one per meeting and name it for the date, so the list reads as a " +
"history. When a client remembers a call differently six weeks later, dated " +
"minutes are the only thing that settles it, and every dispute in this business " +
"has started with two people remembering one conversation two ways.\n\n" +
"It takes as many files as you like, like every other slot."
},

/* ---------------------------------------------------------------- */
{ id: 'delivery', title: 'What happens after the money',
  where: [['The delivery board', '#/processing']], text:
"A won deal moves to the delivery board, because the work after the money is " +
"done by a different person and tracked differently.\n\n" +
"Each build carries a plan: a start date, a duration, and a dated milestone for " +
"each stage of it. A milestone whose date passes unmet is SLIPPED, and it is on " +
"the overview the next morning.\n\n" +
"A build can be BLOCKED ON THE CLIENT, which is the single most common reason " +
"something sits still, and it is recorded as their delay rather than ours so the " +
"conversation later is a fact and not an argument.\n\n" +
"Handover is the end of it. After that the check-in trigger fires on whatever " +
"schedule you set."
},

/* ---------------------------------------------------------------- */
{ id: 'meetings', title: 'Booking a meeting, and the diary',
  where: [['The diary', '#/diary'], ['The sales board', '#/floor']], text:
"A meeting is booked on the engagement it belongs to: open it, then Log or book " +
"a meeting.\n\n" +
"It is one of three things, and each needs something different. A GOOGLE MEET " +
"needs a length, and the link is made for you. IN PERSON needs an address, which " +
"goes on the invite so it is useful on a phone at the door. A PHONE CALL needs " +
"only the time.\n\n" +
"Tick \u201cthis one has not happened yet\u201d and it goes into the real Google " +
"Calendar, with the invite sent to whoever you name. The meeting is saved here " +
"first, so if Google is unreachable you lose an invite rather than the record, " +
"and the row says what is missing: no Meet link yet, or no address yet.\n\n" +
"Removing a meeting here removes it from the Google Calendar too, cancels the " +
"invite, and frees the hour held after it.\n\n" +
"THE DIARY screen puts every meeting and every follow-up on one page, a day at a " +
"time. It shows what the cockpit knows. Something put straight into Google does " +
"not come back here, because reading the whole calendar would need a second " +
"sign-in to Google and a sync that can be wrong in both directions.\n\n" +
"Anything booked whose day has passed with nobody saying it happened is listed " +
"at the top. That list is worth clearing: a meeting nobody marked as held is a " +
"meeting nobody wrote up."
},

/* ---------------------------------------------------------------- */
{ id: 'reports-targets', title: 'Targets, reports and the date window',
  where: [['Reports', '#/reports'], ['Targets', '#/targets']], text:
"Every line carries a monthly target in builds and in value, and so does every " +
"person who sells. Both are set on the Targets screen, and the line targets are " +
"also on Settings, What we sell, because it is the same number.\n\n" +
"Reports pro-rates the target across whatever date window is picked, so a " +
"half-month window is measured against half a target rather than against a full " +
"one. That is the difference between a report that is useful mid-month and one " +
"that always looks like failure until the last day.\n\n" +
"The window at the top of the screen is shared: change it once and every figure " +
"on every screen follows it."
},

/* ---------------------------------------------------------------- */
{ id: 'signing-in', title: 'Signing in, passwords and who can do what',
  where: [['People', '#/settings/people'], ['Roles and access', '#/settings/access']], text:
"There is one way in: a username and a password, checked by the server. There is " +
"no tap-to-enter and no way to create a second account from the sign-in screen, " +
"whatever browser the address is typed into.\n\n" +
"Settings, People is where accounts are made. You set their username and their " +
"first password, and they change it themselves afterwards from the account menu. " +
"Only the owner can set a role. A password is hashed, so nobody, including the " +
"owner, can read anybody's password back: what replaces reading it is issuing a " +
"new one.\n\n" +
"Changing your own password ends every other session you have open. Signing out " +
"is in the account menu at the bottom of the rail."
}
  ];

  window.HANDBOOK = {
    sections: H,
    byId: function (id) { return H.filter(function (s) { return s.id === id; })[0] || null; },
    /* Every answer arrives with somewhere to go. A section that explains where
       something lives and then leaves you to find it has done half a job. */
    actionsFor: function (id) {
      var s = H.filter(function (x) { return x.id === id; })[0];
      return ((s && s.where) || []).map(function (w) { return [w[0], 'goto|' + w[1]]; });
    },
    /* The ids and titles, for the model to choose between. */
    index: function () {
      return H.map(function (s) { return s.id + ': ' + s.title; }).join('\n');
    },
    /* The whole thing as one block, for the model prompt. */
    text: function () {
      return H.map(function (s) { return '## ' + s.title + '\n' + s.text; }).join('\n\n');
    },
    /* A cheap local answer for the questions that get asked most, so the obvious
       ones cost nothing and do not wait on a network. Scored on words in common
       rather than anything clever, and it only answers when one section is
       clearly ahead of the rest. */
    find: function (q) {
      /* a word matches its own singular too: "rules" finds "rule" */
      function hit(hay, w) {
        return hay.indexOf(w) >= 0 ||
               (w.length > 4 && w.slice(-1) === 's' && hay.indexOf(w.slice(0, -1)) >= 0);
      }
      /* Tokens of three or more, keeping things like "ac-001" whole, because
         "what does AC-001 mean" is otherwise nothing but stop words. */
      var words = (String(q || '').toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) || [])
        .filter(function (w) { return STOP.indexOf(w) < 0; });
      if (!words.length) return null;

      var bodies = H.map(function (s) { return s.text.toLowerCase(); });
      var titles = H.map(function (s) { return s.title.toLowerCase(); });

      /* How many sections use each word. A word that appears in exactly one of
         them settles the question on its own: "contractor" is only in the roles
         section, so "what can a contractor see" has one honest answer. A word in
         half of them, like "client", settles nothing. */
      var rarity = {};
      words.forEach(function (w) {
        rarity[w] = bodies.filter(function (b) { return hit(b, w); }).length;
      });

      var scored = H.map(function (s, i) {
        var n = 0;
        words.forEach(function (w) {
          /* "automations" must find a heading that says "automation". A plural
             missing its singular is why "where are the automations" scored
             nothing against the section called How an automation is built. */
          if (hit(titles[i], w)) n += 3;                    /* in the heading */
          else if (hit(bodies[i], w)) n += rarity[w] === 1 ? 3 : 1;
        });
        return { s: s, n: n };
      }).sort(function (a, b) { return b.n - a.n; });

      if (scored[0].n < 3) return null;
      if (scored[1] && scored[1].n === scored[0].n) return null;   /* a tie is not an answer */
      return scored[0].s;
    }
  };
})();
