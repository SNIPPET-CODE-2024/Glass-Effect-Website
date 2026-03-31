const state = {
  progress: 68,
  selectedDate: new Date(),
  calculatorExpression: "",
  capsuleBoost: false,
  dockTimer: null,
  contacts: [
    {
      name: "Ava Neural",
      role: "Systems Guide",
      status: "Available",
      accentA: "#49c9ff",
      accentB: "#1d3a62",
    },
    {
      name: "Milo Orbit",
      role: "Field Ops",
      status: "On route",
      accentA: "#7de7ff",
      accentB: "#2266cc",
    },
    {
      name: "Nova Pulse",
      role: "Signal Engineer",
      status: "In sync",
      accentA: "#5fe5ff",
      accentB: "#3454d1",
    },
  ],
  contactIndex: 0,
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  updateHeaderClock();
  setInterval(updateHeaderClock, 1000);
  animateProgress();
  renderCalendar();
  renderContact();
  buildClockFace();
  window.addEventListener("resize", buildClockFace);
  startAnalogClock();
  setupCalculator();
  setupPhotoUpload();
  setupContactWidget();
  setupBattery();
  setupNetwork();
  setupCapsule();
  setupDockActions();
  updateFeedback("Action dock ready for quick control.");
});

function cacheElements() {
  const ids = [
    "hourDisplay",
    "minuteDisplay",
    "dayDisplay",
    "dateDisplay",
    "dateSubDisplay",
    "timezoneDisplay",
    "progressFill",
    "progressValue",
    "calcDisplay",
    "calcClearButton",
    "calculatorButtons",
    "photoInput",
    "photoPreview",
    "photoFileName",
    "photoTriggerButton",
    "contactAvatar",
    "contactName",
    "contactRole",
    "contactStatusText",
    "contactStatusDot",
    "contactCycleButton",
    "contactActionButton",
    "calendarStrip",
    "calendarSelection",
    "batteryLevelBar",
    "batteryPercent",
    "batteryState",
    "batteryStatusBadge",
    "topBatteryLevel",
    "topBatteryPercent",
    "networkText",
    "capsuleWidget",
    "capsuleBoostButton",
    "capsuleModeLabel",
    "clockFace",
    "clockMarkers",
    "hourHand",
    "minuteHand",
    "secondHand",
    "timingWidget",
    "photoWidget",
    "contactWidget",
    "robotWidget",
    "batteryWidget",
    "browserLaunchButton",
    "browserActionButton",
    "actionFeedback",
  ];

  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });

  elements.dockButtons = Array.from(document.querySelectorAll(".dock-button"));
}

function updateHeaderClock() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  elements.hourDisplay.textContent = hour;
  elements.minuteDisplay.textContent = minute;
  elements.dayDisplay.textContent = now.toLocaleDateString("en-US", { weekday: "long" });
  elements.dateDisplay.textContent = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Time";
  elements.timezoneDisplay.textContent = timezone.replace(/_/g, " ");
  elements.dateSubDisplay.textContent = `Synced to ${timezone.replace(/_/g, " ")} with live dashboard updates.`;
}

function animateProgress() {
  const progress = Number(elements.progressFill.dataset.progress || state.progress);
  state.progress = progress;
  requestAnimationFrame(() => {
    elements.progressFill.style.height = `${progress}%`;
    elements.progressValue.textContent = `${progress}%`;
  });
}

function setupCalculator() {
  const operatorPattern = /[+\-*/]$/;
  const display = elements.calcDisplay;

  elements.calculatorButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }

    if (button.dataset.action === "evaluate") {
      evaluateCalculator();
      return;
    }

    const value = button.dataset.value;
    if (!value) {
      return;
    }

    if ("+-*/".includes(value) && !state.calculatorExpression) {
      return;
    }

    if ("+-*/".includes(value) && operatorPattern.test(state.calculatorExpression)) {
      state.calculatorExpression = `${state.calculatorExpression.slice(0, -1)}${value}`;
    } else {
      state.calculatorExpression += value;
    }

    display.textContent = state.calculatorExpression || "0";
  });

  elements.calcClearButton.addEventListener("click", clearCalculator);

  document.addEventListener("keydown", (event) => {
    if (event.target && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) {
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      state.calculatorExpression += event.key;
      display.textContent = state.calculatorExpression;
    } else if (["+", "-", "*", "/", "."].includes(event.key)) {
      if ("+-*/".includes(event.key) && operatorPattern.test(state.calculatorExpression)) {
        state.calculatorExpression = `${state.calculatorExpression.slice(0, -1)}${event.key}`;
      } else if (state.calculatorExpression || event.key === ".") {
        state.calculatorExpression += event.key;
      }
      display.textContent = state.calculatorExpression || "0";
    } else if (event.key === "Enter") {
      evaluateCalculator();
    } else if (event.key === "Backspace") {
      state.calculatorExpression = state.calculatorExpression.slice(0, -1);
      display.textContent = state.calculatorExpression || "0";
    } else if (event.key === "Escape") {
      clearCalculator();
    }
  });
}

