# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Amelia Boone Website Migration

## Project Overview

Website migration for Amelia Boone from WordPress/GoDaddy to Squarespace. This is a client project for **Night Owl Studio, LLC**.

## Client Context

**Client**: Amelia Boone (@arboone11)

- 4x World Champion obstacle racer, ultrarunner
- Corporate counsel at Apple
- Personal connection via Instagram/running community
- Contact: <amelia.boone@gmail.com>

**Current Site**: ameliabooneracing.com

- WordPress blog ("Race Ipsa Loquitur") with ~125 posts (2011-2023)
- Static HTML pages (about, race schedule, things I love)
- Hosted on GoDaddy, paying ~$900/year
- Outdated WP/PHP but functional
- Blog content is substantive personal writing—worth preserving

**What She Wants**:

- Migrate to Squarespace
- Preserve blog posts and URLs for SEO
- Skip the "Things I Love" sponsor page (no longer relevant)
- Use a SS template (mentioned Bogart, Devoe, Waverly as candidates)
- Social links, contact form, simple presence
- Stop paying $900/year for something she barely uses

## The Domain Problem

**Critical blocker**: The domain is registered under her ex's GoDaddy account. 2FA is tied to his phone. He is not responding to requests. Relationship ended badly.

**Options discussed**:

1. GoDaddy formal account recovery / registrant dispute process (ICANN)
2. Temporary redirect from old WP site to new domain (she still has WP admin access)
3. Register new domain and accept SEO loss

**Squarespace staging**: Site can be built on `[name].squarespace.com` subdomain independent of domain resolution. This lets work proceed while domain situation is sorted.

## Scope & Pricing

**Quoted**: $500-600 for full migration (6-8 hours estimated)

**Includes**:

- WordPress XML export
- Squarespace import and cleanup
- URL/SEO preservation
- Template setup and styling
- Image verification
- Redirect setup if needed

**Does NOT include**:

- Domain recovery (that's a legal/interpersonal issue)
- Ongoing maintenance
- Custom development beyond template configuration

## Technical Notes

### WordPress Export

- Standard WP XML export should work
- May need to scrape via API if export is flaky on old PHP
- Blog is the main content; static pages are trivial to recreate

### Squarespace Import

- Built-in WordPress importer handles most content
- Expect formatting cleanup on individual posts
- Watch for: embedded media, internal links, shortcodes

### Redirect Strategy (if domain unrecoverable)

- 301 redirect preferred for SEO equity transfer
- Can use WP plugin (Redirection, Simple 301 Redirects) since she has admin access
- Fallback: simple meta refresh page if plugin install is problematic
- She'd still pay some GoDaddy hosting to keep redirects alive (cost/benefit consideration)

## Communication Notes

- Client is busy (Apple corporate counsel)
- Offered call but email may be preferred—give her the option
- Kept GoDaddy suggestion brief to avoid mansplaining; she's a lawyer, she can escalate if she chooses
- Tone: professional, friendly, no-pressure

## Project Status

- [x] Initial inquiry via Instagram story
- [x] DM sent offering services
- [x] Email received with detailed requirements
- [x] Site analyzed
- [x] Quick acknowledgment sent
- [ ] Detailed reply with quote (DRAFT READY)
- [ ] Client approval / call
- [ ] WP credentials received
- [ ] Migration work begins
- [ ] Client review on staging domain
- [ ] Domain resolution (TBD)
- [ ] Launch

## Files & References

- Client email thread: Gmail, subject "Website Migration"
- Live site: <http://ameliabooneracing.com>
- Blog: <http://www.ameliabooneracing.com/blog/>
- Her Substack (active): <https://substack.com/@ameliaboone>

## Night Owl Studio Context

This is an early client project for the business. Good opportunity for:

- Portfolio/case study
- Referral potential (she has significant social following)
- Straightforward scope with clear deliverables

Keep documentation clean for potential future reference.
