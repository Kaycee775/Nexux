# Browser tests

End-to-end checks that drive the real UI with Playwright (Chromium).

```bash
# terminal 1: serve the app
python3 -m http.server 8765 --directory .

# terminal 2 (needs `npm i -g playwright` and a Chromium; set CHROMIUM=/path/to/chrome if it is not auto-detected)
node tests/smoke.js              # every module and tab as every demo role: no console errors, no crashed pages
node tests/flow.js               # lead → sale → proof → Finance confirms → receipt → ledger; maker-checker, 2-officer rule, period lock, approvals, Form A source rules, clock-in, leave, chat, auto-marked test
node tests/flow2.js              # transfer/revocation/commission/journal/reopen approvals, invoices, induction, source correction, SLA, migration importers, role overrides
node tests/fuzz.js u_md,u_fin1   # clicks every button on every page for the given roles and submits empty forms
```

Set `TRIOP_URL` to test a different address.
