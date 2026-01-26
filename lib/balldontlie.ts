// lib/balldontlie.ts
// Ball Don't Lie API Integration for ALL-STAR tier

const API_BASE = "https://api.balldontlie.io/v1";

const API_KEY = "14fd7de0-c9c0-40d3-bbeb-e8c86a61d56a";
// ==================== Types ====================

export type BDLTeam = {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
};

export type BDLPlayer = {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: BDLTeam;
};

export type BDLGameStats = {
  id: number;
  min: string;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
  plus_minus: number;
  player: BDLPlayer;
  team: BDLTeam;
  game: {
    id: number;
    date: string;
    season: number;
    status: string;
  };
};

export type BDLInjury = {
  player: BDLPlayer;
  return_date: string;
  description: string;
  status: string; // "Out", "Questionable", "Probable", "Doubtful"
};

export type BDLGame = {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: BDLTeam;
  visitor_team: BDLTeam;
};

// ==================== API Functions ====================

async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: API_KEY,
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ==================== Players ====================

export async function getActivePlayers(options?: {
  search?: string;
  per_page?: number;
  cursor?: number;
}): Promise<{ data: BDLPlayer[]; meta: { next_cursor?: number; per_page: number } }> {
  const params: Record<string, string> = {};
  if (options?.search) params.search = options.search;
  if (options?.per_page) params.per_page = options.per_page.toString();
  if (options?.cursor) params.cursor = options.cursor.toString();

  return fetchAPI("/players/active", params);
}

export async function getAllActivePlayers(): Promise<BDLPlayer[]> {
  const allPlayers: BDLPlayer[] = [];
  let cursor: number | undefined;

  do {
    const response = await getActivePlayers({ per_page: 100, cursor });
    allPlayers.push(...response.data);
    cursor = response.meta.next_cursor;
  } while (cursor);

  return allPlayers;
}

export async function getPlayerById(id: number): Promise<BDLPlayer> {
  const response = await fetchAPI<{ data: BDLPlayer }>(`/players/${id}`);
  return response.data;
}

export async function searchPlayers(query: string): Promise<BDLPlayer[]> {
  const response = await getActivePlayers({ search: query, per_page: 25 });
  return response.data;
}

// ==================== Player Stats ====================

export async function getPlayerStats(options: {
  player_ids?: number[];
  game_ids?: number[];
  seasons?: number[];
  start_date?: string;
  end_date?: string;
  per_page?: number;
  cursor?: number;
}): Promise<{ data: BDLGameStats[]; meta: { next_cursor?: number; per_page: number } }> {
  const params: Record<string, string> = {};
  
  if (options.player_ids) {
    options.player_ids.forEach((id, i) => {
      params[`player_ids[${i}]`] = id.toString();
    });
  }
  if (options.game_ids) {
    options.game_ids.forEach((id, i) => {
      params[`game_ids[${i}]`] = id.toString();
    });
  }
  if (options.seasons) {
    options.seasons.forEach((season, i) => {
      params[`seasons[${i}]`] = season.toString();
    });
  }
  if (options.start_date) params.start_date = options.start_date;
  if (options.end_date) params.end_date = options.end_date;
  if (options.per_page) params.per_page = options.per_page.toString();
  if (options.cursor) params.cursor = options.cursor.toString();

  return fetchAPI("/stats", params);
}

// 获取球员赛季统计（计算平均值）
export async function getPlayerSeasonStats(playerId: number, season: number = 2024): Promise<{
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fg_pct: number;
  ft_pct: number;
  fg3_pct: number;
  tov: number;
  mpg: number;
} | null> {
  try {
    const allStats: BDLGameStats[] = [];
    let cursor: number | undefined;

    // 获取所有比赛数据
    do {
      const response = await getPlayerStats({
        player_ids: [playerId],
        seasons: [season],
        per_page: 100,
        cursor,
      });
      allStats.push(...response.data);
      cursor = response.meta.next_cursor;
    } while (cursor);

    if (allStats.length === 0) return null;

    // 计算平均值
    const gp = allStats.length;
    const totals = allStats.reduce(
      (acc, game) => ({
        pts: acc.pts + game.pts,
        reb: acc.reb + game.reb,
        ast: acc.ast + game.ast,
        stl: acc.stl + game.stl,
        blk: acc.blk + game.blk,
        tov: acc.tov + game.turnover,
        fgm: acc.fgm + game.fgm,
        fga: acc.fga + game.fga,
        ftm: acc.ftm + game.ftm,
        fta: acc.fta + game.fta,
        fg3m: acc.fg3m + game.fg3m,
        fg3a: acc.fg3a + game.fg3a,
        min: acc.min + parseFloat(game.min || "0"),
      }),
      { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fgm: 0, fga: 0, ftm: 0, fta: 0, fg3m: 0, fg3a: 0, min: 0 }
    );

    return {
      gp,
      ppg: Number((totals.pts / gp).toFixed(1)),
      rpg: Number((totals.reb / gp).toFixed(1)),
      apg: Number((totals.ast / gp).toFixed(1)),
      spg: Number((totals.stl / gp).toFixed(1)),
      bpg: Number((totals.blk / gp).toFixed(1)),
      fg_pct: totals.fga > 0 ? Number((totals.fgm / totals.fga).toFixed(3)) : 0,
      ft_pct: totals.fta > 0 ? Number((totals.ftm / totals.fta).toFixed(3)) : 0,
      fg3_pct: totals.fg3a > 0 ? Number((totals.fg3m / totals.fg3a).toFixed(3)) : 0,
      tov: Number((totals.tov / gp).toFixed(1)),
      mpg: Number((totals.min / gp).toFixed(1)),
    };
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return null;
  }
}

