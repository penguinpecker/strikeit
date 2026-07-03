// Real-time price feed for the chart + settlement reference.
//
//   primary:  Pyth Hermes SSE stream — the SAME oracle Drift settles against, so the number you
//             watch is the number your position fills at (no display-vs-fill divergence).
//   fallback: Binance trade stream (wss) → Coinbase ticker (wss) → REST polling.
//
// A staleness watchdog forces failover if the active source silently stops ticking (a half-open
// socket or a stalled SSE), so the chart never freezes on a live-looking-but-dead price.
// Client-side only.

export type FeedSource = "pyth" | "binance" | "coinbase" | "rest" | "none";
export interface PriceTick {
  price: number;
  ts: number; // local receive time (ms)
  source: FeedSource;
}
export type FeedStatus = "connecting" | "live" | "reconnecting" | "down";

interface FeedOpts {
  primary: "pyth" | "binance";
  pythFeedId: string; // 0x… hex
  binanceSymbol: string; // e.g. "btcusdt"
  coinbaseProduct: string; // e.g. "BTC-USD"
  onTick: (t: PriceTick) => void;
  onStatus?: (s: FeedStatus, source: FeedSource) => void;
}

const STALE_MS = 6000; // no tick for this long on a "live" source → treat as dead, fail over
const HERMES = "https://hermes.pyth.network";

export class PriceFeed {
  private ws: WebSocket | null = null;
  private es: EventSource | null = null;
  private restTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private source: FeedSource = "none";
  private attempts = 0;
  private stopped = false;
  private last = 0;
  private lastTickAt = 0;

  constructor(private opts: FeedOpts) {}

  start() {
    this.stopped = false;
    this.lastTickAt = Date.now();
    this.startWatchdog();
    if (this.opts.primary === "pyth") this.connectPyth();
    else this.connectBinance();
  }

  stop() {
    this.stopped = true;
    this.cleanup();
    if (this.watchdog) {
      clearInterval(this.watchdog);
      this.watchdog = null;
    }
  }

  get latest() {
    return this.last;
  }
  get currentSource() {
    return this.source;
  }

  private status(s: FeedStatus) {
    this.opts.onStatus?.(s, this.source);
  }

  private emit(price: number, source: FeedSource) {
    if (!Number.isFinite(price) || price <= 0) return;
    this.last = price;
    this.lastTickAt = Date.now();
    this.opts.onTick({ price, ts: this.lastTickAt, source });
  }

  // If the active source goes quiet while claiming "live", tear it down and fail over. This is
  // the guard the original feed lacked (a stalled socket froze the price under a "live" label).
  private startWatchdog() {
    this.watchdog = setInterval(() => {
      if (this.stopped || this.source === "none") return;
      if (Date.now() - this.lastTickAt > STALE_MS) {
        this.status("reconnecting");
        this.cleanup();
        this.failover();
      }
    }, 2000);
  }

