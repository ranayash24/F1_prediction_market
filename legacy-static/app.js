const STARTING_BALANCE = 10000;
const STORAGE_KEY = "redlineMarketsState";

const seededMarkets = [
  {
    id: "bahrain-quali",
    round: "Round 1 · Bahrain GP",
    name: "Max Verstappen wins qualifying",
    description: "Can the reigning champion take pole under the desert lights?",
    category: "Quali Winner",
  },
  {
    id: "bahrain-race",
    round: "Round 1 · Bahrain GP",
    name: "Ferrari wins the race",
    description: "A return to the top step for the Scuderia?",
    category: "Race Winner",
  },
  {
    id: "bahrain-safety",
    round: "Round 1 · Bahrain GP",
    name: "Safety car deployed",
    description: "Will a yellow flag change everything?",
    category: "Safety Car",
  },
  {
    id: "jeddah-quali",
    round: "Round 2 · Saudi Arabia GP",
    name: "Lando Norris qualifies top 3",
    description: "A strong lap around the Jeddah Corniche circuit?",
    category: "Quali Winner",
  },
  {
    id: "jeddah-race",
    round: "Round 2 · Saudi Arabia GP",
    name: "Red Bull wins the race",
    description: "Will Red Bull convert race pace into a win?",
    category: "Race Winner",
  },
  {
    id: "jeddah-safety",
    round: "Round 2 · Saudi Arabia GP",
    name: "Safety car deployed",
    description: "High speed walls often bring drama.",
    category: "Safety Car",
  },
  {
    id: "melbourne-quali",
    round: "Round 3 · Australian GP",
    name: "George Russell on pole",
    description: "Mercedes hunting a surprise in Melbourne.",
    category: "Quali Winner",
  },
  {
    id: "melbourne-race",
    round: "Round 3 · Australian GP",
    name: "McLaren wins the race",
    description: "Papaya powered victory in Albert Park?",
    category: "Race Winner",
  },
  {
    id: "melbourne-safety",
    round: "Round 3 · Australian GP",
    name: "Safety car deployed",
    description: "Street racing means margins are thin.",
    category: "Safety Car",
  },
];

const leaderboardBots = [
  { name: "MonacoJet", balance: 16420 },
  { name: "PitWallPro", balance: 14980 },
  { name: "ApexHunter", balance: 13210 },
  { name: "TelemetryTony", balance: 12190 },
];

const elements = {
  authForm: document.getElementById("authForm"),
  displayName: document.getElementById("displayName"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  authStatus: document.getElementById("authStatus"),
  signInBtn: document.getElementById("signInBtn"),
  signOutBtn: document.getElementById("signOutBtn"),
  walletBalance: document.getElementById("walletBalance"),
  balanceValue: document.getElementById("balanceValue"),
  positionCount: document.getElementById("positionCount"),
  walletHint: document.getElementById("walletHint"),
  marketsGrid: document.getElementById("marketsGrid"),
  positionsList: document.getElementById("positionsList"),
  leaderboardList: document.getElementById("leaderboardList"),
  marketTemplate: document.getElementById("marketCardTemplate"),
};

const state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("Failed to parse state", error);
    }
  }

  return {
    users: {},
    currentUser: null,
    markets: seededMarkets.map((market) => ({
      ...market,
      yesShares: 60,
      noShares: 60,
      volume: 0,
    })),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function getCurrentUser() {
  if (!state.currentUser) return null;
  return state.users[state.currentUser] || null;
}

function updateAuthUI() {
  const user = getCurrentUser();
  if (user) {
    elements.authStatus.textContent = `Signed in as ${user.name}.`;
    elements.signOutBtn.hidden = false;
    elements.signInBtn.hidden = true;
    elements.walletHint.textContent = "Place trades to move your balance.";
  } else {
    elements.authStatus.textContent = "Not signed in.";
    elements.signOutBtn.hidden = true;
    elements.signInBtn.hidden = false;
    elements.walletHint.textContent = "Sign in to start trading.";
  }
  updateWalletUI();
}

function updateWalletUI() {
  const user = getCurrentUser();
  const balance = user ? user.balance : 0;
  const positions = user ? Object.values(user.positions || {}) : [];
  const positionCount = positions.reduce((sum, position) => sum + position.yes + position.no, 0);

  elements.walletBalance.textContent = formatCurrency(balance);
  elements.balanceValue.textContent = formatCurrency(balance);
  elements.positionCount.textContent = positionCount;
}

function getMarketPrice(market) {
  const total = market.yesShares + market.noShares;
  if (total === 0) return { yes: 0.5, no: 0.5 };
  const yes = market.yesShares / total;
  return { yes, no: 1 - yes };
}

function renderMarkets() {
  elements.marketsGrid.innerHTML = "";

  state.markets.forEach((market) => {
    const card = elements.marketTemplate.content.cloneNode(true);
    const root = card.querySelector(".market");
    const yesPrice = root.querySelector(".market__yes");
    const noPrice = root.querySelector(".market__no");
    const liquidity = root.querySelector(".market__liquidity");
    const pill = root.querySelector(".pill");
    const barYes = root.querySelector(".bar--yes");
    const barNo = root.querySelector(".bar--no");
    const barYesValue = barYes.querySelector(".bar__value");
    const barNoValue = barNo.querySelector(".bar__value");

    root.querySelector(".market__round").textContent = market.round;
    root.querySelector(".market__name").textContent = market.name;
    root.querySelector(".market__desc").textContent = market.description;

    const prices = getMarketPrice(market);
    const yesPercent = Math.round(prices.yes * 100);
    const noPercent = 100 - yesPercent;
    yesPrice.textContent = formatCurrency(Math.round(prices.yes * 100));
    noPrice.textContent = formatCurrency(Math.round(prices.no * 100));
    barYes.style.width = `${yesPercent}%`;
    barNo.style.width = `${noPercent}%`;
    barYesValue.textContent = `${yesPercent}%`;
    barNoValue.textContent = `${noPercent}%`;
    pill.textContent = market.category;
    liquidity.textContent = `Liquidity ${market.yesShares + market.noShares} shares`;

    const sharesInput = root.querySelector(".market__shares");
    root.querySelectorAll("button[data-side]").forEach((button) => {
      button.addEventListener("click", () => {
        handleBuy(market.id, button.dataset.side, Number(sharesInput.value));
      });
    });

    elements.marketsGrid.appendChild(card);
  });
}

function renderPositions() {
  const user = getCurrentUser();
  elements.positionsList.innerHTML = "";

  if (!user || !user.positions || Object.keys(user.positions).length === 0) {
    elements.positionsList.innerHTML = "<p class=\"muted\">No open positions yet.</p>";
    return;
  }

  Object.entries(user.positions).forEach(([marketId, position]) => {
    const market = state.markets.find((item) => item.id === marketId);
    if (!market) return;

    if (position.yes > 0) {
      elements.positionsList.appendChild(renderPositionRow(market, "YES", position.yes));
    }
    if (position.no > 0) {
      elements.positionsList.appendChild(renderPositionRow(market, "NO", position.no));
    }
  });
}

function renderPositionRow(market, side, shares) {
  const row = document.createElement("div");
  row.className = "position";

  const name = document.createElement("span");
  name.textContent = `${market.round} · ${market.name}`;

  const detail = document.createElement("span");
  detail.textContent = `${side} x${shares}`;

  row.appendChild(name);
  row.appendChild(detail);
  return row;
}

function renderLeaderboard() {
  const users = Object.values(state.users);
  const entries = [...users, ...leaderboardBots].map((user) => ({
    name: user.name,
    balance: user.balance,
  }));

  entries.sort((a, b) => b.balance - a.balance);

  elements.leaderboardList.innerHTML = "";
  entries.slice(0, 7).forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard__row";
    const name = document.createElement("span");
    name.textContent = `${index + 1}. ${entry.name}`;
    const balance = document.createElement("span");
    balance.textContent = formatCurrency(entry.balance);
    row.appendChild(name);
    row.appendChild(balance);
    elements.leaderboardList.appendChild(row);
  });
}