function evaluateCalculator() {
  if (!state.calculatorExpression) {
    return;
  }

  const expression = state.calculatorExpression.trim();
  if (!/^[\d+\-*/.() ]+$/.test(expression)) {
    elements.calcDisplay.textContent = "Error";
    state.calculatorExpression = "";
    return;
  }

  try {
    const result = Function(`"use strict"; return (${expression})`)();
    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    const normalized = Number(result.toFixed(8)).toString();
    state.calculatorExpression = normalized;
    elements.calcDisplay.textContent = normalized;
    updateFeedback(`Calculated result: ${normalized}`);
  } catch (error) {
    elements.calcDisplay.textContent = "Error";
    state.calculatorExpression = "";
    updateFeedback("Calculator input could not be evaluated.");
  }
}

function clearCalculator() {
  state.calculatorExpression = "";
  elements.calcDisplay.textContent = "0";
}

function setupPhotoUpload() {
  const { photoInput, photoPreview, photoFileName, photoTriggerButton } = elements;

  photoTriggerButton.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", () => {
    const [file] = photoInput.files || [];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      updateFeedback("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      photoPreview.innerHTML = `<img src="${reader.result}" alt="Uploaded preview" />`;
      photoFileName.textContent = file.name;
      updateFeedback(`Loaded ${file.name} into the photo widget.`);
    };
    reader.readAsDataURL(file);
  });
}

function setupContactWidget() {
  elements.contactCycleButton.addEventListener("click", () => {
    state.contactIndex = (state.contactIndex + 1) % state.contacts.length;
    renderContact();
    updateFeedback(`Viewing ${state.contacts[state.contactIndex].name}.`);
  });

  elements.contactActionButton.addEventListener("click", () => {
    const active = state.contacts[state.contactIndex];
    const originalLabel = elements.contactActionButton.textContent;
    elements.contactActionButton.textContent = "Opening Channel";
    elements.contactStatusText.textContent = "Connecting";
    elements.contactStatusDot.className = "h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]";

    window.setTimeout(() => {
      elements.contactActionButton.textContent = originalLabel;
      elements.contactStatusText.textContent = "Connected";
      elements.contactStatusDot.className = "h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]";
      updateFeedback(`Channel opened with ${active.name}.`);
    }, 900);
  });
}

function renderContact() {
  const active = state.contacts[state.contactIndex];
  const initials = active.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  elements.contactAvatar.textContent = initials;
  elements.contactAvatar.style.background = `linear-gradient(145deg, ${active.accentB}, ${active.accentA})`;
  elements.contactName.textContent = active.name;
  elements.contactRole.textContent = active.role;
  elements.contactStatusText.textContent = active.status;
  elements.contactStatusDot.className = "h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]";
}

function renderCalendar() {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const strip = elements.calendarStrip;
  strip.innerHTML = "";

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const isActive = isSameDay(date, state.selectedDate);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `calendar-day ${isActive ? "active" : ""}`;
    button.innerHTML = `
      <p class="text-[0.68rem] uppercase tracking-[0.28em]">${date.toLocaleDateString("en-US", {
        weekday: "short",
      })}</p>
      <p class="mt-3 text-2xl font-semibold tracking-tight">${date.getDate()}</p>
    `;
    button.addEventListener("click", () => {
      state.selectedDate = date;
      renderCalendar();
      updateFeedback(`Calendar moved to ${date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}.`);
    });
    strip.appendChild(button);
  }

  elements.calendarSelection.textContent = `Selected: ${state.selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })}`;
}

function startOfWeek(date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  clone.setDate(clone.getDate() - clone.getDay());
  return clone;
}

