"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  deleteDeck,
  deleteDigimon,
  fetchDecks,
  fetchDigimons,
  fetchFavoriteDeckIds,
  fetchOwnership,
  removeDigimonFromAllDecks,
  setDeckFavorite,
  setDigimonOwned,
  uploadDigimonImage,
  upsertDeck,
  upsertDigimon,
} from "@/lib/db";
import type { Deck, Digimon, Tier } from "@/lib/types";
import { avatarColor, initials, splitAwakenName } from "@/lib/utils";

/** "듀크몬 크림존모드*(각성)" → 일반 텍스트 + 빨간색 "(각성)" 태그로 렌더링 */
function DigimonName({ name, className }: { name: string; className?: string }) {
  const { base, tag } = splitAwakenName(name);
  return (
    <span className={className}>
      {base}
      {tag && <span className="awaken-tag">{tag}</span>}
    </span>
  );
}

const TIERS: Tier[] = ["S", "A", "B", "C", "D"];
const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

type Props = {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
};

type DeckFormState = {
  id: string | null;
  name: string;
  tier: Tier;
  description: string;
  effect: string;
  memberIds: string[];
};

type DigimonFormState = {
  id: string | null;
  name: string;
  imageUrl: string | null;
  imageFile: File | null;
  isUGrade: boolean;
};

const emptyDeckForm: DeckFormState = { id: null, name: "", tier: "A", description: "", effect: "", memberIds: [] };
const emptyDigimonForm: DigimonFormState = { id: null, name: "", imageUrl: null, imageFile: null, isUGrade: false };

