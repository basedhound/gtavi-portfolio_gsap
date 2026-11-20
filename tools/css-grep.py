#!/usr/bin/env python3
"""Print CSS rules matching any of the given substrings, keeping their @media / @supports context.
   python3 tools/css-grep.py <file.css> <pattern> [pattern...]
   The CSS file is a dump of a page's stylesheets (see AGENTS.md Findings for how it was made)."""
import sys, re
css = open(sys.argv[1]).read()
pats = sys.argv[2:]
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
def blocks(s):
    i, n, out = 0, len(s), []
    while i < n:
        j = s.find('{', i)
        if j < 0: break
        head = s[i:j].strip(); depth = 1; k = j + 1
        while k < n and depth:
            if s[k] == '{': depth += 1
            elif s[k] == '}': depth -= 1
            k += 1
        out.append((head, s[j+1:k-1])); i = k
    return out
def walk(s, ctx):
    for head, body in blocks(s):
        if head.startswith('@media') or head.startswith('@supports') or head.startswith('@layer') or head.startswith('@container'):
            walk(body, ctx + [head])
        elif any(p in head for p in pats):
            print((' » '.join(ctx) + '\n  ' if ctx else '') + head + ' { ' + ' '.join(body.split()) + ' }\n')
walk(css, [])