function ensureUserPositions(user) {
  if (!user.positions) {
    user.positions = {};
  }
}

function handleBuy(marketId, side, shares) {
  const user = getCurrentUser();
  if (!user) {
    elements.authStatus.textContent = "Sign in before placing trades.";
    return;
  }

  if (!Number.isFinite(shares) || shares <= 0) {
    return;
  }

  const market = state.markets.find((item) => item.id === marketId);
  if (!market) return;

  const prices = getMarketPrice(market);
  const price = side === "yes" ? prices.yes : prices.no;
  const cost = Math.round(price * 100) * shares;

  if (user.balance < cost) {
    elements.walletHint.textContent = "Not enough balance for this trade.";
    return;
  }

  user.balance -= cost;
  market.volume += cost;

  if (side === "yes") {
    market.yesShares += shares;
  } else {
    market.noShares += shares;
  }

  ensureUserPositions(user);
  if (!user.positions[marketId]) {
    user.positions[marketId] = { yes: 0, no: 0 };
  }
  user.positions[marketId][side] += shares;

  saveState();
  renderMarkets();
  renderPositions();
  updateWalletUI();
  renderLeaderboard();
}

function handleSignUp(event) {
  event.preventDefault();
  const name = elements.displayName.value.trim();
  const email = elements.email.value.trim().toLowerCase();
  const password = elements.password.value;

  if (!name || !email || !password) return;

  if (state.users[email]) {
    elements.authStatus.textContent = "Account exists. Use sign in.";
    return;
  }

  state.users[email] = {
    name,
    email,
    password,
    balance: STARTING_BALANCE,
    positions: {},
  };
  state.currentUser = email;
  saveState();
  updateAuthUI();
  renderLeaderboard();
}

function handleSignIn() {
  const email = elements.email.value.trim().toLowerCase();
  const password = elements.password.value;

  const user = state.users[email];
  if (!user || user.password !== password) {
    elements.authStatus.textContent = "Invalid credentials.";
    return;
  }

  state.currentUser = email;
  saveState();
  updateAuthUI();
  renderPositions();
  renderLeaderboard();
}

function handleSignOut() {
  state.currentUser = null;
  saveState();
  updateAuthUI();
  renderPositions();
}

function init() {
  elements.authForm.addEventListener("submit", handleSignUp);
  elements.signInBtn.addEventListener("click", handleSignIn);
  elements.signOutBtn.addEventListener("click", handleSignOut);

  renderMarkets();
  renderPositions();
  renderLeaderboard();
  updateAuthUI();
}

init();
