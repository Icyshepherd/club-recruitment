const INTEREST_STORAGE_KEY = "clubRecruitment.interestSelections";

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
});

const chatToggle = document.querySelector(".chat-island-toggle");
const chatIsland = document.querySelector(".chat-island");

if (chatToggle && chatIsland) {
  chatToggle.addEventListener("click", () => {
    const isOpen = chatIsland.classList.toggle("is-open");
    chatToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const selectionTags = document.querySelector("#selection-tags");
const selectionFilters = document.querySelectorAll(".selection-filter");
const weeklyHoursSlider = document.querySelector("#weekly-hours");
const weeklyHoursValue = document.querySelector("#weekly-hours-value");

if (selectionTags) {
  const renderSelectionTags = () => {
    const selected = Array.from(selectionFilters)
      .filter((input) => input.checked)
      .map((input) => {
        const group = input.dataset.group;
        return group ? `${group}\uFF1A${input.value}` : input.value;
      });

    if (weeklyHoursSlider) {
      selected.push(`\u6BCF\u5468\u6295\u5165\u65F6\u95F4\uFF08h\uFF09\uFF1A${weeklyHoursSlider.value}`);
    }

    if (weeklyHoursValue && weeklyHoursSlider) {
      weeklyHoursValue.textContent = weeklyHoursSlider.value;
    }

    if (selected.length === 0) {
      selectionTags.innerHTML = '<span class="filter-tag" data-empty="true">\u672A\u9009\u62E9\u7B5B\u9009\u6761\u4EF6</span>';
      return;
    }

    selectionTags.innerHTML = selected
      .map((value) => `<span class="filter-tag">${value}</span>`)
      .join("");
  };

  selectionFilters.forEach((input) => {
    input.addEventListener("change", renderSelectionTags);
  });

  if (weeklyHoursSlider) {
    weeklyHoursSlider.addEventListener("input", renderSelectionTags);
    weeklyHoursSlider.addEventListener("change", renderSelectionTags);
  }

  renderSelectionTags();
}

const followButton = document.querySelector("[data-follow-toggle]");

if (followButton) {
  followButton.addEventListener("click", () => {
    const followed = followButton.dataset.followed === "true";
    if (!followed) {
      followButton.dataset.followed = "true";
      followButton.textContent = "\u5DF2\u5173\u6CE8\u2714";
      followButton.classList.add("is-followed");
    }
  });
}

const loadInterestSelections = () => {
  try {
    const raw = localStorage.getItem(INTEREST_STORAGE_KEY);
    if (!raw) {
      return { hobbies: [], expectations: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      hobbies: Array.isArray(parsed.hobbies) ? parsed.hobbies : [],
      expectations: Array.isArray(parsed.expectations) ? parsed.expectations : [],
    };
  } catch (error) {
    return { hobbies: [], expectations: [] };
  }
};

const saveInterestSelections = (state) => {
  localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify(state));
};

const interestOptions = document.querySelectorAll("[data-interest-option]");
const interestStartButton = document.querySelector("[data-interest-start]");
const interestSelectedContainers = document.querySelectorAll("[data-interest-selected]");

if (interestOptions.length > 0) {
  const state = loadInterestSelections();

  const renderInterestPage = () => {
    interestOptions.forEach((button) => {
      const group = button.dataset.group;
      const value = button.dataset.value;
      const selected = state[group]?.includes(value);
      button.classList.toggle("is-active", Boolean(selected));
      button.setAttribute("aria-pressed", String(Boolean(selected)));
    });

    interestSelectedContainers.forEach((container) => {
      const group = container.dataset.interestSelected;
      const values = state[group] || [];
      container.innerHTML = values
        .map(
          (value) =>
            `<button class="interest-selected-tag" type="button" data-remove-interest="${group}" data-value="${value}">${value}<span>\u00D7</span></button>`,
        )
        .join("");
    });

    const allSelected = [...state.hobbies, ...state.expectations];
    const canStart = allSelected.length > 0;

    if (interestStartButton) {
      interestStartButton.classList.toggle("is-disabled", !canStart);
      interestStartButton.setAttribute("aria-disabled", String(!canStart));
      interestStartButton.tabIndex = canStart ? 0 : -1;
    }

    saveInterestSelections(state);
  };

  interestOptions.forEach((button) => {
    const group = button.dataset.group;
    const value = button.dataset.value;

    button.addEventListener("click", () => {
      const values = state[group] || [];
      state[group] = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      renderInterestPage();
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-remove-interest]");
    if (!target) {
      return;
    }
    const group = target.dataset.removeInterest;
    const value = target.dataset.value;
    state[group] = (state[group] || []).filter((item) => item !== value);
    renderInterestPage();
  });

  if (interestStartButton) {
    interestStartButton.addEventListener("click", (event) => {
      const hasSelection = [...state.hobbies, ...state.expectations].length > 0;
      if (!hasSelection) {
        event.preventDefault();
      }
    });
  }

  renderInterestPage();
}

const personalInterestContainer = document.querySelector("[data-personal-interest-tags]");

if (personalInterestContainer) {
  const storedSelections = loadInterestSelections();
  const mergedTags = [...new Set([...storedSelections.hobbies, ...storedSelections.expectations])];

  if (mergedTags.length > 0) {
    personalInterestContainer.innerHTML = mergedTags
      .map((tag) => `<span class="chip">${tag}</span>`)
      .join("");
  }
}

const homeInterestTags = document.querySelector("[data-home-interest-tags]");

if (homeInterestTags) {
  const storedSelections = loadInterestSelections();
  const mergedTags = [...new Set([...storedSelections.hobbies, ...storedSelections.expectations])];
  const previewTags = mergedTags.slice(0, 2);

  if (previewTags.length > 0) {
    homeInterestTags.textContent = previewTags.map((tag) => `【${tag}】`).join(" ");
  }
}

const discoverCards = document.querySelectorAll("[data-discover-card]");

if (discoverCards.length > 0) {
  const isMobile = window.matchMedia("(max-width: 600px)").matches;

  const applyOverlayTone = (image, overlay) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      overlay.classList.add("overlay-light");
      return;
    }

    const sampleWidth = 24;
    const sampleHeight = 24;
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
    let totalLuminance = 0;

    for (let index = 0; index < data.length; index += 4) {
      totalLuminance += 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    }

    const averageLuminance = totalLuminance / (data.length / 4);
    overlay.classList.add(averageLuminance > 160 ? "overlay-dark" : "overlay-light");
  };

  discoverCards.forEach((card) => {
    const image = card.querySelector("[data-discover-image]");
    const overlay = card.querySelector("[data-discover-overlay]");

    if (image && overlay) {
      if (image.complete) {
        applyOverlayTone(image, overlay);
      } else {
        image.addEventListener("load", () => applyOverlayTone(image, overlay), { once: true });
      }
    }

    if (isMobile) {
      card.addEventListener("click", () => {
        const isOpen = card.classList.contains("is-open");
        discoverCards.forEach((item) => item.classList.remove("is-open"));
        if (!isOpen) {
          card.classList.add("is-open");
        }
      });
    }
  });

  if (isMobile) {
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-discover-card]")) {
        return;
      }
      discoverCards.forEach((card) => card.classList.remove("is-open"));
    });
  }
}
