#!/bin/bash
exec python3 -c "$(cat <<'PYEOF'
import json, sys, os, subprocess, time, hashlib, glob
from datetime import datetime
from pathlib import Path

# ── ANSI colors ──────────────────────────────────────────────────────────
R       = '\033[0m'
BOLD    = '\033[1m'
CYAN    = '\033[96m'
BLUE    = '\033[94m'
GREEN   = '\033[92m'
YELLOW  = '\033[93m'
ORANGE  = '\033[38;5;214m'
RED     = '\033[91m'
MAGENTA = '\033[95m'
GRAY    = '\033[90m'
SEP     = f'{GRAY}│{R}'

# ── Input ────────────────────────────────────────────────────────────────
try:
    inp = json.load(sys.stdin)
except Exception:
    inp = {}

model_id        = (inp.get('model') or {}).get('id', '') or ''
model_name      = (inp.get('model') or {}).get('display_name', '') or model_id
cwd             = (inp.get('workspace') or {}).get('current_dir') or inp.get('cwd') or ''
transcript_path = inp.get('transcript_path', '') or ''
output_style    = (inp.get('output_style') or {}).get('name', '') or ''
cost_obj        = inp.get('cost') or {}

# ── Helpers ──────────────────────────────────────────────────────────────
def fmt_tokens(n):
    if n >= 1_000_000: return f'{n/1_000_000:.1f}M'
    if n >= 1000:      return f'{n//1000}K'
    return str(n)

def pct_color(p):
    if p >= 90: return BOLD + RED
    if p >= 80: return ORANGE
    if p >= 50: return YELLOW
    return GREEN

def bar(pct, width=10):
    pct = max(0, min(100, pct))
    filled = pct * width // 100
    return '█' * filled, '░' * (width - filled)

def tail_lines(path, n=80):
    try:
        with open(path, 'rb') as f:
            f.seek(0, 2)
            size = f.tell()
            buf = b''
            while size > 0 and buf.count(b'\n') <= n:
                read = min(16384, size)
                f.seek(size - read)
                buf = f.read(read) + buf
                size -= read
            return buf.decode('utf-8', errors='ignore').splitlines()[-n:]
    except Exception:
        return []

# ── 1M context detection ─────────────────────────────────────────────────
ctx_total = 200_000
lname = (model_name or '') + ' ' + (model_id or '')
if '1m' in lname.lower() or '[1m]' in lname.lower():
    ctx_total = 1_000_000

# ── Context usage from transcript ────────────────────────────────────────
ctx_used = 0
if transcript_path and os.path.exists(transcript_path):
    for line in reversed(tail_lines(transcript_path, 100)):
        try:
            d = json.loads(line)
        except Exception:
            continue
        m = d.get('message')
        if isinstance(m, dict) and m.get('role') == 'assistant' and 'usage' in m:
            u = m['usage'] or {}
            ctx_used = (
                (u.get('input_tokens') or 0)
              + (u.get('cache_read_input_tokens') or 0)
              + (u.get('cache_creation_input_tokens') or 0)
            )
            mid = (m.get('model') or '').lower()
            if '1m' in mid and ctx_total < 900_000:
                ctx_total = 1_000_000
            break

pct = int(ctx_used * 100 / ctx_total) if ctx_total else 0
bf, be = bar(pct)
cc = pct_color(pct)
ctx_str = f'{cc}{bf}{GRAY}{be}{R} {cc}{pct}%{R} {GRAY}{fmt_tokens(ctx_used)}/{fmt_tokens(ctx_total)}{R}'

# ── 5-hour rolling window (cached 30s) ───────────────────────────────────
now = time.time()
five_h_ago = now - 5 * 3600

sub_tier = 'pro'
try:
    cred = json.loads((Path.home() / '.claude' / '.credentials.json').read_text())
    sub_tier = (cred.get('claudeAiOauth') or {}).get('subscriptionType') or 'pro'
except Exception:
    pass

# Approximate 5h token budgets (Anthropic doesn't publish exact caps for Claude Code;
# these are rough visualization thresholds based on community observations).
# Counts input + output + cache_creation; cache_read is essentially free.
TOKEN_CAPS = {
    'pro':     2_000_000,
    'max_5x': 10_000_000,
    'max_20x':40_000_000,
    'free':     100_000,
}
cap = TOKEN_CAPS.get(sub_tier, 2_000_000)

proj_key = hashlib.md5((cwd or '').encode()).hexdigest()[:10]
cache_file = Path(f'/tmp/claude-sl-5h-{proj_key}')

msg_count = 0
tok_billable = 0   # input + output + cache_creation (counts toward rate-limit)
tok_cache_read = 0 # cache_read (effectively free, shown separately)
use_cache = False
if cache_file.exists() and (now - cache_file.stat().st_mtime) < 30:
    try:
        c = json.loads(cache_file.read_text())
        msg_count      = c.get('msgs', 0)
        tok_billable   = c.get('bill', 0)
        tok_cache_read = c.get('cr', 0)
        use_cache = True
    except Exception:
        pass

