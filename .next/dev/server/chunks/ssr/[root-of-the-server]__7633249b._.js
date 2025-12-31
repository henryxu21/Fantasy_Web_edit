module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/store.ts
/* =========================================================
   Blueprint Fantasy — Domain Store (STEP 1)
   - User / Session（原样保留）
   - Insight / Comment（原样可用）
   - ✅ NEW: League Domain（不破坏旧逻辑）
   ========================================================= */ __turbopack_context__.s([
    "addComment",
    ()=>addComment,
    "createInsight",
    ()=>createInsight,
    "createLeague",
    ()=>createLeague,
    "getInsightById",
    ()=>getInsightById,
    "getLeagueBySlug",
    ()=>getLeagueBySlug,
    "getSessionUser",
    ()=>getSessionUser,
    "listComments",
    ()=>listComments,
    "listInsights",
    ()=>listInsights,
    "listLeagues",
    ()=>listLeagues,
    "login",
    ()=>login,
    "logout",
    ()=>logout,
    "signup",
    ()=>signup
]);
const KEYS = {
    users: "bp_users",
    session: "bp_session",
    leagues: "bp_leagues",
    insights: "bp_insights",
    comments: "bp_comments"
};
/* ------------------ Utils ------------------ */ function safeParse(raw, fallback) {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch  {
        return fallback;
    }
}
function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
function canUseStorage() {
    try {
        if ("TURBOPACK compile-time truthy", 1) return false;
        //TURBOPACK unreachable
        ;
        const test = undefined;
    } catch  {
        return false;
    }
}
function slugify(input) {
    return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
function readUsers() {
    if (!canUseStorage()) return [];
    return safeParse(localStorage.getItem(KEYS.users), []);
}
function writeUsers(rows) {
    if (!canUseStorage()) return;
    localStorage.setItem(KEYS.users, JSON.stringify(rows));
}
function ensureUser(u) {
    return {
        id: String(u?.id ?? uid("u")),
        name: String(u?.name ?? "User"),
        email: String(u?.email ?? ""),
        username: String(u?.username ?? "user")
    };
}
function getSessionUser() {
    if (!canUseStorage()) return null;
    const raw = localStorage.getItem(KEYS.session);
    return raw ? ensureUser(JSON.parse(raw)) : null;
}
function signup(name, email, password) {
    if (!canUseStorage()) return {
        ok: false,
        error: "Storage unavailable"
    };
    const rows = readUsers();
    if (rows.some((r)=>r.user.email === email)) {
        return {
            ok: false,
            error: "Email already exists"
        };
    }
    const user = {
        id: uid("u"),
        name,
        email,
        username: email.split("@")[0]
    };
    rows.push({
        user,
        password
    });
    writeUsers(rows);
    localStorage.setItem(KEYS.session, JSON.stringify(user));
    return {
        ok: true,
        user
    };
}
function login(email, password) {
    if (!canUseStorage()) return {
        ok: false,
        error: "Storage unavailable"
    };
    const rows = readUsers();
    const row = rows.find((r)=>r.user.email === email);
    if (!row || row.password !== password) {
        return {
            ok: false,
            error: "Invalid credentials"
        };
    }
    localStorage.setItem(KEYS.session, JSON.stringify(row.user));
    return {
        ok: true,
        user: row.user
    };
}
function logout() {
    if (!canUseStorage()) return;
    localStorage.removeItem(KEYS.session);
}
function listLeagues() {
    if (!canUseStorage()) return [];
    return safeParse(localStorage.getItem(KEYS.leagues), []);
}
function getLeagueBySlug(slug) {
    return listLeagues().find((l)=>l.slug === slug) ?? null;
}
function createLeague(input) {
    if (!canUseStorage()) return {
        ok: false,
        error: "Storage unavailable"
    };
    const user = getSessionUser();
    if (!user) return {
        ok: false,
        error: "Login required"
    };
    const league = {
        id: uid("lg"),
        name: input.name.trim(),
        slug: slugify(input.name),
        ownerId: user.id,
        visibility: input.visibility,
        createdAt: Date.now()
    };
    const all = listLeagues();
    all.push(league);
    localStorage.setItem(KEYS.leagues, JSON.stringify(all));
    return {
        ok: true,
        league
    };
}
function getInsightById(id) {
    if (!canUseStorage()) return null;
    const all = listInsights();
    return all.find((i)=>i.id === id) ?? null;
}
function listInsights() {
    if (!canUseStorage()) return [];
    return safeParse(localStorage.getItem(KEYS.insights), []);
}
function createInsight(input) {
    if (!canUseStorage()) return {
        ok: false,
        error: "Storage unavailable"
    };
    const user = getSessionUser();
    if (!user) return {
        ok: false,
        error: "Login required"
    };
    const insight = {
        id: uid("ins"),
        title: input.title.trim(),
        body: input.body.trim(),
        leagueSlug: input.leagueSlug,
        author: user.name,
        createdAt: Date.now(),
        heat: Math.floor(80 + Math.random() * 200)
    };
    const all = listInsights();
    all.unshift(insight);
    localStorage.setItem(KEYS.insights, JSON.stringify(all));
    return {
        ok: true,
        insight
    };
}
function listComments(insightId) {
    if (!canUseStorage()) return [];
    const all = safeParse(localStorage.getItem(KEYS.comments), []);
    return all.filter((c)=>c.insightId === insightId);
}
function addComment(insightId, body) {
    if (!canUseStorage()) return {
        ok: false,
        error: "Storage unavailable"
    };
    const user = getSessionUser();
    if (!user) return {
        ok: false,
        error: "Login required"
    };
    const all = safeParse(localStorage.getItem(KEYS.comments), []);
    const comment = {
        id: uid("c"),
        insightId,
        author: user.name,
        body: body.trim(),
        createdAt: Date.now()
    };
    all.push(comment);
    localStorage.setItem(KEYS.comments, JSON.stringify(all));
    return {
        ok: true,
        comment
    };
}
}),
"[project]/app/insights/[id]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>InsightDetailPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function InsightDetailPage() {
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [insight, setInsight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!id) return;
        const all = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listInsights"])();
        const found = all.find((i)=>i.id === id) ?? null;
        setInsight(found);
        setLoading(false);
    }, [
        id
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "lb-detail-page",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "lb-header",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lb-header-inner",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "lb-logo",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "lb-logo-icon",
                                    children: "蓝"
                                }, void 0, false, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 31,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "lb-logo-text",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "lb-logo-title",
                                            children: "蓝本"
                                        }, void 0, false, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 33,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "lb-logo-sub",
                                            children: "Fantasy 决策平台"
                                        }, void 0, false, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 34,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 32,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/insights/[id]/page.tsx",
                            lineNumber: 30,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/insights/[id]/page.tsx",
                        lineNumber: 29,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/insights/[id]/page.tsx",
                    lineNumber: 28,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "lb-detail-container",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lb-detail-card",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lb-detail-header",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    color: "#9ca3af"
                                },
                                children: "Loading..."
                            }, void 0, false, {
                                fileName: "[project]/app/insights/[id]/page.tsx",
                                lineNumber: 42,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/insights/[id]/page.tsx",
                            lineNumber: 41,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/insights/[id]/page.tsx",
                        lineNumber: 40,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/insights/[id]/page.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/insights/[id]/page.tsx",
            lineNumber: 27,
            columnNumber: 7
        }, this);
    }
    if (!insight) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "lb-detail-page",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "lb-header",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lb-header-inner",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "lb-logo",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "lb-logo-icon",
                                    children: "蓝"
                                }, void 0, false, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 56,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "lb-logo-text",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "lb-logo-title",
                                            children: "蓝本"
                                        }, void 0, false, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 58,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "lb-logo-sub",
                                            children: "Fantasy 决策平台"
                                        }, void 0, false, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 59,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 57,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/insights/[id]/page.tsx",
                            lineNumber: 55,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/insights/[id]/page.tsx",
                        lineNumber: 54,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/insights/[id]/page.tsx",
                    lineNumber: 53,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "lb-detail-container",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lb-detail-card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lb-detail-header",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "lb-detail-title",
                                        children: "Judgment Not Found"
                                    }, void 0, false, {
                                        fileName: "[project]/app/insights/[id]/page.tsx",
                                        lineNumber: 67,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            color: "#9ca3af"
                                        },
                                        children: "This judgment may have been deleted or does not exist."
                                    }, void 0, false, {
                                        fileName: "[project]/app/insights/[id]/page.tsx",
                                        lineNumber: 68,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/insights/[id]/page.tsx",
                                lineNumber: 66,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lb-detail-footer",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "lb-back-btn",
                                    onClick: ()=>router.push("/"),
                                    children: "Back to Home"
                                }, void 0, false, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 73,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/insights/[id]/page.tsx",
                                lineNumber: 72,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/insights/[id]/page.tsx",
                        lineNumber: 65,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/insights/[id]/page.tsx",
                    lineNumber: 64,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/insights/[id]/page.tsx",
            lineNumber: 52,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "lb-detail-page",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "lb-header",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "lb-header-inner",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "lb-logo",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lb-logo-icon",
                                children: "蓝"
                            }, void 0, false, {
                                fileName: "[project]/app/insights/[id]/page.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lb-logo-text",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "lb-logo-title",
                                        children: "蓝本"
                                    }, void 0, false, {
                                        fileName: "[project]/app/insights/[id]/page.tsx",
                                        lineNumber: 90,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "lb-logo-sub",
                                        children: "Fantasy 决策平台"
                                    }, void 0, false, {
                                        fileName: "[project]/app/insights/[id]/page.tsx",
                                        lineNumber: 91,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/insights/[id]/page.tsx",
                                lineNumber: 89,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/insights/[id]/page.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/insights/[id]/page.tsx",
                    lineNumber: 86,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/insights/[id]/page.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "lb-detail-container",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "lb-detail-card",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lb-detail-header",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "lb-detail-title",
                                    children: insight.title
                                }, void 0, false, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 100,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "lb-detail-meta",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                "by ",
                                                insight.author
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 102,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "|"
                                        }, void 0, false, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 103,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: new Date(insight.createdAt).toLocaleString()
                                        }, void 0, false, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 104,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "|"
                                        }, void 0, false, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 105,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                "🔥 ",
                                                insight.heat
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/insights/[id]/page.tsx",
                                            lineNumber: 106,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 101,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/insights/[id]/page.tsx",
                            lineNumber: 99,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lb-detail-body",
                            children: insight.body
                        }, void 0, false, {
                            fileName: "[project]/app/insights/[id]/page.tsx",
                            lineNumber: 110,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lb-detail-footer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "lb-back-btn",
                                    onClick: ()=>router.back(),
                                    children: "Back"
                                }, void 0, false, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 113,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "lb-back-btn",
                                    onClick: ()=>router.push("/"),
                                    children: "Home"
                                }, void 0, false, {
                                    fileName: "[project]/app/insights/[id]/page.tsx",
                                    lineNumber: 116,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/insights/[id]/page.tsx",
                            lineNumber: 112,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/insights/[id]/page.tsx",
                    lineNumber: 98,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/insights/[id]/page.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/insights/[id]/page.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7633249b._.js.map