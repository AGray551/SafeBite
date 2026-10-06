# SafeBite

SafeBite is a responsive web application for University of Cincinnati students to find dining halls, explore menus, check food against their allergies and dietary restrictions, save favorites, and report inaccurate information. Menu data is scraped from UC Dining's public website. Crowd and wait-time information and pre-order/pickup are stretch goals, depending on whether data and access are available.

## Project plan

- [GitHub Project](https://github.com/users/AGray551/projects/4)
- [Issues and implementation plan](https://github.com/AGray551/SafeBite/issues)
- [Milestones](https://github.com/AGray551/SafeBite/milestones)
- [Shared Files](https://mailuc-my.sharepoint.com/:f:/g/personal/andrewgw_mail_uc_edu/IgD-XThq_k3NTLBciPaj6OJAAW6xSG-LGkGAtcxJ7nO-jEA?e=flLh8N)

## Objectives and scope

The MVP covers finding dining halls, viewing scraped menus with dietary safety information, dietary profiles, favorites, reporting inaccurate information, and responsive accessibility. Crowd/wait-time comparison and pre-order/scheduled pickup are stretch work, depending on feasibility. The dining-staff admin interface is out of scope for v1, because menu data comes from scraping rather than staff entry.

### Measurable objectives

1. Provide a responsive student web experience for finding dining halls, viewing menus, managing a dietary profile, saving favorites, and reporting inaccurate information.
2. Check every menu item in the demonstration dataset against a student's saved allergies and dietary restrictions, and show a clearly visible safety result (**Safe / Caution / Avoid**).
3. Support an end-to-end demonstration of the core student journey: update a dietary profile, find a dining hall, assess menu items, save a favorite, and submit an information report.
4. Scrape and normalize UC Dining menu data on a schedule, storing a "last updated" time for every menu and item and flagging data that is out of date.
5. Complete accessibility, responsive, and end-to-end test passes before final delivery, resolving critical issues found during testing.

**Out of scope:** delivery drivers, tipping, restaurant ratings or reviews, social feeds, credit-card checkout, full POS functionality, advanced AI recommendation systems, and (for v1) a dining-staff admin interface.

## Feature priorities

> **Assumption:** Menu data is scraped from UC Dining's website. There is no dining-staff dashboard in v1.

### Must have (v1)

| Feature | Notes |
| --- | --- |
| Welcome, sign-in & create account | UC email + password; no SSO |
| Dietary profile setup | Allergies, intolerances, preferences, how strict each one is, safety notice, "Skip for now" |
| Personalized safety status | **Safe / Caution / Avoid** on every item, shown with an icon, a word and a border style, not color alone |
| Scraped menus | By dining hall and meal period (Breakfast / Lunch / Dinner), plus open/closed status and hours |
| Menu item detail | Contains, may contain, ingredients, nutrition facts, dietary compatibility |
| Data freshness | "Last updated" time on every menu and item, plus a warning when data is out of date |
| "Safe for Me" + dietary filters | Always shows how many items are hidden and why |
| Home dashboard | Greeting, current meal period, search, dining halls, meals recommended for your profile |
| Dining hall list & detail | Menu sorted into categories |
| Search across dining halls | e.g. "pizza", "chicken", "gluten free" |
| Report incorrect information | Reports go to the SafeBite team (no staff dashboard) |
| Profile & settings | Edit dietary profile, delete dietary data, accessibility (larger text, reduced motion, high contrast) |

### Nice to have

| Feature | Notes |
| --- | --- |
| Ingredient-change alerts | Compare each new scrape with the last one; alert students who saved an affected item. **Build this first in this bucket.** |
| Favorites | Saved meals and dining halls, with a "favorite available" notification |
| Extra quick filters | High Protein, Under 600 calories |
| Advanced search filters | Calories, meal period |
| Map view | Dining hall locations |
| "Best bet right now" card | Top of Home |
| Notification settings | Per-type on/off switches |

### Later (needs data or access we don't have yet)

| Feature | Blocker |
| --- | --- |
| Crowd levels, wait times, trends, hourly chart | No source for how busy a hall is. Moves up if we get occupancy data, student check-ins or historical patterns |
| Pre-ordering & pickup status | Needs a link to the dining halls' ordering system |
| Staff admin (dashboard, menu management, issue review) | Cut, since we're scraping |
| "Verified by staff" labels, notes for kitchen staff | Depend on the staff side |

### Wireframe changes

- [ ] Move the 5 order screens to a "Later" section
- [ ] Replace the **Orders** tab in the bottom navigation with **Search** or **Favorites**
- [ ] Remove crowd and wait-time information, or label it as a placeholder
- [ ] Add "Last updated" times to menu and item screens

## Project management and communication

Work is tracked as GitHub Issues on the project board using Backlog, Ready, In Progress, Review / Testing, and Done. Issues are organized by phase, priority, owner, and target date. The team uses issue discussions, pull requests, and regular advisor/team check-ins to coordinate decisions, blockers, and review.

## Phases

1. Planning & Architecture
2. UX & Prototype
3. Backend Foundation (including the menu scraper and data pipeline)
4. Student Web App
5. Crowd, Orders & Admin (stretch / deferred, see [Later](#later-needs-data-or-access-we-dont-have-yet))
6. Integration & Testing
7. Final Delivery

## Team roles

Roles and ownership are recorded per issue. Student-facing web, backend/data (including scraping), UX/accessibility, and testing responsibilities are coordinated through the project board.

## Tools and technology

- GitHub repository, Issues, Projects, milestones, and iterations for source control and project management.
- Markdown documentation in the repository for the project plan and technical decisions.
- Figma for UX and prototype work, as tracked in the planning issues.
- A responsive web application for implementation and demonstration.
- A scheduled scraper that collects and normalizes UC Dining menu, ingredient, allergen, and nutrition data.
- The final frontend, backend, database, authentication, hosting, scraping, and testing stack will be selected and documented in the technology-stack planning issue before implementation begins.

## Risks and constraints

- **Data source:** whether UC Dining's terms of use allow scraping, and how stable the site's structure is. An official feed is preferred if one exists.
- **Dietary-safety accuracy:** scraped allergen and ingredient data may be incomplete or out of date. The app shows "last updated" times and a safety notice telling students to confirm severe allergies with dining staff.
- **Occupancy/wait-time feasibility:** there is no known data source yet.
- **Pre-order feasibility:** requires integration with the dining halls' ordering system.
- **Privacy and security** of dietary data.
- **Accessibility, cross-browser responsiveness,** and schedule constraints.

## Open questions

- [ ] Do UC Dining's terms of use allow scraping?
- [ ] Is there an official menu feed? It would make allergen data more dependable.
- [ ] How often do we scrape, and when does data count as out of date?

## GitHub owner mapping

- Gray: [AGray551](https://github.com/AGray551)
- Conner: [Connermatthewking](https://github.com/Connermatthewking)
- Colson: [22fishc](https://github.com/22fishc)
- Silas: [sil6s](https://github.com/sil6s)

Tickets assigned to a named contributor use this mapping; Team-only tickets remain unassigned.
