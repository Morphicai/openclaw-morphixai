#!/bin/bash

# OpenClaw Office Package Verification Script
# Run this after installation to verify everything is set up correctly

set -e

echo "🔍 OpenClaw Office — Installation Verification"
echo ""

PASS=0
FAIL=0
WARN=0

check_pass() {
    echo "✅ $1"
    ((PASS++))
}

check_fail() {
    echo "❌ $1"
    ((FAIL++))
}

check_warn() {
    echo "⚠️  $1"
    ((WARN++))
}

# Check 1: Skills installed
echo "1️⃣  Checking skills..."
if [ -f ~/.openclaw/skills/gitlab-workflow/SKILL.md ]; then
    check_pass "gitlab-workflow skill installed"
else
    check_fail "gitlab-workflow skill missing"
fi

if [ -f ~/.openclaw/skills/daily-standup/SKILL.md ]; then
    check_pass "daily-standup skill installed"
else
    check_fail "daily-standup skill missing"
fi

if [ -f ~/.openclaw/skills/release-workflow/SKILL.md ]; then
    check_pass "release-workflow skill installed"
else
    check_fail "release-workflow skill missing"
fi

if [ -f ~/.openclaw/skills/pipedream-proxy/SKILL.md ]; then
    check_pass "pipedream-proxy skill installed (optional)"
else
    check_warn "pipedream-proxy skill not installed (optional for unified credentials)"
fi

echo ""

# Check 2: Templates copied
echo "2️⃣  Checking templates..."
if [ -f ~/.openclaw/agents/main/agent/SOUL.md ]; then
    check_pass "SOUL.md template copied"
else
    check_fail "SOUL.md template missing"
fi

if [ -f ~/.openclaw/agents/main/agent/AGENTS.md ]; then
    check_pass "AGENTS.md template copied"
else
    check_fail "AGENTS.md template missing"
fi

if [ -f ~/.openclaw/openclaw.json ]; then
    check_pass "openclaw.json config exists"
else
    check_fail "openclaw.json config missing"
fi

echo ""

# Check 3: Config values
echo "3️⃣  Checking configuration..."
if grep -q "CHANGE_ME" ~/.openclaw/openclaw.json 2>/dev/null; then
    check_fail "openclaw.json still has CHANGE_ME placeholder"
else
    check_pass "openclaw.json email configured"
fi

if [ -f ~/.openclaw/.env ]; then
    check_pass ".env file exists"

    # Check for credential mode
    if grep -q "PIPEDREAM_TOKEN" ~/.openclaw/.env 2>/dev/null && ! grep -q "your-pipedream-api-key" ~/.openclaw/.env; then
        check_pass "Pipedream mode configured"
    elif grep -q "your-gitlab-token-here" ~/.openclaw/.env 2>/dev/null; then
        check_warn ".env has placeholder tokens (need to replace)"
    elif grep -q "GITLAB_TOKEN" ~/.openclaw/.env 2>/dev/null || grep -q "JIRA_API_TOKEN" ~/.openclaw/.env 2>/dev/null; then
        check_pass "Local tokens configured"
    else
        check_warn ".env exists but no tokens found"
    fi
else
    check_fail ".env file missing"
fi

echo ""

# Check 4: File permissions
echo "4️⃣  Checking file permissions..."
if [ "$(stat -f %A ~/.openclaw 2>/dev/null)" = "700" ]; then
    check_pass "~/.openclaw/ permissions correct (700)"
else
    check_warn "~/.openclaw/ permissions should be 700"
fi

if [ -f ~/.openclaw/openclaw.json ]; then
    if [ "$(stat -f %A ~/.openclaw/openclaw.json 2>/dev/null)" = "600" ]; then
        check_pass "openclaw.json permissions correct (600)"
    else
        check_warn "openclaw.json permissions should be 600"
    fi
fi

if [ -f ~/.openclaw/.env ]; then
    if [ "$(stat -f %A ~/.openclaw/.env 2>/dev/null)" = "600" ]; then
        check_pass ".env permissions correct (600)"
    else
        check_warn ".env permissions should be 600"
    fi
fi

echo ""

# Check 5: Dependencies
echo "5️⃣  Checking dependencies..."
if command -v openclaw &> /dev/null; then
    check_pass "openclaw CLI installed"
else
    check_fail "openclaw CLI not found (run: npm i -g openclaw@latest)"
fi

if command -v glab &> /dev/null; then
    check_pass "glab CLI installed"
else
    check_warn "glab CLI not found (required for gitlab-workflow skill)"
fi

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed ($NODE_VERSION)"
else
    check_fail "Node.js not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: ✅ $PASS passed | ❌ $FAIL failed | ⚠️  $WARN warnings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 Installation looks good! Run 'openclaw gateway start' to begin."
    echo ""
    echo "Next steps:"
    echo "  1. Edit ~/.openclaw/.env with your actual tokens"
    echo "  2. Edit ~/.openclaw/openclaw.json (change email, env)"
    echo "  3. Start: openclaw gateway start"
    echo "  4. Test in Tanka DM: standup"
    exit 0
else
    echo "🚨 Found $FAIL critical issues. Please fix before starting."
    echo ""
    echo "Quick fixes:"
    echo "  - Install skills: cd packages/openclaw-office && node index.js install"
    echo "  - Copy templates: cp templates/*.md ~/.openclaw/agents/main/agent/"
    echo "  - Copy config: cp templates/openclaw.personal.json ~/.openclaw/openclaw.json"
    exit 1
fi
