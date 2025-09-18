async function log(action, level_id = null, user_id = null, user_name = null) {
  if (!user_name) {
    let local_user_name = localStorage.getItem("user_name");
    let local_last_user_name = localStorage.getItem("last_user_name");

    user_name = local_user_name || local_last_user_name;
  }

  if (!user_id) {
    let local_user_id = localStorage.getItem("user_id");
    let local_last_user_id = localStorage.getItem("last_user_id");

    user_id = local_user_id || local_last_user_id;
  }

  // dearest data miner, please don't abuse this.
  fetch("https://gt-logs.twhlynch.workers.dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(action && { action }),
      ...(user_id && { user_id }),
      ...(user_name && { user_name }),
      ...(level_id && { level_id }),
    }),
  });
}