if not use_cache and cwd:
    import re
    enc = re.sub(r'[^A-Za-z0-9]', '-', cwd)
    proj_dir = Path.home() / '.claude' / 'projects' / enc
    if proj_dir.exists():
        for jsonl in proj_dir.glob('*.jsonl'):
            try:
                if jsonl.stat().st_mtime < five_h_ago:
                    continue
                with open(jsonl) as f:
                    for line in f:
                        try:
                            d = json.loads(line)
                        except Exception:
                            continue
                        ts = d.get('timestamp', '')
                        try:
                            t = datetime.fromisoformat(ts.replace('Z', '+00:00')).timestamp()
                        except Exception:
                            continue
                        if t < five_h_ago:
                            continue
                        m = d.get('message')
                        if isinstance(m, dict) and m.get('role') == 'assistant':
                            u = m.get('usage') or {}
                            if u:
                                msg_count += 1
                                tok_billable += (
                                    (u.get('input_tokens') or 0)
                                  + (u.get('output_tokens') or 0)
                                  + (u.get('cache_creation_input_tokens') or 0)
                                )
                                tok_cache_read += (u.get('cache_read_input_tokens') or 0)
            except Exception:
                continue
    try:
        cache_file.write_text(json.dumps({
            'msgs': msg_count, 'bill': tok_billable, 'cr': tok_cache_read
        }))
    except Exception:
        pass

rate_pct = min(100, int(tok_billable * 100 / cap)) if cap else 0
rc = pct_color(rate_pct)
rbf, rbe = bar(rate_pct, 8)
rate_str = (
    f'{rc}5h {rbf}{GRAY}{rbe}{R} '
    f'{rc}{fmt_tokens(tok_billable)}/{fmt_tokens(cap)}{R} '
    f'{GRAY}({msg_count} msgs, {fmt_tokens(tok_cache_read)} cache){R}'
)

# ── Model display ────────────────────────────────────────────────────────
short_model = (model_name or model_id).replace('Claude ', '').strip() or '?'
is_1m = f' {MAGENTA}[1M]{R}' if ctx_total >= 900_000 else ''
model_str = f'{BOLD}{CYAN}{short_model}{R}{is_1m}'

# ── Working dir ──────────────────────────────────────────────────────────
home = os.path.expanduser('~')
short_cwd = cwd
if cwd.startswith(home):
    short_cwd = '~' + cwd[len(home):]
parts = short_cwd.rstrip('/').split('/')
if len([p for p in parts if p]) > 2:
    dir_disp = f'…/{parts[-2]}/{parts[-1]}'
else:
    dir_disp = short_cwd or '?'
dir_str = f'{BLUE}{dir_disp}{R}'

# ── Git branch ───────────────────────────────────────────────────────────
git_str = ''
if cwd and os.path.isdir(cwd):
    try:
        branch = subprocess.check_output(
            ['git', '-C', cwd, '--no-optional-locks', 'rev-parse', '--abbrev-ref', 'HEAD'],
            stderr=subprocess.DEVNULL, timeout=1
        ).decode().strip()
        if branch and branch != 'HEAD':
            dirty = ''
            try:
                subprocess.check_call(
                    ['git', '-C', cwd, '--no-optional-locks', 'diff', '--quiet'],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=1)
                subprocess.check_call(
                    ['git', '-C', cwd, '--no-optional-locks', 'diff', '--cached', '--quiet'],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=1)
            except Exception:
                dirty = f'{YELLOW}*{R}'
            git_str = f' {MAGENTA}⎇ {branch}{R}{dirty}'
    except Exception:
        pass

# ── Session cost + duration ──────────────────────────────────────────────
cost_usd = cost_obj.get('total_cost_usd') or 0
dur_ms   = cost_obj.get('total_duration_ms') or 0
cost_str = ''
if cost_usd or dur_ms:
    mins = dur_ms / 60000
    if mins >= 60:
        tstr = f'{int(mins//60)}h{int(mins%60)}m'
    else:
        tstr = f'{int(mins)}m'
    cost_str = f'{GRAY}${cost_usd:.2f} · {tstr}{R}'

# ── Output style (only if non-default) ───────────────────────────────────
style_str = ''
if output_style and output_style not in ('default', ''):
    style_str = f'{GRAY}{output_style}{R}'

# ── Assemble ─────────────────────────────────────────────────────────────
segments = []
segments.append(model_str)
segments.append(dir_str + git_str)
segments.append(ctx_str)
segments.append(rate_str)
if cost_str:  segments.append(cost_str)
if style_str: segments.append(style_str)

sys.stdout.write(f' {SEP} '.join(segments))
PYEOF
)"
