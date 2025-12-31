// lib/data.ts
// 纯数据层：不关心 auth、不关心 request、不关心 Next.js

/* ======================
   Types
====================== */

export type User = {
  id: string;
  username: string;
  name: string;
  joinedAt: string;
};

export type Insight = {
  id: string;
  title: string;
  authorId: string;
  authorUsername: string;
};

export type League = {
  id: string;
  slug: string;
  name: string;
  ownerId: string;
};

/* ======================
   Mock Database
====================== */

// 用户表
const USERS: User[] = [
  {
    id: "u1",
    username: "abcd",
    name: "ABCD",
    joinedAt: "2024-12",
  },
  {
    id: "u2",
    username: "ivy",
    name: "Ivy",
    joinedAt: "2024-11",
  },
];

// 洞见表
const INSIGHTS: Insight[] = [
  {
    id: "why-i-passed-on-tatum",
    title: "Why I passed on Tatum at 1.06",
    authorId: "u1",
    authorUsername: "abcd",
  },
  {
    id: "auction-scarcity",
    title: "Auction: stop chasing scarcity",
    authorId: "u1",
    authorUsername: "abcd",
  },
  {
    id: "rookie-overreaction",
    title: "Rookie hype is overpriced",
    authorId: "u1",
    authorUsername: "abcd",
  },
];

// 联盟表
const LEAGUES: League[] = [
  {
    id: "l1",
    slug: "lebron-lab",
    name: "LeBron Lab",
    ownerId: "u1",
  },
  {
    id: "l2",
    slug: "auction-chaos",
    name: "Auction Chaos",
    ownerId: "u2",
  },
];

/* ======================
   Query Functions
====================== */

/** 根据 username 取用户 */
export async function getUserByUsername(username: string): Promise<User | null> {
  return USERS.find((u) => u.username === username) ?? null;
}

/** 取某个用户的洞见 */
export async function getInsightsByUser(userId: string): Promise<Insight[]> {
  return INSIGHTS.filter((i) => i.authorId === userId);
}

/** 取某个用户拥有的联盟 */
export async function getLeaguesByUser(userId: string): Promise<League[]> {
  return LEAGUES.filter((l) => l.ownerId === userId);
}