  private cleanup() {
    if (this.ws) {
      try {
        this.ws.onopen = this.ws.onmessage = this.ws.onerror = this.ws.onclose = null;
        this.ws.close();
      } catch {
        /* noop */
      }
      this.ws = null;
    }
    if (this.es) {
      try {
        this.es.onmessage = this.es.onerror = null;
        this.es.close();
      } catch {
        /* noop */
      }
      this.es = null;
    }
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ── Pyth Hermes (primary) — SSE stream of parsed price updates ──
  private connectPyth() {
    if (this.stopped) return;
    this.source = "pyth";
    this.status(this.attempts === 0 ? "connecting" : "reconnecting");
    const id = this.opts.pythFeedId;
    const url = `${HERMES}/v2/updates/price/stream?ids%5B%5D=${encodeURIComponent(id)}&parsed=true&encoding=hex`;
    let es: EventSource;
    try {
      es = new EventSource(url);
    } catch {
      return this.connectBinance();
    }
    this.es = es;
    es.onopen = () => {
      this.attempts = 0;
      this.status("live");
    };
    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data as string) as {
          parsed?: { price: { price: string; expo: number } }[];
        };
        const p = d.parsed?.[0]?.price;
        if (p) this.emit(Number(p.price) * 10 ** p.expo, "pyth");
      } catch {
        /* ignore malformed frame */
      }
    };
    es.onerror = () => {
      // EventSource auto-reconnects, but if Hermes is hard-down we escalate to Binance after a beat.
      if (this.stopped) return;
      if (this.attempts < 2) {
        this.attempts++;
        this.status("reconnecting");
      } else {
        this.attempts = 0;
        this.cleanup();
        this.connectBinance();
      }
    };
  }

  // ── Binance (fallback / alt-primary) ──
  private connectBinance() {
    if (this.stopped) return;
    this.source = "binance";
    this.status(this.attempts === 0 ? "connecting" : "reconnecting");
    const url = `wss://stream.binance.com:9443/ws/${this.opts.binanceSymbol}@trade`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return this.connectCoinbase();
    }
    this.ws = ws;
    ws.onopen = () => {
      this.attempts = 0;
      this.status("live");
    };
    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data as string);
        if (d.p) this.emit(parseFloat(d.p), "binance");
      } catch {
        /* ignore malformed frame */
      }
    };
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      if (this.stopped) return;
      if (this.attempts < 2) {
        this.attempts++;
        this.scheduleReconnect(() => this.connectBinance());
      } else {
        this.attempts = 0;
        this.connectCoinbase();
      }
    };
  }

  // ── Coinbase (fallback) ──
  private connectCoinbase() {
    if (this.stopped) return;
    this.source = "coinbase";
    this.status("reconnecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket("wss://ws-feed.exchange.coinbase.com");
    } catch {
      return this.startRest();
    }
    this.ws = ws;
    ws.onopen = () => {
      this.status("live");
      ws.send(
        JSON.stringify({
          type: "subscribe",
          product_ids: [this.opts.coinbaseProduct],
          channels: ["ticker"],
        }),
      );
    };
    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data as string);
        if (d.type === "ticker" && d.price) this.emit(parseFloat(d.price), "coinbase");
      } catch {
        /* ignore */
      }
    };
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      if (this.stopped) return;
      if (this.attempts < 2) {
        this.attempts++;
        this.scheduleReconnect(() => this.connectCoinbase());
      } else {
        this.attempts = 0;
        this.startRest();
      }
    };
  }

  // ── REST polling (last resort) — Coinbase spot (works where Binance REST is geo-blocked) ──
  private startRest() {
    if (this.stopped) return;
    this.source = "rest";
    this.status("reconnecting");
    const poll = async () => {
      try {
        const r = await fetch(
          `https://api.exchange.coinbase.com/products/${this.opts.coinbaseProduct}/ticker`,
        );
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        if (d.price) {
          this.emit(parseFloat(d.price), "rest");
          this.status("live");
        } else {
          this.status("down");
        }
      } catch {
        this.status("down");
      }
    };
    poll();
    this.restTimer = setInterval(poll, 1000);
    // periodically try to climb back to the primary
    this.reconnectTimer = setTimeout(() => {
      this.cleanup();
      this.attempts = 0;
      if (this.opts.primary === "pyth") this.connectPyth();
      else this.connectBinance();
    }, 20_000);
  }

  private failover() {
    if (this.stopped) return;
    if (this.source === "pyth") this.connectBinance();
    else if (this.source === "binance") this.connectCoinbase();
    else if (this.source === "coinbase") this.startRest();
    else {
      // rest already the floor — bounce back to the top and retry
      this.attempts = 0;
      if (this.opts.primary === "pyth") this.connectPyth();
      else this.connectBinance();
    }
  }

  private scheduleReconnect(fn: () => void) {
    const delay = Math.min(8000, 500 * 2 ** this.attempts);
    this.reconnectTimer = setTimeout(fn, delay);
  }
}