// ==================== Injuries ====================

export async function getPlayerInjuries(options?: {
  team_ids?: number[];
  player_ids?: number[];
  per_page?: number;
  cursor?: number;
}): Promise<{ data: BDLInjury[]; meta: { next_cursor?: number; per_page: number } }> {
  const params: Record<string, string> = {};
  
  if (options?.team_ids) {
    options.team_ids.forEach((id, i) => {
      params[`team_ids[${i}]`] = id.toString();
    });
  }
  if (options?.player_ids) {
    options.player_ids.forEach((id, i) => {
      params[`player_ids[${i}]`] = id.toString();
    });
  }
  if (options?.per_page) params.per_page = options.per_page.toString();
  if (options?.cursor) params.cursor = options.cursor.toString();

  return fetchAPI("/player_injuries", params);
}

export async function getAllInjuries(): Promise<BDLInjury[]> {
  const allInjuries: BDLInjury[] = [];
  let cursor: number | undefined;

  do {
    const response = await getPlayerInjuries({ per_page: 100, cursor });
    allInjuries.push(...response.data);
    cursor = response.meta.next_cursor;
  } while (cursor);

  return allInjuries;
}

// ==================== Games ====================

export async function getGames(options?: {
  dates?: string[];
  seasons?: number[];
  team_ids?: number[];
  start_date?: string;
  end_date?: string;
  per_page?: number;
  cursor?: number;
}): Promise<{ data: BDLGame[]; meta: { next_cursor?: number; per_page: number } }> {
  const params: Record<string, string> = {};
  
  if (options?.dates) {
    options.dates.forEach((date, i) => {
      params[`dates[${i}]`] = date;
    });
  }
  if (options?.seasons) {
    options.seasons.forEach((season, i) => {
      params[`seasons[${i}]`] = season.toString();
    });
  }
  if (options?.team_ids) {
    options.team_ids.forEach((id, i) => {
      params[`team_ids[${i}]`] = id.toString();
    });
  }
  if (options?.start_date) params.start_date = options.start_date;
  if (options?.end_date) params.end_date = options.end_date;
  if (options?.per_page) params.per_page = options.per_page.toString();
  if (options?.cursor) params.cursor = options.cursor.toString();

  return fetchAPI("/games", params);
}

export async function getTodayGames(): Promise<BDLGame[]> {
  const today = new Date().toISOString().split("T")[0];
  const response = await getGames({ dates: [today] });
  return response.data;
}

// ==================== Teams ====================

export async function getTeams(): Promise<{ data: BDLTeam[] }> {
  return fetchAPI("/teams");
}

export async function getTeamById(id: number): Promise<BDLTeam> {
  const response = await fetchAPI<{ data: BDLTeam }>(`/teams/${id}`);
  return response.data;
}

// ==================== Utility: Convert to App Player Type ====================

export function convertToAppPlayer(bdlPlayer: BDLPlayer, stats?: {
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fg_pct: number;
  ft_pct: number;
  tov: number;
}, injury?: BDLInjury) {
  // Parse height (e.g., "6-2" -> just keep as string or calculate)
  const [feet, inches] = (bdlPlayer.height || "0-0").split("-").map(Number);
  const age = bdlPlayer.draft_year ? new Date().getFullYear() - bdlPlayer.draft_year + 19 : 25; // Estimate age

  return {
    id: bdlPlayer.id.toString(),
    name: `${bdlPlayer.first_name} ${bdlPlayer.last_name}`,
    team: bdlPlayer.team?.abbreviation || "FA",
    position: bdlPlayer.position || "N/A",
    age: age,
    ppg: stats?.ppg || 0,
    rpg: stats?.rpg || 0,
    apg: stats?.apg || 0,
    spg: stats?.spg || 0,
    bpg: stats?.bpg || 0,
    fg: stats?.fg_pct || 0,
    ft: stats?.ft_pct || 0,
    tov: stats?.tov || 0,
    gp: stats?.gp || 0,
    adp: 0, // Would need separate ADP data
    rank: 0,
    trend: "same" as const,
    injury: injury?.status,
    bdl_id: bdlPlayer.id,
  };
}
