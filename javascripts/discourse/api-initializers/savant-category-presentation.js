import { apiInitializer } from "discourse/lib/api";
import { iconNode } from "discourse-common/lib/icon-library";

const AVATAR_SIZE = 76;
const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const compactNumber = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const UTILITY_LINKS = [
  ["Topics", "/latest", "layer-group"],
  ["Categories", "/categories", "list"],
  ["New", "/new", "plus"],
  ["Search", "/search", "magnifying-glass"],
  ["Tags", "/tags", "tag"],
  ["About", "/about", "circle-info"],
  ["Guidelines", "/guidelines", "book"],
  ["Groups", "/g", "users"],
  ["Badges", "/badges", "certificate"],
  ["Filter", "/filter", "filter"],
];

function rootCategory(category, categoriesById) {
  let current = category;
  const visited = new Set();

  while (current?.parent_category_id && !visited.has(current.id)) {
    visited.add(current.id);
    current = categoriesById.get(current.parent_category_id) ?? current;
  }

  return current;
}

function avatarUrl(user) {
  const template = user?.avatar_template ?? user?.avatarTemplate;
  return template?.replace("{size}", String(AVATAR_SIZE));
}

function featuredTopic(category) {
  const topics = category?.featuredTopics ?? category?.featured_topics ?? [];
  return topics.reduce((latest, topic) => {
    if (!latest) {
      return topic;
    }
    return (topicDate(topic)?.valueOf() ?? 0) > (topicDate(latest)?.valueOf() ?? 0)
      ? topic
      : latest;
  }, null);
}

function collectionValues(collection) {
  if (Array.isArray(collection)) {
    return collection;
  }
  if (Array.isArray(collection?.content)) {
    return collection.content;
  }
  if (typeof collection?.values === "function") {
    return Array.from(collection.values());
  }
  return [];
}

function latestPoster(topic, site, store) {
  const lastPoster = topic?.lastPoster;
  const camelLastPosterUser =
    lastPoster?.username || lastPoster?.avatar_template || lastPoster?.avatarTemplate
      ? lastPoster
      : lastPoster?.user;
  const direct =
    topic?.lastPosterUser ??
    topic?.last_poster_user ??
    camelLastPosterUser ??
    topic?.last_poster?.user ??
    topic?.last_poster;
  const username =
    direct?.username ??
    topic?.lastPosterUsername ??
    topic?.last_poster_username ??
    topic?.last_poster?.username;
  const poster =
    collectionValues(topic?.posters).find((candidate) =>
      candidate?.extras?.includes?.("latest")
    ) ?? lastPoster;
  const posterUser = poster?.user;
  const userId = direct?.id ?? posterUser?.id ?? poster?.userId ?? poster?.user_id;
  const storedUser = userId ? store?.getById?.("user", userId) : null;
  const siteUser = collectionValues(site?.users).find(
    (candidate) =>
      (userId && Number(candidate?.id) === Number(userId)) ||
      (username && candidate?.username === username)
  );

  return {
    username:
      username ??
      posterUser?.username ??
      poster?.username ??
      storedUser?.username ??
      siteUser?.username,
    avatar_template:
      direct?.avatar_template ??
      direct?.avatarTemplate ??
      posterUser?.avatar_template ??
      posterUser?.avatarTemplate ??
      storedUser?.avatar_template ??
      storedUser?.avatarTemplate ??
      siteUser?.avatar_template ??
      siteUser?.avatarTemplate ??
      poster?.avatar_template ??
      poster?.avatarTemplate ??
      topic?.last_poster_avatar_template ??
      topic?.lastPosterAvatarTemplate,
  };
}