export default function DeckApp({ userId, userName, userEmail, userAvatarUrl }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const isAdmin = !!ADMIN_USER_ID && userId === ADMIN_USER_ID;

  const [digimons, setDigimons] = useState<Digimon[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [ownership, setOwnership] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tab, setTab] = useState<"decks" | "digimons">("decks");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  const [deckSearch, setDeckSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | Tier>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "incomplete">("all");
  const [deckSort, setDeckSort] = useState<"default" | "name" | "tier" | "ownedCount" | "ownedUCount">("default");

  const [digimonSearch, setDigimonSearch] = useState("");
  const [ownFilter, setOwnFilter] = useState<"all" | "owned" | "missing">("all");

  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [deckForm, setDeckForm] = useState<DeckFormState>(emptyDeckForm);
  const [pickerSearch, setPickerSearch] = useState("");
  const [quickAddName, setQuickAddName] = useState("");

  const [digimonModalOpen, setDigimonModalOpen] = useState(false);
  const [digimonForm, setDigimonForm] = useState<DigimonFormState>(emptyDigimonForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // ---------- theme ----------
  useEffect(() => {
    const saved = window.localStorage.getItem("deckArchiveTheme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark"
      || (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("deckArchiveTheme", next);
  }

  // ---------- initial fetch ----------
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [d, k, o, f] = await Promise.all([
        fetchDigimons(supabase),
        fetchDecks(supabase),
        fetchOwnership(supabase, userId),
        fetchFavoriteDeckIds(supabase, userId),
      ]);
      setDigimons(d);
      setDecks(k);
      setOwnership(o);
      setFavorites(new Set(f));
      setErrorMsg(null);
    } catch (err) {
      console.error(err);
      setErrorMsg("데이터를 불러오지 못했습니다. 새로고침해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---------- realtime: 카탈로그 변경 + 내 보유 여부 변경을 즉시 반영 ----------
  useEffect(() => {
    const channel = supabase
      .channel("deck-archive-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "digimons" }, () => {
        fetchDigimons(supabase).then(setDigimons).catch(() => {});
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "decks" }, () => {
        fetchDecks(supabase).then(setDecks).catch(() => {});
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_digimon_ownership", filter: `user_id=eq.${userId}` },
        () => {
          fetchOwnership(supabase, userId).then(setOwnership).catch(() => {});
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_deck_favorites", filter: `user_id=eq.${userId}` },
        () => {
          fetchFavoriteDeckIds(supabase, userId).then((f) => setFavorites(new Set(f))).catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  // ---------- derived ----------
  function isOwned(digimonId: string) {
    return !!ownership[digimonId];
  }

  function deckStatus(deck: Deck) {
    const total = deck.member_ids.length;
    const owned = deck.member_ids.filter((id) => isOwned(id)).length;
    const percent = total > 0 ? Math.round((owned / total) * 100) : 0;
    return { owned, total, ready: total > 0 && owned === total, percent };
  }

  function usageCount(digimonId: string) {
    return decks.filter((d) => d.member_ids.includes(digimonId)).length;
  }

  function uGradeCount(deck: Deck) {
    return deck.member_ids.filter((id) => digimonById(id)?.is_u_grade).length;
  }

  function uOwnedCount(deck: Deck) {
    return deck.member_ids.filter((id) => digimonById(id)?.is_u_grade && isOwned(id)).length;
  }

  /** "종결, 궁극의 성전!" → "종결, 궁극의 성전!(1U)". 이미 이름 끝에 "(NU)"가
   * 수동으로 붙어있는 경우(예: "디지털 월드 수호자(5U)")는 중복 표시하지 않습니다. */
  function deckDisplayName(deck: Deck) {
    if (/\(\d+U\)$/.test(deck.name.trim())) return deck.name;
    return `${deck.name}(${uGradeCount(deck)}U)`;
  }

  function digimonById(id: string) {
    return digimons.find((d) => d.id === id) || null;
  }

  const TIER_RANK: Record<Tier, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

  function isFavorite(deckId: string) {
    return favorites.has(deckId);
  }

  function compareDecks(a: Deck, b: Deck) {
    switch (deckSort) {
      case "tier":
        return TIER_RANK[a.tier] - TIER_RANK[b.tier];
      case "ownedCount":
        return deckStatus(b).owned - deckStatus(a).owned;
      case "ownedUCount":
        return uOwnedCount(b) - uOwnedCount(a);
      case "name":
        return a.name.localeCompare(b.name, "ko");
      case "default":
      default:
        return a.order_index - b.order_index;
    }
  }

  const readyCount = decks.filter((d) => deckStatus(d).ready).length;
  const ownedCount = digimons.filter((d) => isOwned(d.id)).length;

  const filteredDecksBase = decks.filter((deck) => {
    if (tierFilter !== "all" && deck.tier !== tierFilter) return false;
    const st = deckStatus(deck);
    if (statusFilter === "ready" && !st.ready) return false;
    if (statusFilter === "incomplete" && st.ready) return false;
    if (deckSearch) {
      const memberNames = deck.member_ids.map((id) => digimonById(id)?.name ?? "").join(" ");
      const hay = (deck.name + " " + deck.description + " " + deck.effect + " " + memberNames).toLowerCase();
      if (!hay.includes(deckSearch.trim().toLowerCase())) return false;
    }
    return true;
  });

  // 즐겨찾기한 덱은 정렬 기준과 무관하게 항상 최상단, 그 안에서는 메모장 순서(원본 순서)로 정렬.
  // 즐겨찾기하지 않은 나머지는 선택한 정렬 기준을 따릅니다.
  const filteredDecks = [
    ...filteredDecksBase.filter((d) => isFavorite(d.id)).sort((a, b) => a.order_index - b.order_index),
    ...filteredDecksBase.filter((d) => !isFavorite(d.id)).sort(compareDecks),
  ];

  async function handleToggleFavorite(deckId: string) {
    const next = !isFavorite(deckId);
    setFavorites((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(deckId); else copy.delete(deckId);
      return copy;
    });
    try {
      await setDeckFavorite(supabase, userId, deckId, next);
    } catch (err) {
      console.error(err);
      setFavorites((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(deckId); else copy.add(deckId);
        return copy;
      });
      setErrorMsg("즐겨찾기 변경에 실패했습니다.");
    }
  }

  const filteredDigimons = digimons.filter((d) => {
    if (ownFilter === "owned" && !isOwned(d.id)) return false;
    if (ownFilter === "missing" && isOwned(d.id)) return false;
    if (digimonSearch && !d.name.toLowerCase().includes(digimonSearch.trim().toLowerCase())) return false;
    return true;
  });

  const pickerList = digimons.filter(
    (d) => !pickerSearch || d.name.toLowerCase().includes(pickerSearch.trim().toLowerCase())
  );

  // ---------- 보유 토글 (모든 사용자 가능) ----------
  async function handleToggleOwned(digimon: Digimon) {
    const next = !isOwned(digimon.id);
    setOwnership((prev) => ({ ...prev, [digimon.id]: next }));
    try {
      await setDigimonOwned(supabase, userId, digimon.id, next);
    } catch (err) {
      console.error(err);
      setOwnership((prev) => ({ ...prev, [digimon.id]: !next }));
      setErrorMsg("보유 상태 변경에 실패했습니다.");
    }
  }

  // ---------- 덱 카탈로그 관리 (관리자 전용) ----------
  function openDeckModal(deck: Deck | null) {
    setDeckForm(
      deck
        ? {
            id: deck.id,
            name: deck.name,
            tier: deck.tier,
            description: deck.description,
            effect: deck.effect,
            memberIds: [...deck.member_ids],
          }
        : emptyDeckForm
    );
    setPickerSearch("");
    setQuickAddName("");
    setDeckModalOpen(true);
  }

  async function saveDeck() {
    const name = deckForm.name.trim();
    if (!name) return;
    try {
      const saved = await upsertDeck(supabase, {
        id: deckForm.id ?? undefined,
        name,
        tier: deckForm.tier,
        description: deckForm.description.trim(),
        effect: deckForm.effect.trim(),
        member_ids: deckForm.memberIds,
      });
      setDecks((prev) => {
        const exists = prev.some((d) => d.id === saved.id);
        return exists ? prev.map((d) => (d.id === saved.id ? saved : d)) : [...prev, saved];
      });
      setDeckModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("덱 저장에 실패했습니다.");
    }
  }

  async function handleDeleteDeck(id: string, name: string) {
    if (!window.confirm(`"${name}" 덱을 삭제할까요? (카탈로그에서 삭제되어 모든 사용자에게 사라집니다)`)) return;
    try {
      await deleteDeck(supabase, id);
      setDecks((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      setErrorMsg("덱 삭제에 실패했습니다.");
    }
  }

  function toggleMember(id: string) {
    setDeckForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  }

  async function quickAddDigimon() {
    const name = quickAddName.trim();
    if (!name) return;
    try {
      const created = await upsertDigimon(supabase, { name });
      setDigimons((prev) => [...prev, created]);
      setDeckForm((prev) => ({ ...prev, memberIds: [...prev.memberIds, created.id] }));
      setQuickAddName("");
    } catch (err) {
      console.error(err);
      setErrorMsg("디지몬 추가에 실패했습니다.");
    }
  }

  // ---------- 디지몬 카탈로그 관리 (관리자 전용) ----------
  useEffect(() => {
    if (!digimonForm.imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(digimonForm.imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [digimonForm.imageFile]);

  function openDigimonModal(digimon: Digimon | null) {
    setDigimonForm(
      digimon
        ? { id: digimon.id, name: digimon.name, imageUrl: digimon.image_url, imageFile: null, isUGrade: digimon.is_u_grade }
        : emptyDigimonForm
    );
    setDigimonModalOpen(true);
  }

  async function saveDigimon() {
    const name = digimonForm.name.trim();
    if (!name) return;
    setUploadingImage(true);
    try {
      let imageUrl = digimonForm.imageUrl;
      if (digimonForm.imageFile) {
        imageUrl = await uploadDigimonImage(supabase, digimonForm.imageFile);
      }
      const saved = await upsertDigimon(supabase, {
        id: digimonForm.id ?? undefined,
        name,
        image_url: imageUrl,
        is_u_grade: digimonForm.isUGrade,
      });
      setDigimons((prev) => {
        const exists = prev.some((d) => d.id === saved.id);
        return exists ? prev.map((d) => (d.id === saved.id ? saved : d)) : [...prev, saved];
      });
      setDigimonModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("디지몬 저장에 실패했습니다. 이미지 용량이 너무 크지 않은지 확인해 주세요.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteDigimon(id: string, name: string) {
    const uses = usageCount(id);
    const msg = uses > 0
      ? `"${name}"은(는) ${uses}개 덱에서 사용 중입니다. 삭제하면 해당 덱에서도 제거되고 카탈로그에서 완전히 사라집니다. 계속할까요?`
      : `"${name}"을(를) 카탈로그에서 삭제할까요?`;
    if (!window.confirm(msg)) return;
    try {
      await removeDigimonFromAllDecks(supabase, decks, id);
      await deleteDigimon(supabase, id);
      setDigimons((prev) => prev.filter((d) => d.id !== id));
      setDecks((prev) => prev.map((d) => ({ ...d, member_ids: d.member_ids.filter((m) => m !== id) })));
    } catch (err) {
      console.error(err);
      setErrorMsg("디지몬 삭제에 실패했습니다.");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  if (loading) {
    return <div className="loading-shell">불러오는 중…</div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">👾</span>
          <div className="brand-text">
            <h1>디지몬 덱 아카이브</h1>
            <p className="tagline">보유 디지몬으로 지금 편성 가능한 덱을 한눈에 확인하세요</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="stats">
            <span className="stat-pill">
              <span className="dot" />덱 <b>{decks.length}</b>개 · 편성 가능 <b>{readyCount}</b>개
            </span>
            <span className="stat-pill">
              디지몬 <b>{ownedCount}</b> / <b>{digimons.length}</b> 보유
            </span>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="테마 전환" title="라이트/다크 전환">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div className="user-chip">
            {userAvatarUrl ? <img src={userAvatarUrl} alt="" /> : null}
            <span title={userEmail}>{userName || userEmail}</span>
          </div>
          <button className="btn" onClick={handleSignOut}>로그아웃</button>
        </div>
      </header>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      <nav className="tabs" role="tablist">
        <button className={`tab-btn${tab === "decks" ? " active" : ""}`} onClick={() => setTab("decks")}>덱 목록</button>
        <button className={`tab-btn${tab === "digimons" ? " active" : ""}`} onClick={() => setTab("digimons")}>디지몬 보관함</button>
      </nav>

      {tab === "decks" ? (
        <section>
          <div className="toolbar">
            <input
              type="search"
              placeholder="덱 이름, 디지몬 이름, 설명, 효과로 검색"
              value={deckSearch}
              onChange={(e) => setDeckSearch(e.target.value)}
              aria-label="덱 검색"
            />
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as any)} aria-label="티어 필터">
              <option value="all">전체 티어</option>
              {TIERS.map((t) => <option key={t} value={t}>{t} 티어</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} aria-label="상태 필터">
              <option value="all">전체 상태</option>
              <option value="ready">편성 가능</option>
              <option value="incomplete">미완성</option>
            </select>
            <select value={deckSort} onChange={(e) => setDeckSort(e.target.value as any)} aria-label="정렬 기준">
              <option value="default">기본 순서</option>
              <option value="name">이름순</option>
              <option value="tier">티어순</option>
              <option value="ownedCount">보유 디지몬 수</option>
              <option value="ownedUCount">보유 U디지몬 수</option>
            </select>
            {isAdmin && <button className="btn primary" onClick={() => openDeckModal(null)}>+ 새 덱</button>}
          </div>

          <div className="deck-grid">
            {filteredDecks.length === 0 ? (
              <div className="empty-state">
                <p>{decks.length === 0 ? "아직 등록된 덱이 없습니다." : "조건에 맞는 덱이 없습니다."}</p>
                {isAdmin && <button className="btn primary" onClick={() => openDeckModal(null)}>+ 새 덱 만들기</button>}
              </div>
            ) : (
              filteredDecks.map((deck) => {
                const st = deckStatus(deck);
                return (
                  <article key={deck.id} className={`deck-card tier-${deck.tier}${st.ready ? " is-ready" : ""}`}>
                    <div className="deck-card-head">
                      <div className="deck-name-row">
                        <button
                          type="button"
                          className={`star-btn${isFavorite(deck.id) ? " is-fav" : ""}`}
                          aria-label={isFavorite(deck.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          aria-pressed={isFavorite(deck.id)}
                          onClick={() => handleToggleFavorite(deck.id)}
                        >
                          {isFavorite(deck.id) ? "★" : "☆"}
                        </button>
                        <span className={`tier-badge tier-${deck.tier}`}>{deck.tier}</span>
                        <span className="deck-name">{deckDisplayName(deck)}</span>
                        <span className="info-wrap">
                          <button type="button" className="info-trigger" aria-label="덱 설명 보기">ⓘ</button>
                          <div className="info-popover" role="tooltip">
                            <div className="info-section">
                              <h4>설명</h4>
                              {deck.description ? deck.description : <span className="info-empty">등록된 설명이 없습니다</span>}
                            </div>
                          </div>
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="card-actions">
                          <button className="icon-btn" title="수정" aria-label="덱 수정" onClick={() => openDeckModal(deck)}>✎</button>
                          <button className="icon-btn danger" title="삭제" aria-label="덱 삭제" onClick={() => handleDeleteDeck(deck.id, deck.name)}>🗑</button>
                        </div>
                      )}
                    </div>
                    <div className="member-list">
                      {deck.member_ids.length === 0 ? (
                        <span className="picker-empty">등록된 디지몬 없음</span>
                      ) : (
                        deck.member_ids.map((id) => {
                          const d = digimonById(id);
                          if (!d) return null;
                          const owned = isOwned(id);
                          return (
                            <span key={id} className={`member-item${owned ? "" : " is-missing"}`} title={owned ? "보유" : "미보유"}>
                              <span className={`avatar-slot${d.is_u_grade ? " is-u-grade" : ""}`}>
                                <span
                                  className={`avatar${owned ? "" : " is-missing"}`}
                                  style={owned && !d.image_url ? { background: avatarColor(d.name) } : undefined}
                                >
                                  {d.image_url ? <img src={d.image_url} alt={d.name} /> : initials(d.name)}
                                </span>
                              </span>
                              <DigimonName name={d.name} />
                            </span>
                          );
                        })
                      )}
                    </div>
                    {deck.effect && (
                      <div className="effect-block">
                        <h5>효과</h5>
                        {deck.effect.split("\n").map((line, i) => (
                          <div key={i} className="effect-line">{line}</div>
                        ))}
                      </div>
                    )}
                    <div className="deck-card-foot">
                      <span className="progress-frac">{st.owned}/{st.total} <span className="pct">· {st.percent}%</span></span>
                      <span className={`status-pill ${st.ready ? "ready" : "incomplete"}`}>
                        {st.ready ? "편성 가능" : st.total === 0 ? "디지몬 미지정" : `${st.total - st.owned}개 부족`}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      ) : (
        <section>
          <div className="toolbar">
            <input
              type="search"
              placeholder="디지몬 이름으로 검색"
              value={digimonSearch}
              onChange={(e) => setDigimonSearch(e.target.value)}
              aria-label="디지몬 검색"
            />
            <select value={ownFilter} onChange={(e) => setOwnFilter(e.target.value as any)} aria-label="보유 필터">
              <option value="all">전체</option>
              <option value="owned">보유</option>
              <option value="missing">미보유</option>
            </select>
            {isAdmin && <button className="btn primary" onClick={() => openDigimonModal(null)}>+ 새 디지몬</button>}
          </div>

          <div className="digimon-grid">
            {filteredDigimons.length === 0 ? (
              <div className="empty-state">
                <p>{digimons.length === 0 ? "아직 등록된 디지몬이 없습니다." : "조건에 맞는 디지몬이 없습니다."}</p>
                {isAdmin && <button className="btn primary" onClick={() => openDigimonModal(null)}>+ 새 디지몬 추가</button>}
              </div>
            ) : (
              filteredDigimons.map((d) => {
                const owned = isOwned(d.id);
                return (
                  <div key={d.id} className="digimon-card">
                    <div className="digimon-card-top">
                      <label className="switch" title="보유 여부 전환">
                        <input type="checkbox" checked={owned} onChange={() => handleToggleOwned(d)} aria-label={`${d.name} 보유 여부`} />
                        <span className="switch-track" />
                      </label>
                      {isAdmin && (
                        <button className="icon-btn" title="수정" aria-label="디지몬 수정" onClick={() => openDigimonModal(d)}>✎</button>
                      )}
                    </div>
                    <div className="digimon-card-body">
                      <span className={`avatar-slot${d.is_u_grade ? " is-u-grade" : ""}`}>
                        <span
                          className={`avatar${owned ? "" : " is-missing"}`}
                          style={owned && !d.image_url ? { background: avatarColor(d.name) } : undefined}
                        >
                          {d.image_url ? <img src={d.image_url} alt={d.name} /> : initials(d.name)}
                        </span>
                      </span>
                      <div className="digimon-info">
                        <DigimonName name={d.name} className="dname" />
                        <div className="duse">{usageCount(d.id)}개 덱에 사용됨{d.is_u_grade ? " · U등급" : ""}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      <p className="footer">덱/디지몬 목록은 모두에게 공통이며, 보유 여부만 로그인한 계정별로 저장됩니다.</p>

      {isAdmin && deckModalOpen && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setDeckModalOpen(false); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <h2>{deckForm.id ? "덱 수정" : "새 덱"}</h2>
            <div className="field">
              <label htmlFor="deckName">덱 이름</label>
              <input
                id="deckName"
                type="text"
                placeholder="예: 황금 성기사 덱"
                value={deckForm.name}
                onChange={(e) => setDeckForm((p) => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="deckTier">덱 티어</label>
              <select id="deckTier" value={deckForm.tier} onChange={(e) => setDeckForm((p) => ({ ...p, tier: e.target.value as Tier }))}>
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="deckDescription">덱 설명</label>
              <textarea
                id="deckDescription"
                placeholder="예: 성속성 공격형 덱으로, 보스전에서 안정적인 딜을 넣을 수 있습니다"
                value={deckForm.description}
                onChange={(e) => setDeckForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="deckEffect">덱 효과</label>
              <textarea
                id="deckEffect"
                placeholder="예: 성속성 데미지 15% 증가, 파티 전체 방어력 10% 증가"
                value={deckForm.effect}
                onChange={(e) => setDeckForm((p) => ({ ...p, effect: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>필요 디지몬 <span className="selected-count">({deckForm.memberIds.length}개 선택됨)</span></label>
              <input
                type="search"
                className="picker-search"
                placeholder="보관함에서 검색"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
              />
              <div className="member-picker">
                {pickerList.length === 0 ? (
                  <span className="picker-empty">보관함에 디지몬이 없습니다. 아래에서 새로 추가하세요.</span>
                ) : (
                  pickerList.map((d) => {
                    const selected = deckForm.memberIds.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        className={`member-chip${selected ? " selected" : ""}`}
                        aria-pressed={selected}
                        onClick={() => toggleMember(d.id)}
                      >
                        <span className={`avatar-slot${d.is_u_grade ? " is-u-grade" : ""}`}>
                          <span className="avatar mini-avatar" style={d.image_url ? undefined : { background: avatarColor(d.name) }}>
                            {d.image_url ? <img src={d.image_url} alt="" /> : initials(d.name)}
                          </span>
                        </span>
                        <DigimonName name={d.name} />
                      </button>
                    );
                  })
                )}
              </div>
              <div className="quick-add">
                <input
                  type="text"
                  placeholder="목록에 없나요? 이름을 입력해 바로 추가"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddDigimon(); } }}
                />
                <button className="btn" type="button" onClick={quickAddDigimon}>추가</button>
              </div>
            </div>
            <div className="modal-actions">
              {deckForm.id && (
                <button
                  className="btn danger-outline"
                  onClick={() => { const id = deckForm.id!; const name = deckForm.name; setDeckModalOpen(false); handleDeleteDeck(id, name); }}
                >
                  삭제
                </button>
              )}
              <div className="right">
                <button className="btn" onClick={() => setDeckModalOpen(false)}>취소</button>
                <button className="btn primary" onClick={saveDeck}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && digimonModalOpen && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setDigimonModalOpen(false); }}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 400 }}>
            <h2>{digimonForm.id ? "디지몬 수정" : "새 디지몬"}</h2>
            <div className="field">
              <label htmlFor="digimonName">디지몬 이름</label>
              <input
                id="digimonName"
                type="text"
                placeholder="예: 워그레이몬"
                value={digimonForm.name}
                onChange={(e) => setDigimonForm((p) => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="field">
              <label>이미지</label>
              <div className="image-upload-row">
                <span
                  className="image-preview"
                  style={
                    !imagePreviewUrl && !digimonForm.imageUrl
                      ? { background: avatarColor(digimonForm.name || "?") }
                      : undefined
                  }
                >
                  {imagePreviewUrl || digimonForm.imageUrl ? (
                    <img src={imagePreviewUrl ?? digimonForm.imageUrl ?? undefined} alt="" />
                  ) : (
                    initials(digimonForm.name || "?")
                  )}
                </span>
                <div className="image-upload-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDigimonForm((p) => ({ ...p, imageFile: e.target.files?.[0] ?? null }))}
                  />
                  <span className="image-upload-hint">등록하지 않으면 이름 첫 글자로 표시돼요</span>
                </div>
              </div>
            </div>
            <div className="field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label htmlFor="digimonUGrade" style={{ margin: 0 }}>U등급 디지몬</label>
              <label className="switch">
                <input
                  id="digimonUGrade"
                  type="checkbox"
                  checked={digimonForm.isUGrade}
                  onChange={(e) => setDigimonForm((p) => ({ ...p, isUGrade: e.target.checked }))}
                />
                <span className="switch-track" />
              </label>
            </div>
            <div className="modal-actions">
              {digimonForm.id && (
                <button
                  className="btn danger-outline"
                  onClick={() => { const id = digimonForm.id!; const name = digimonForm.name; setDigimonModalOpen(false); handleDeleteDigimon(id, name); }}
                  disabled={uploadingImage}
                >
                  삭제
                </button>
              )}
              <div className="right">
                <button className="btn" onClick={() => setDigimonModalOpen(false)} disabled={uploadingImage}>취소</button>
                <button className="btn primary" onClick={saveDigimon} disabled={uploadingImage}>
                  {uploadingImage ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
