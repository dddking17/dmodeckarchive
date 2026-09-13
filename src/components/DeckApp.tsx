"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  deleteDeck,
  deleteDigimon,
  fetchDecks,
  fetchDigimons,
  removeDigimonFromAllDecks,
  setDigimonOwned,
  uploadDigimonImage,
  upsertDeck,
  upsertDigimon,
} from "@/lib/db";
import type { Deck, Digimon, Tier } from "@/lib/types";
import { avatarColor, initials } from "@/lib/utils";

const TIERS: Tier[] = ["S", "A", "B", "C", "D"];

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
  owned: boolean;
  imageUrl: string | null;
  imageFile: File | null;
};

const emptyDeckForm: DeckFormState = { id: null, name: "", tier: "A", description: "", effect: "", memberIds: [] };
const emptyDigimonForm: DigimonFormState = { id: null, name: "", owned: false, imageUrl: null, imageFile: null };

export default function DeckApp({ userId, userName, userEmail, userAvatarUrl }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [digimons, setDigimons] = useState<Digimon[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tab, setTab] = useState<"decks" | "digimons">("decks");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  const [deckSearch, setDeckSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | Tier>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "incomplete">("all");

  const [digimonSearch, setDigimonSearch] = useState("");
  const [ownFilter, setOwnFilter] = useState<"all" | "owned" | "missing">("all");

  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [deckForm, setDeckForm] = useState<DeckFormState>(emptyDeckForm);
  const [pickerSearch, setPickerSearch] = useState("");
  const [quickAddName, setQuickAddName] = useState("");

  const [digimonModalOpen, setDigimonModalOpen] = useState(false);
  const [digimonForm, setDigimonForm] = useState<DigimonFormState>(emptyDigimonForm);

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
      const [d, k] = await Promise.all([fetchDigimons(supabase, userId), fetchDecks(supabase, userId)]);
      setDigimons(d);
      setDecks(k);
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

  // ---------- realtime: 다른 기기의 변경사항을 즉시 반영 ----------
  useEffect(() => {
    const channel = supabase
      .channel("deck-archive-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "digimons", filter: `user_id=eq.${userId}` }, () => {
        fetchDigimons(supabase, userId).then(setDigimons).catch(() => {});
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "decks", filter: `user_id=eq.${userId}` }, () => {
        fetchDecks(supabase, userId).then(setDecks).catch(() => {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  // ---------- derived ----------
  function deckStatus(deck: Deck) {
    const total = deck.member_ids.length;
    const owned = deck.member_ids.filter((id) => digimons.find((d) => d.id === id)?.owned).length;
    const percent = total > 0 ? Math.round((owned / total) * 100) : 0;
    return { owned, total, ready: total > 0 && owned === total, percent };
  }

  function usageCount(digimonId: string) {
    return decks.filter((d) => d.member_ids.includes(digimonId)).length;
  }

  function digimonById(id: string) {
    return digimons.find((d) => d.id === id) || null;
  }

  const readyCount = decks.filter((d) => deckStatus(d).ready).length;
  const ownedCount = digimons.filter((d) => d.owned).length;

  const filteredDecks = decks.filter((deck) => {
    if (tierFilter !== "all" && deck.tier !== tierFilter) return false;
    const st = deckStatus(deck);
    if (statusFilter === "ready" && !st.ready) return false;
    if (statusFilter === "incomplete" && st.ready) return false;
    if (deckSearch) {
      const hay = (deck.name + " " + deck.description + " " + deck.effect).toLowerCase();
      if (!hay.includes(deckSearch.trim().toLowerCase())) return false;
    }
    return true;
  });

  const filteredDigimons = digimons.filter((d) => {
    if (ownFilter === "owned" && !d.owned) return false;
    if (ownFilter === "missing" && d.owned) return false;
    if (digimonSearch && !d.name.toLowerCase().includes(digimonSearch.trim().toLowerCase())) return false;
    return true;
  });

  const pickerList = digimons.filter(
    (d) => !pickerSearch || d.name.toLowerCase().includes(pickerSearch.trim().toLowerCase())
  );

  // ---------- deck handlers ----------
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
      const saved = await upsertDeck(supabase, userId, {
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
    if (!window.confirm(`"${name}" 덱을 삭제할까요?`)) return;
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
      const created = await upsertDigimon(supabase, userId, { name, owned: false });
      setDigimons((prev) => [...prev, created]);
      setDeckForm((prev) => ({ ...prev, memberIds: [...prev.memberIds, created.id] }));
      setQuickAddName("");
    } catch (err) {
      console.error(err);
      setErrorMsg("디지몬 추가에 실패했습니다.");
    }
  }

  // ---------- digimon handlers ----------
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

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
        ? { id: digimon.id, name: digimon.name, owned: digimon.owned, imageUrl: digimon.image_url, imageFile: null }
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
        imageUrl = await uploadDigimonImage(supabase, userId, digimonForm.imageFile);
      }
      const saved = await upsertDigimon(supabase, userId, {
        id: digimonForm.id ?? undefined,
        name,
        owned: digimonForm.owned,
        image_url: imageUrl,
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
      ? `"${name}"은(는) ${uses}개 덱에서 사용 중입니다. 삭제하면 해당 덱에서도 제거됩니다. 계속할까요?`
      : `"${name}"을(를) 삭제할까요?`;
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

  async function handleToggleOwned(digimon: Digimon) {
    const next = !digimon.owned;
    setDigimons((prev) => prev.map((d) => (d.id === digimon.id ? { ...d, owned: next } : d)));
    try {
      await setDigimonOwned(supabase, digimon.id, next);
    } catch (err) {
      console.error(err);
      setDigimons((prev) => prev.map((d) => (d.id === digimon.id ? { ...d, owned: !next } : d)));
      setErrorMsg("보유 상태 변경에 실패했습니다.");
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
              placeholder="덱 이름, 설명, 효과로 검색"
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
            <button className="btn primary" onClick={() => openDeckModal(null)}>+ 새 덱</button>
          </div>

          <div className="deck-grid">
            {filteredDecks.length === 0 ? (
              <div className="empty-state">
                <p>{decks.length === 0 ? "아직 등록된 덱이 없습니다." : "조건에 맞는 덱이 없습니다."}</p>
                <button className="btn primary" onClick={() => openDeckModal(null)}>+ 새 덱 만들기</button>
              </div>
            ) : (
              filteredDecks.map((deck) => {
                const st = deckStatus(deck);
                return (
                  <article key={deck.id} className={`deck-card tier-${deck.tier}${st.ready ? " is-ready" : ""}`}>
                    <div className="deck-card-head">
                      <div className="deck-name-row">
                        <span className={`tier-badge tier-${deck.tier}`}>{deck.tier}</span>
                        <span className="deck-name">{deck.name}</span>
                        <span className="info-wrap">
                          <button type="button" className="info-trigger" aria-label="덱 설명과 효과 보기">i</button>
                          <div className="info-popover" role="tooltip">
                            <div className="info-section">
                              <h4>설명</h4>
                              {deck.description ? deck.description : <span className="info-empty">등록된 설명이 없습니다</span>}
                            </div>
                            <div className="info-section">
                              <h4>효과</h4>
                              {deck.effect ? deck.effect : <span className="info-empty">등록된 효과가 없습니다</span>}
                            </div>
                          </div>
                        </span>
                      </div>
                      <div className="card-actions">
                        <button className="icon-btn" title="수정" aria-label="덱 수정" onClick={() => openDeckModal(deck)}>✎</button>
                        <button className="icon-btn danger" title="삭제" aria-label="덱 삭제" onClick={() => handleDeleteDeck(deck.id, deck.name)}>🗑</button>
                      </div>
                    </div>
                    <div className="member-row">
                      {deck.member_ids.length === 0 ? (
                        <span className="picker-empty">등록된 디지몬 없음</span>
                      ) : (
                        deck.member_ids.map((id) => {
                          const d = digimonById(id);
                          if (!d) return null;
                          return (
                            <span
                              key={id}
                              className={`avatar${d.owned ? "" : " is-missing"}`}
                              style={d.owned && !d.image_url ? { background: avatarColor(d.name) } : undefined}
                              title={`${d.name}${d.owned ? " (보유)" : " (미보유)"}`}
                            >
                              {d.image_url ? <img src={d.image_url} alt={d.name} /> : initials(d.name)}
                            </span>
                          );
                        })
                      )}
                    </div>
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
            <button className="btn primary" onClick={() => openDigimonModal(null)}>+ 새 디지몬</button>
          </div>

          <div className="digimon-grid">
            {filteredDigimons.length === 0 ? (
              <div className="empty-state">
                <p>{digimons.length === 0 ? "아직 등록된 디지몬이 없습니다." : "조건에 맞는 디지몬이 없습니다."}</p>
                <button className="btn primary" onClick={() => openDigimonModal(null)}>+ 새 디지몬 추가</button>
              </div>
            ) : (
              filteredDigimons.map((d) => (
                <div key={d.id} className="digimon-card">
                  <span
                    className={`avatar${d.owned ? "" : " is-missing"}`}
                    style={d.owned && !d.image_url ? { background: avatarColor(d.name) } : undefined}
                  >
                    {d.image_url ? <img src={d.image_url} alt={d.name} /> : initials(d.name)}
                  </span>
                  <div className="digimon-info">
                    <div className="dname">{d.name}</div>
                    <div className="duse">{usageCount(d.id)}개 덱에 사용됨</div>
                  </div>
                  <div className="digimon-card-actions">
                    <label className="switch" title="보유 여부 전환">
                      <input type="checkbox" checked={d.owned} onChange={() => handleToggleOwned(d)} aria-label={`${d.name} 보유 여부`} />
                      <span className="switch-track" />
                    </label>
                    <button className="icon-btn" title="수정" aria-label="디지몬 수정" onClick={() => openDigimonModal(d)}>✎</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <p className="footer">로그인한 구글 계정 기준으로 자동 저장되며, 어떤 기기에서 열어도 같은 데이터를 볼 수 있습니다.</p>

      {deckModalOpen && (
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
                        <span className="avatar mini-avatar" style={d.image_url ? undefined : { background: avatarColor(d.name) }}>
                          {d.image_url ? <img src={d.image_url} alt="" /> : initials(d.name)}
                        </span>
                        {d.name}{!d.owned && " ⋅ 미보유"}
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

      {digimonModalOpen && (
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
              <label htmlFor="digimonOwned" style={{ margin: 0 }}>보유 중</label>
              <label className="switch">
                <input
                  id="digimonOwned"
                  type="checkbox"
                  checked={digimonForm.owned}
                  onChange={(e) => setDigimonForm((p) => ({ ...p, owned: e.target.checked }))}
                />
                <span className="switch-track" />
              </label>
            </div>
            <div className="modal-actions">
              {digimonForm.id && (
                <button
                  className="btn danger-outline"
                  onClick={() => { const id = digimonForm.id!; const name = digimonForm.name; setDigimonModalOpen(false); handleDeleteDigimon(id, name); }}
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
