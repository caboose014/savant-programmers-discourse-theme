import { apiInitializer } from "discourse/lib/api";

const AVATAR_SIZE = 76;
const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

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

function latestPoster(topic) {
  return topic?.lastPosterUser ?? topic?.last_poster_user ?? topic?.lastPoster?.user;
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

function addLatestActivity(row, category) {
  const latestCell = row.querySelector("td.latest");
  const topic = featuredTopic(category);
  const user = latestPoster(topic);
  const imageUrl = avatarUrl(user);
  const href = topicUrl(topic);
  const date = topicDate(topic);
  const username = user?.username;

  if (!latestCell || !topic?.title || !username || !imageUrl || !href || !date) {
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
  const topicLink = element("a", "sp-latest-activity__topic", topic.title);
  topicLink.href = href;
  topicLink.title = topic.title;

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
  let framePending = false;

  const decorate = () => {
    framePending = false;
    const categories = Array.from(site.categories ?? []);
    const categoriesById = new Map(
      categories.map((category) => [category.id, category])
    );

    document.querySelectorAll(".category-list [data-category-id]").forEach((row) => {
      const category = categoriesById.get(Number(row.dataset.categoryId));
      if (!category) {
        return;
      }

      const root = rootCategory(category, categoriesById);
      if (root?.slug) {
        row.dataset.spParentCategory = root.slug;
      }

      addLatestActivity(row, category);
    });
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