function isSameDay(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

async function setupBattery() {
  if (!("getBattery" in navigator)) {
    applyBatteryState(0.9, false);
    return;
  }

  try {
    const battery = await navigator.getBattery();
    const syncBattery = () => applyBatteryState(battery.level, battery.charging);
    syncBattery();
    battery.addEventListener("levelchange", syncBattery);
    battery.addEventListener("chargingchange", syncBattery);
  } catch (error) {
    applyBatteryState(0.9, false);
  }
}

function applyBatteryState(level, charging) {
  const percentage = Math.round(level * 100);
  const safeWidth = Math.max(percentage, 8);

  elements.batteryLevelBar.style.width = `${safeWidth}%`;
  elements.topBatteryLevel.style.width = `${safeWidth}%`;
  elements.batteryPercent.textContent = `${percentage}%`;
  elements.topBatteryPercent.textContent = `${percentage}%`;

  if (charging) {
    elements.batteryStatusBadge.textContent = "Charging";
    elements.batteryState.textContent = "Charge cycle active";
    elements.batteryLevelBar.style.background = "linear-gradient(90deg, #7de7ff, #4ade80)";
  } else if (percentage > 60) {
    elements.batteryStatusBadge.textContent = "Power Reserve";
    elements.batteryState.textContent = "Power reserve stable";
    elements.batteryLevelBar.style.background = "linear-gradient(90deg, #49c9ff, #7de7ff)";
  } else if (percentage > 25) {
    elements.batteryStatusBadge.textContent = "Energy Watch";
    elements.batteryState.textContent = "Energy level moderate";
    elements.batteryLevelBar.style.background = "linear-gradient(90deg, #38bdf8, #facc15)";
  } else {
    elements.batteryStatusBadge.textContent = "Recharge";
    elements.batteryState.textContent = "Recharge advised soon";
    elements.batteryLevelBar.style.background = "linear-gradient(90deg, #f59e0b, #f97316)";
  }
}

function setupNetwork() {
  const syncNetwork = () => {
    const online = navigator.onLine;
    elements.networkText.textContent = online ? "Online" : "Offline";
    elements.networkText.className = online
      ? "text-[0.72rem] font-semibold text-slate-600"
      : "text-[0.72rem] font-semibold text-orange-500";
  };

  syncNetwork();
  window.addEventListener("online", syncNetwork);
  window.addEventListener("offline", syncNetwork);
}

function buildClockFace() {
  const container = elements.clockMarkers;
  const face = elements.clockFace;
  container.innerHTML = "";

  const size = container?.clientWidth || face?.clientWidth || 304;
  const center = size / 2;
  const radius = size * 0.46;

  for (let value = 1; value <= 12; value += 1) {
    const marker = document.createElement("span");
    marker.className = "clock-marker";
    marker.style.setProperty("--i", value.toString());
    container.appendChild(marker);

    const number = document.createElement("span");
    number.className = "clock-number";
    number.textContent = value.toString();
    const angle = ((value * 30) - 90) * (Math.PI / 180);
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    number.style.left = `${x}px`;
    number.style.top = `${y}px`;
    container.appendChild(number);
  }
}

function startAnalogClock() {
  const tick = () => {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    elements.hourHand.style.transform = `rotate(${hours * 30}deg)`;
    elements.minuteHand.style.transform = `rotate(${minutes * 6}deg)`;
    elements.secondHand.style.transform = `rotate(${seconds * 6}deg)`;

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function setupCapsule() {
  elements.capsuleBoostButton.addEventListener("click", () => {
    toggleCapsuleBoost();
  });

  elements.browserLaunchButton.addEventListener("click", () => {
    activateBrowserMode();
  });

  elements.browserActionButton.addEventListener("click", () => {
    activateBrowserMode();
  });
}

function toggleCapsuleBoost(forceState) {
  state.capsuleBoost = typeof forceState === "boolean" ? forceState : !state.capsuleBoost;
  elements.capsuleWidget.classList.toggle("boost-mode", state.capsuleBoost);
  elements.capsuleModeLabel.textContent = state.capsuleBoost ? "Boost" : "Cruise";
  updateFeedback(state.capsuleBoost ? "Capsule boost enabled." : "Capsule boost set to cruise.");
}

function setupDockActions() {
  elements.dockButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const { action } = button.dataset;
      setActiveDockButton(action);

      if (action === "phone") {
        focusCard(elements.contactWidget);
        elements.contactActionButton.click();
      }

      if (action === "camera") {
        focusCard(elements.photoWidget);
        elements.photoInput.click();
        updateFeedback("Camera action ready. Choose a photo for preview.");
      }

      if (action === "browser") {
        activateBrowserMode();
      }
    });
  });
}

function activateBrowserMode() {
  toggleCapsuleBoost(true);
  focusCard(elements.capsuleWidget);
  focusCard(elements.robotWidget, false);
  updateFeedback("Browser mode launched with capsule boost.");
  setActiveDockButton("browser");
}

function focusCard(element, scroll = true) {
  if (!element) {
    return;
  }

  if (scroll) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  element.classList.add("flash");
  window.setTimeout(() => element.classList.remove("flash"), 1200);
}

function setActiveDockButton(action) {
  elements.dockButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.action === action);
  });

  window.clearTimeout(state.dockTimer);
  state.dockTimer = window.setTimeout(() => {
    elements.dockButtons.forEach((button) => button.classList.remove("active"));
  }, 2000);
}

function updateFeedback(message) {
  elements.actionFeedback.textContent = message;
}