function categoryCount(category, snakeCase, camelCase) {
  const value = Number(category?.[snakeCase] ?? category?.[camelCase]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function addCategoryStats(row, category) {
  const cell = row.querySelector("td.topics");
  if (!cell) {
    return;
  }

  const topics = categoryCount(category, "topic_count", "topicCount");
  const posts = categoryCount(category, "post_count", "postCount");
  if (topics === null && posts === null) {
    return;
  }

  const signature = `${topics ?? ""}:${posts ?? ""}`;
  let wrapper = cell.querySelector(".sp-category-stats");
  if (wrapper?.dataset.signature === signature) {
    return;
  }

  wrapper?.remove();
  wrapper = element("div", "sp-category-stats");
  wrapper.dataset.signature = signature;

  for (const [label, value] of [
    ["Topics", topics],
    ["Posts", posts],
  ]) {
    if (value === null) {
      continue;
    }
    const item = element("span", "sp-category-stat");
    const number = element(
      "span",
      "sp-category-stat__value",
      compactNumber.format(value)
    );
    number.title = value.toLocaleString();
    const caption = element("span", "sp-category-stat__label", label);
    item.append(number, caption);
    wrapper.append(item);
  }

  cell.textContent = "";
  cell.append(wrapper);
  cell.classList.add("sp-has-category-stats");
}

function updateUtilityCurrent(panel) {
  const path = window.location.pathname;
  panel.querySelectorAll(".sp-utility-menu__link").forEach((link) => {
    const href = link.getAttribute("href");
    const exact = href === "/categories" || href === "/latest" || href === "/new";
    const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function ensureUtilityMenu() {
  if (!settings.show_utility_menu) {
    document.querySelector(".sp-utility-menu")?.remove();
    return;
  }

  const headerIcons = document.querySelector(".d-header-icons");
  if (!headerIcons) {
    return;
  }

  let root = headerIcons.querySelector(".sp-utility-menu");
  if (!root) {
    root = element("li", "header-dropdown-toggle sp-utility-menu");
    const trigger = element("button", "btn no-text btn-icon btn-flat sp-utility-menu__trigger");
    trigger.type = "button";
    trigger.title = "Navigation menu";
    trigger.setAttribute("aria-label", "Navigation menu");
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    trigger.append(element("span", "sp-utility-menu__glyph"));

    const panel = element("nav", "sp-utility-menu__panel");
    panel.hidden = true;
    panel.setAttribute("aria-label", "Forum navigation");
    panel.append(element("div", "sp-utility-menu__heading", "Explore"));

    const grid = element("div", "sp-utility-menu__grid");
    for (const [label, href, icon] of UTILITY_LINKS) {
      const link = element("a", "sp-utility-menu__link", label);
      link.href = href;
      link.textContent = "";
      link.append(utilityIcon(icon), element("span", "sp-utility-menu__label", label));
      grid.append(link);
    }
    panel.append(grid);

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      panel.hidden = !panel.hidden;
      trigger.setAttribute("aria-expanded", String(!panel.hidden));
    });
    panel.addEventListener("click", (event) => event.stopPropagation());
    root.append(trigger, panel);
    headerIcons.insertBefore(root, headerIcons.querySelector("#current-user"));
  }

  const panel = root.querySelector(".sp-utility-menu__panel");
  updateUtilityCurrent(panel);

  if (!document.documentElement.dataset.spUtilityListeners) {
    document.documentElement.dataset.spUtilityListeners = "true";
    document.addEventListener("click", () => {
      const trigger = document.querySelector(".sp-utility-menu__trigger");
      const openPanel = document.querySelector(".sp-utility-menu__panel:not([hidden])");
      if (openPanel && trigger) {
        openPanel.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      const trigger = document.querySelector(".sp-utility-menu__trigger");
      const openPanel = document.querySelector(".sp-utility-menu__panel:not([hidden])");
      if (openPanel && trigger) {
        openPanel.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
    });
  }
}

function topicDate(topic) {
  const value =
    topic?.lastPostedAt ?? topic?.last_posted_at ?? topic?.bumpedAt ?? topic?.bumped_at;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? date : null;
}

function relativeAge(date) {
  const seconds = Math.round((date.valueOf() - Date.now()) / 1000);
  const ranges = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = seconds;

  for (const [limit, unit] of ranges) {
    if (Math.abs(value) < limit) {
      return relativeTime.format(Math.round(value), unit);
    }
    value /= limit;
  }
}

function topicUrl(topic) {
  const slug = topic?.slug ?? "topic";
  const id = Number(topic?.id);
  const postNumber = Number(
    topic?.highestPostNumber ?? topic?.highest_post_number ?? topic?.postsCount ?? 1
  );

  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  return `/t/${encodeURIComponent(slug)}/${id}/${Math.max(1, postNumber || 1)}`;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) {
    node.textContent = text;
  }
  return node;
}

function utilityIcon(name) {
  try {
    return iconNode(name) ?? element("span", "sp-utility-menu__icon-fallback");
  } catch {
    return element("span", "sp-utility-menu__icon-fallback");
  }
}

function addLatestActivity(row, category, site, store) {
  const latestCell = row.querySelector("td.latest");
  const topic = featuredTopic(category);
  const user = latestPoster(topic, site, store);
  const imageUrl = avatarUrl(user);
  const href = topicUrl(topic);
  const date = topicDate(topic);
  const username = user?.username;

  const title = topic?.title ?? topic?.fancyTitle ?? topic?.fancy_title;

  if (!latestCell || !title || !username || !imageUrl || !href || !date) {
    latestCell?.classList.remove("sp-has-latest-activity");
    latestCell?.querySelector(".sp-latest-activity")?.remove();
    return;
  }

  const signature = `${topic.id}:${username}:${date.toISOString()}`;
  const existing = latestCell.querySelector(".sp-latest-activity");
  if (existing?.dataset.signature === signature) {
    return;
  }
  existing?.remove();

  const wrapper = element("div", "sp-latest-activity");
  wrapper.dataset.signature = signature;

  const avatarLink = element("a", "sp-latest-activity__avatar-link");
  avatarLink.href = `/u/${encodeURIComponent(username)}`;
  avatarLink.title = username;

  const image = element("img", "sp-latest-activity__avatar");
  image.src = imageUrl;
  image.alt = "";
  image.width = 38;
  image.height = 38;
  image.loading = "lazy";
  avatarLink.append(image);

  const body = element("div", "sp-latest-activity__body");
  const topicLink = element("a", "sp-latest-activity__topic", title);
  topicLink.href = href;
  topicLink.title = title;

  const meta = element("div", "sp-latest-activity__meta");
  const userLink = element("a", "sp-latest-activity__user", username);
  userLink.href = `/u/${encodeURIComponent(username)}`;
  const time = element("time", "sp-latest-activity__time", relativeAge(date));
  time.dateTime = date.toISOString();
  time.title = date.toLocaleString();

  meta.append(userLink, time);
  body.append(topicLink, meta);
  wrapper.append(avatarLink, body);
  latestCell.prepend(wrapper);
  latestCell.classList.add("sp-has-latest-activity");
}

export default apiInitializer((api) => {
  const site = api.container.lookup("service:site");
  const store = api.container.lookup("service:store");
  let framePending = false;

  const decorate = () => {
    framePending = false;
    const categories = Array.from(site.categories ?? []);
    const categoriesById = new Map(
      categories.map((category) => [category.id, category])
    );

    document.querySelectorAll("table.category-list").forEach((table) => {
      const parentId = Number(
        table.querySelector("thead [data-category-id]")?.dataset.categoryId
      );
      const parent = categoriesById.get(parentId);
      const root = rootCategory(parent, categoriesById);

      if (root?.slug) {
        table.dataset.spParentCategory = root.slug;
      }
    });

    document.querySelectorAll(".category-list [data-category-id]").forEach((row) => {
      const category = categoriesById.get(Number(row.dataset.categoryId));
      if (!category) {
        return;
      }

      const root = rootCategory(category, categoriesById);
      if (root?.slug) {
        row.dataset.spParentCategory = root.slug;
      }

      addLatestActivity(row, category, site, store);
      addCategoryStats(row, category);
    });

    ensureUtilityMenu();
  };

  const scheduleDecorate = () => {
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(decorate);
    }
  };

  api.onPageChange(scheduleDecorate);
  scheduleDecorate();

  new MutationObserver(scheduleDecorate).observe(document.body, {
    childList: true,
    subtree: true,
  });
});
